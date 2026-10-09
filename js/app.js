(() => {
  "use strict";

  const root = document.getElementById("experience");
  const stage = document.getElementById("stage");
  const announcement = document.getElementById("beatAnnouncement");
  const beatNumber = document.getElementById("currentBeatNumber");
  const totalBeatNumber = document.getElementById("totalBeatNumber");
  const infoToggle = document.getElementById("webinarInfoToggle");
  const drawer = document.getElementById("courseDrawer");
  const drawerTrigger = document.getElementById("courseDrawerTrigger");
  const drawerClose = document.getElementById("courseDrawerClose");
  const drawerScrim = document.getElementById("drawerScrim");
  const caseOneThread = document.getElementById("caseOneChatThread");
  const caseTwoThread = document.getElementById("caseTwoChatThread");
  const chartLightbox = document.getElementById("chartLightbox");
  const chartLightboxImage = document.getElementById("chartLightboxImage");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!root || !stage) return;

  function mountComponentTemplates() {
    document.querySelectorAll("[data-component-template]").forEach((host) => {
      if (host.dataset.componentMounted === "true") return;
      const template = document.getElementById(host.dataset.componentTemplate);
      if (!(template instanceof HTMLTemplateElement)) return;
      host.append(template.content.cloneNode(true));
      host.dataset.componentMounted = "true";
    });
  }

  mountComponentTemplates();

  class PresentationController {
    constructor(manifest) {
      this.manifest = manifest;
      this.sections = new Map(
        [...stage.querySelectorAll("[data-beat-id]")].map((section) => [
          section.dataset.beatId,
          section,
        ]),
      );
      this.currentIndex = 0;
      this.isTransitioning = false;
      this.isBeatLocked = false;
      this.hasStarted = false;
      this.timelineTimer = null;
      this.activeTimelineClass = null;
      this.transitionTimers = [];
      this.drawerPreviouslyFocused = null;
      this.highlightTimer = null;
      this.coursePulseTimers = new WeakMap();
      this.visitedBeatIds = new Set();
      this.typingFrame = null;

      this.validateManifest();
      this.bindEvents();
      this.render({ immediate: true });
    }

    validateManifest() {
      this.manifest.forEach(({ id, sectionId }) => {
        const resolvedSectionId = sectionId ?? id;
        if (!this.sections.has(resolvedSectionId)) {
          console.warn(`[ChatRGIS Webinar] Missing section for beat: ${id} (${resolvedSectionId})`);
        }
      });
    }

    bindEvents() {
      stage.addEventListener("click", (event) => {
        const explicitAdvance = event.target.closest("[data-advances-beat]");
        const otherInteractive = event.target.closest(
          "a, button:not([data-advances-beat]), input, select, textarea, [contenteditable='true'], [data-no-advance]",
        );

        if (otherInteractive) return;

        if (explicitAdvance || event.target === stage || event.target.closest(".beat")) {
          this.next();
        }
      });

      document.addEventListener("keydown", (event) => {
        const target = event.target;
        const isEditable =
          target instanceof HTMLElement &&
          (target.matches("input, textarea, select, [contenteditable='true']") ||
            target.closest("[contenteditable='true']"));
        const isPersistentControl =
          target instanceof HTMLElement &&
          target.closest(
            ".webinar-info, .course-drawer, .course-drawer__trigger, .presenter-controls",
          );
        const isNoAdvanceControl =
          target instanceof HTMLElement &&
          target.closest(
            "[data-no-advance], a, button:not([data-advances-beat]), input, select, textarea, [contenteditable='true']",
          );

        if (event.key === "Escape" && chartLightbox?.classList.contains("is-open")) {
          event.preventDefault();
          this.closeChartLightbox();
          return;
        }

        if (event.key === "Escape" && root.classList.contains("is-drawer-open")) {
          event.preventDefault();
          this.closeDrawer();
          return;
        }

        if (
          isEditable ||
          isPersistentControl ||
          isNoAdvanceControl ||
          root.classList.contains("is-drawer-open")
        ) return;

        if (event.key === "ArrowRight" || event.code === "Space") {
          event.preventDefault();
          this.next();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          this.previous();
        } else if (event.key === "Home") {
          event.preventDefault();
          this.home();
        }
      });

      document.querySelectorAll("[data-action]").forEach((control) => {
        control.addEventListener("click", (event) => {
          event.stopPropagation();
          const action = control.dataset.action;
          if (action === "next") this.next();
          if (action === "previous") this.previous();
          if (action === "home") this.home();
        });
      });

      infoToggle?.addEventListener("click", (event) => {
        event.stopPropagation();
        const shouldOpen = root.dataset.info === "collapsed";
        this.setInfoOpen(shouldOpen);
      });

      drawerTrigger?.addEventListener("click", (event) => {
        event.stopPropagation();
        this.openDrawer();
      });

      drawerClose?.addEventListener("click", (event) => {
        event.stopPropagation();
        this.closeDrawer();
      });

      drawerScrim?.addEventListener("click", (event) => {
        event.stopPropagation();
        this.closeDrawer();
      });

      drawer?.addEventListener("click", (event) => {
        event.stopPropagation();
        const card = event.target.closest(".course-card");
        if (card) this.pulseCourse(card);
      });
      drawer?.addEventListener("keydown", (event) => {
        this.keepFocusInDrawer(event);
        const card = event.target.closest(".course-card");
        if (card && (event.key === "Enter" || event.code === "Space")) {
          event.preventDefault();
          this.pulseCourse(card);
        }
      });

      document.querySelectorAll("[data-copy-prompt]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.copyPrompt(button);
        });
      });

      document.querySelectorAll("[data-mega-toggle]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.toggleMegaPrompt(button);
        });
      });

      document.querySelectorAll("[data-chart-expand]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.openChartLightbox(button);
        });
      });

      document.querySelectorAll("[data-chart-close]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.closeChartLightbox();
        });
      });
    }

    next() {
      if (this.isBeatLocked || this.isTransitioning) return;
      this.goTo(this.currentIndex + 1);
    }

    previous() {
      if (this.isTransitioning) {
        this.interruptTransition();
        if (this.currentIndex === 0) return;
      }
      if (this.isBeatLocked) this.cancelTimeline();
      this.goTo(this.currentIndex - 1);
    }

    home() {
      this.closeDrawer({ restoreFocus: false });
      if (this.isTransitioning) this.interruptTransition();
      if (this.isBeatLocked) this.cancelTimeline();
      if (this.currentIndex === 0) {
        this.setInfoOpen(true);
        return;
      }
      this.goTo(0, { immediate: reducedMotion.matches });
    }

    goTo(index, { immediate = false } = {}) {
      const targetIndex = Math.max(0, Math.min(index, this.manifest.length - 1));
      if (targetIndex === this.currentIndex || this.isTransitioning) return;

      const previousIndex = this.currentIndex;
      const currentBeat = this.manifest[previousIndex];
      const targetBeat = this.manifest[targetIndex];
      const currentSectionId = currentBeat?.sectionId ?? currentBeat?.id;
      const targetSectionId = targetBeat?.sectionId ?? targetBeat?.id;
      const leavingOpening = this.currentIndex === 0 && targetIndex > 0;
      const isFirstLaunch = leavingOpening && !this.hasStarted;
      const isCaseDive = currentSectionId === "case-hub" && ["case-1", "case-2"].includes(targetSectionId);
      const isHubReturn = ["case-1", "case-2"].includes(currentSectionId) && targetSectionId === "case-hub";
      const isBreatherEntry = currentBeat?.id === "case-1-automation-ideas" && targetBeat?.id === "breather-1";
      const isBreatherReturn = currentBeat?.id === "breather-1" && targetBeat?.id === "case-1-automation-ideas";
      const isBreatherHubReturn = currentBeat?.id === "breather-1" && targetBeat?.id === "case-hub-case-2";
      const isHubBreatherReturn = currentBeat?.id === "case-hub-case-2" && targetBeat?.id === "breather-1";
      const isBreatherTwoEntry = currentBeat?.id === "case-2-message-10" && targetBeat?.id === "breather-2-angry";
      const isBreatherTwoReturn = currentBeat?.id === "breather-2-angry" && targetBeat?.id === "case-2-message-10";
      const transitionDelay = immediate || reducedMotion.matches
        ? 0
        : isCaseDive || isHubReturn
          ? 620
          : isBreatherHubReturn || isHubBreatherReturn
            ? 720
          : isBreatherEntry
            ? 820
            : isBreatherReturn
              ? 620
            : isBreatherTwoEntry
              ? 760
              : isBreatherTwoReturn
                ? 620
          : isFirstLaunch
            ? 290
            : 60;
      const unlockDelay = immediate || reducedMotion.matches
        ? 20
        : isCaseDive || isHubReturn || isBreatherHubReturn || isHubBreatherReturn
          ? 1600
          : isBreatherEntry || isBreatherReturn || isBreatherTwoEntry || isBreatherTwoReturn
            ? 1700
          : 1120;

      this.isTransitioning = true;
      root.classList.add("is-reacting");
      root.classList.toggle("is-diving-case", isCaseDive);
      root.classList.toggle("is-returning-hub", isHubReturn);
      root.classList.toggle("is-entering-breather", isBreatherEntry);
      root.classList.toggle("is-returning-case-one", isBreatherReturn);
      root.classList.toggle("is-breather-to-hub", isBreatherHubReturn);
      root.classList.toggle("is-hub-to-breather", isHubBreatherReturn);
      root.classList.toggle("is-entering-breather-two", isBreatherTwoEntry);
      root.classList.toggle("is-returning-case-two", isBreatherTwoReturn);

      const activationTimer = window.setTimeout(() => {
        this.currentIndex = targetIndex;
        this.hasStarted ||= targetIndex > 0;
        this.render({
          immediate,
          direction: targetIndex > previousIndex ? "forward" : "backward",
        });

        if (targetIndex === 0) {
          this.setInfoOpen(true);
        } else if (leavingOpening) {
          this.setInfoOpen(false);
        }
      }, transitionDelay);

      const unlockTimer = window.setTimeout(() => {
        root.classList.remove(
          "is-reacting",
          "is-diving-case",
          "is-returning-hub",
          "is-entering-breather",
          "is-returning-case-one",
          "is-breather-to-hub",
          "is-hub-to-breather",
          "is-entering-breather-two",
          "is-returning-case-two",
        );
        this.isTransitioning = false;
        this.updateControls();
      }, unlockDelay);

      this.transitionTimers = [activationTimer, unlockTimer];
    }

    render({ immediate = false, direction = "forward" } = {}) {
      const current = this.manifest[this.currentIndex];
      if (!current) return;
      const sectionId = current.sectionId ?? current.id;
      const hasVisited = this.visitedBeatIds.has(current.id);

      this.sections.forEach((section, id) => {
        const isActive = id === sectionId;
        section.classList.toggle("is-active", isActive);
        section.setAttribute("aria-hidden", String(!isActive));
      });

      root.dataset.beat = sectionId;
      root.dataset.beatState = current.id;
      root.classList.toggle("has-started", this.currentIndex > 0);
      beatNumber.textContent = String(this.currentIndex + 1);
      if (totalBeatNumber) totalBeatNumber.textContent = String(this.manifest.length);
      announcement.textContent = current.label;

      if (current.hubState) this.setCaseHubState(current.hubState);
      if (current.caseOneState) {
        this.setCaseOneState(current.caseOneState, {
          animate: !immediate && direction === "forward" && !hasVisited,
        });
      }
      if (current.caseTwoState) {
        this.setCaseTwoState(current.caseTwoState, {
          animate: !immediate && direction === "forward" && !hasVisited,
        });
      }
      if (current.breatherTwoState) {
        this.setBreatherTwoState(current.breatherTwoState);
      }
      this.beginTimeline(current, {
        skip: Boolean(hasVisited && current.replayOnReturn === false),
      });
      this.updateControls();

      if (current.caseProgress) {
        this.setCaseProgress(current.caseProgress);
      } else {
        this.setCaseProgress({ active: 0, complete: 0 });
      }

      root.dispatchEvent(
        new CustomEvent("webinar:beat-change", {
          detail: {
            index: this.currentIndex,
            beat: current,
            immediate,
          },
        }),
      );

      this.visitedBeatIds.add(current.id);
    }

    updateControls() {
      const previousControl = document.querySelector('[data-action="previous"]');
      const nextControl = document.querySelector('[data-action="next"]');
      if (previousControl) previousControl.disabled = this.currentIndex === 0;
      if (nextControl) {
        nextControl.disabled =
          this.currentIndex === this.manifest.length - 1 ||
          this.isBeatLocked ||
          this.isTransitioning;
      }
    }

    beginTimeline(beat, { skip = false } = {}) {
      this.cancelTimeline();
      const section = this.sections.get(beat.sectionId ?? beat.id);
      if (!beat.timeline || !section) {
        root.dataset.timeline = "idle";
        return;
      }

      const className = beat.timeline.className ?? "is-sequencing";
      section.classList.remove(className, "is-settled");
      if (skip) {
        section.classList.add("is-settled");
        root.dataset.timeline = "settled";
        this.isBeatLocked = false;
        return;
      }
      void section.offsetWidth;
      section.classList.add(className);
      this.activeTimelineClass = className;

      this.isBeatLocked = true;
      root.dataset.timeline = "running";

      const duration = reducedMotion.matches
        ? beat.timeline.reducedDuration ?? 250
        : beat.timeline.duration;

      this.timelineTimer = window.setTimeout(() => {
        this.timelineTimer = null;
        this.isBeatLocked = false;
        root.dataset.timeline = "settled";
        section.classList.add("is-settled");
        announcement.textContent = `${beat.label}. Sequence complete.`;
        this.updateControls();
      }, duration);
    }

    cancelTimeline() {
      if (this.timelineTimer) window.clearTimeout(this.timelineTimer);
      this.timelineTimer = null;
      this.isBeatLocked = false;
      root.dataset.timeline = "idle";
      this.sections.forEach((section) => {
        if (this.activeTimelineClass) section.classList.remove(this.activeTimelineClass);
        section.classList.remove(
          "is-sequencing",
          "is-entering",
          "is-unlocking",
          "is-scenario-entering",
          "is-chat-entering",
          "is-message-arriving",
          "is-ideas-entering",
          "is-breather-entering",
          "is-case-two-scenario-entering",
          "is-case-two-chat-entering",
          "is-breather-two-angry-entering",
          "is-breather-two-loved-entering",
          "is-settled",
        );
      });
      this.activeTimelineClass = null;
    }

    interruptTransition() {
      this.transitionTimers.forEach((timer) => window.clearTimeout(timer));
      this.transitionTimers = [];
      this.isTransitioning = false;
      root.classList.remove(
        "is-reacting",
        "is-diving-case",
        "is-returning-hub",
        "is-entering-breather",
        "is-returning-case-one",
        "is-breather-to-hub",
        "is-hub-to-breather",
        "is-entering-breather-two",
        "is-returning-case-two",
      );
      this.updateControls();
    }

    setCaseOneState({ scene = "scenario", messageCount = 0 } = {}, { animate = false } = {}) {
      return this.setConversationState(
        "case-1",
        caseOneThread,
        { scene, messageCount },
        { animate, eventName: "webinar:case-one-change" },
      );
    }

    setCaseTwoState({ scene = "scenario", messageCount = 0 } = {}, { animate = false } = {}) {
      return this.setConversationState(
        "case-2",
        caseTwoThread,
        { scene, messageCount },
        { animate, eventName: "webinar:case-two-change" },
      );
    }

    setBreatherTwoState(state = "angry") {
      const section = this.sections.get("breather-2");
      if (!section) return false;
      section.dataset.breatherState = state;
      root.dispatchEvent(
        new CustomEvent("webinar:breather-two-change", {
          detail: { state },
        }),
      );
      return true;
    }

    setConversationState(sectionId, thread, { scene = "scenario", messageCount = 0 } = {}, { animate = false, eventName = "webinar:conversation-change" } = {}) {
      const section = this.sections.get(sectionId);
      if (!section) return false;

      if (this.typingFrame) window.cancelAnimationFrame(this.typingFrame);
      this.typingFrame = null;
      section.dataset.caseScene = scene;
      section.dataset.messageCount = String(messageCount);

      const messages = [...section.querySelectorAll("[data-message-index]")];
      messages.forEach((message) => {
        const index = Number(message.dataset.messageIndex);
        const visible = scene === "conversation" && index <= messageCount;
        const current = visible && index === messageCount;
        const isUser = message.classList.contains("case-chat-message--user");
        const isMega = message.classList.contains("case-chat-message--mega");
        message.dataset.visible = String(visible);
        message.classList.toggle("is-current", current);
        message.classList.remove("is-typing", "is-complete");

        const typingOutput = message.querySelector(".case-chat-message__typing");
        if (typingOutput) typingOutput.textContent = "";

        if (visible && (!current || !animate)) {
          message.classList.add("is-complete");
        } else if (visible && current && isUser && !isMega) {
          this.typeUserMessage(message, thread);
        } else if (visible) {
          message.classList.add("is-complete");
        }
      });

      if (messageCount < 9) {
        section.querySelectorAll(".case-chat-message--mega.is-expanded").forEach((message) => {
          message.classList.remove("is-expanded");
          message.querySelector("[data-mega-toggle]")?.setAttribute("aria-expanded", "false");
        });
      }

      if (scene === "conversation" && messageCount > 0) {
        window.requestAnimationFrame(() => this.scrollToMessage(messageCount, { smooth: animate, thread }));
      }

      root.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { scene, messageCount, animate },
        }),
      );
      return true;
    }

    typeUserMessage(message, thread = caseOneThread) {
      const source = message.querySelector(".prompt-copy-source");
      const output = message.querySelector(".case-chat-message__typing");
      if (!(source instanceof HTMLTextAreaElement) || !output) {
        message.classList.add("is-complete");
        return;
      }

      const text = source.value.trim();
      const duration = Math.min(2900, Math.max(1500, text.length * 10));
      const startedAt = performance.now();
      let lastScrollAt = 0;
      message.classList.add("is-typing");

      const tick = (now) => {
        const progress = reducedMotion.matches ? 1 : Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 2.2);
        const length = Math.max(1, Math.round(text.length * eased));
        output.textContent = text.slice(0, length);

        if (now - lastScrollAt > 90 && thread) {
          thread.scrollTop = thread.scrollHeight;
          lastScrollAt = now;
        }

        if (progress < 1) {
          this.typingFrame = window.requestAnimationFrame(tick);
          return;
        }

        this.typingFrame = null;
        message.classList.remove("is-typing");
        message.classList.add("is-complete");
        window.requestAnimationFrame(() => this.scrollToMessage(Number(message.dataset.messageIndex), { thread }));
      };

      this.typingFrame = window.requestAnimationFrame(tick);
    }

    scrollToMessage(messageIndex, { smooth = true, thread = caseOneThread } = {}) {
      if (!thread) return;
      const message = thread.querySelector(`[data-message-index="${messageIndex}"]`);
      if (!message) return;
      const top = Math.max(0, message.offsetTop - 24);
      thread.scrollTo({
        top,
        behavior: smooth && !reducedMotion.matches ? "smooth" : "auto",
      });
    }

    async copyPrompt(button) {
      const message = button.closest(".case-chat-message");
      const source = message?.querySelector(".prompt-copy-source");
      if (!(source instanceof HTMLTextAreaElement)) return;

      const text = source.value.trim();
      let copied = false;
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        const fallback = document.createElement("textarea");
        fallback.value = text;
        fallback.setAttribute("readonly", "");
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        document.body.append(fallback);
        fallback.select();
        copied = document.execCommand("copy");
        fallback.remove();
      }

      const label = button.querySelector("span");
      if (!label) return;
      window.clearTimeout(button.copyFeedbackTimer);
      label.textContent = copied ? "Copied" : "Copy failed";
      button.classList.toggle("is-copied", copied);
      button.copyFeedbackTimer = window.setTimeout(() => {
        label.textContent = "Copy prompt";
        button.classList.remove("is-copied");
      }, 1600);
    }

    toggleMegaPrompt(button) {
      const message = button.closest(".case-chat-message--mega");
      if (!message) return;
      const expanded = !message.classList.contains("is-expanded");
      message.classList.toggle("is-expanded", expanded);
      button.setAttribute("aria-expanded", String(expanded));
      const hint = button.querySelector(".mega-prompt__hint");
      if (hint) hint.textContent = expanded ? "Hide the full brief" : "View the full brief";
      window.requestAnimationFrame(() => {
        if (caseTwoThread) {
          const top = Math.max(0, message.offsetTop - 18);
          caseTwoThread.scrollTo({ top, behavior: reducedMotion.matches ? "auto" : "smooth" });
        }
      });
    }

    openChartLightbox(button) {
      if (!chartLightbox || !(chartLightboxImage instanceof HTMLImageElement)) return;
      const source = button.dataset.chartExpand;
      if (!source) return;
      chartLightboxImage.src = source;
      chartLightboxImage.alt = button.dataset.chartAlt ?? "Expanded chart image";
      chartLightbox.classList.add("is-open");
      chartLightbox.setAttribute("aria-hidden", "false");
      root.classList.add("is-chart-open");
      chartLightbox.querySelector("[data-chart-close]")?.focus();
    }

    closeChartLightbox() {
      if (!chartLightbox) return;
      chartLightbox.classList.remove("is-open");
      chartLightbox.setAttribute("aria-hidden", "true");
      root.classList.remove("is-chart-open");
    }

    setInfoOpen(isOpen) {
      root.dataset.info = isOpen ? "open" : "collapsed";
      infoToggle?.setAttribute("aria-expanded", String(isOpen));
    }

    openDrawer({ focus = true } = {}) {
      if (root.classList.contains("is-drawer-open")) return;
      this.drawerPreviouslyFocused = document.activeElement;
      root.classList.add("is-drawer-open");
      drawer?.setAttribute("aria-hidden", "false");
      drawer?.removeAttribute("inert");
      drawerTrigger?.setAttribute("aria-expanded", "true");
      if (focus) window.setTimeout(() => drawerClose?.focus(), 120);
    }

    closeDrawer({ restoreFocus = true } = {}) {
      if (!root.classList.contains("is-drawer-open")) return;
      root.classList.remove("is-drawer-open");
      drawer?.setAttribute("aria-hidden", "true");
      drawer?.setAttribute("inert", "");
      drawerTrigger?.setAttribute("aria-expanded", "false");
      if (restoreFocus && this.drawerPreviouslyFocused instanceof HTMLElement) {
        this.drawerPreviouslyFocused.focus();
      }
    }

    keepFocusInDrawer(event) {
      if (event.key !== "Tab" || !root.classList.contains("is-drawer-open")) return;
      const focusable = [
        ...drawer.querySelectorAll(
          "button:not(:disabled), a[href], [tabindex='0'], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
        ),
      ];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    setCaseProgress({ active = 0, complete = 0 } = {}) {
      document.querySelectorAll(".case-node").forEach((node, index) => {
        const caseNumber = index + 1;
        let status = "upcoming";
        if (caseNumber <= complete) status = "complete";
        else if (caseNumber === active) status = "active";

        node.dataset.status = status;
        const readableStatus = status === "complete" ? "complete" : status;
        const srLabel = node.querySelector(".sr-only");
        if (srLabel) srLabel.textContent = `Case ${caseNumber}: ${readableStatus}`;
      });
    }

    setCaseHubState({ active = 0, complete = 0 } = {}) {
      const hub = this.sections.get("case-hub");
      if (!hub) return false;

      const stateName = active > 0 ? `active-${active}` : complete > 0 ? `complete-${complete}` : "teaser";
      hub.dataset.hubState = stateName;

      hub.querySelectorAll(".case-exhibit[data-case-id]").forEach((exhibit) => {
        const caseNumber = Number(exhibit.dataset.caseId);
        let state = "locked";
        if (caseNumber <= complete) state = "completed";
        else if (caseNumber === active) state = "active";

        exhibit.dataset.state = state;
        if (state === "active") exhibit.setAttribute("aria-current", "step");
        else exhibit.removeAttribute("aria-current");
      });

      root.dispatchEvent(
        new CustomEvent("webinar:case-hub-change", {
          detail: { active, complete },
        }),
      );
      return true;
    }

    pulseCourse(card) {
      const activeTimer = this.coursePulseTimers.get(card);
      if (activeTimer) window.clearTimeout(activeTimer);

      card.classList.remove("is-attention-pulse");
      void card.offsetWidth;
      card.classList.add("is-attention-pulse");

      const timer = window.setTimeout(() => {
        card.classList.remove("is-attention-pulse");
        this.coursePulseTimers.delete(card);
      }, 1200);
      this.coursePulseTimers.set(card, timer);
    }

    /**
     * Future beat hooks can call:
     * webinar.highlightCourse("intermediate-3", { open: true, duration: 5000 })
     */
    highlightCourse(courseId, { open = true, duration = 0 } = {}) {
      window.clearTimeout(this.highlightTimer);
      document
        .querySelectorAll(".course-card.is-highlighted")
        .forEach((card) => card.classList.remove("is-highlighted"));

      const target = document.querySelector(`[data-course-id="${CSS.escape(courseId)}"]`);
      if (!target) return false;
      target.classList.add("is-highlighted");
      target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
      if (open) this.openDrawer({ focus: false });

      if (duration > 0) {
        this.highlightTimer = window.setTimeout(() => {
          target.classList.remove("is-highlighted");
        }, duration);
      }
      return true;
    }
  }

  const controller = new PresentationController(window.WEBINAR_BEATS ?? []);

  // Small public API for later scenes and live-demo cues.
  window.webinar = {
    next: () => controller.next(),
    previous: () => controller.previous(),
    home: () => controller.home(),
    goTo: (index, options) => controller.goTo(index, options),
    openCourses: () => controller.openDrawer(),
    closeCourses: () => controller.closeDrawer(),
    highlightCourse: (courseId, options) => controller.highlightCourse(courseId, options),
    setCaseProgress: (state) => controller.setCaseProgress(state),
    setCaseHubState: (state) => controller.setCaseHubState(state),
    setCaseOneState: (state, options) => controller.setCaseOneState(state, options),
    setCaseTwoState: (state, options) => controller.setCaseTwoState(state, options),
    setBreatherTwoState: (state) => controller.setBreatherTwoState(state),
    get currentBeat() {
      return controller.manifest[controller.currentIndex];
    },
  };
})();
