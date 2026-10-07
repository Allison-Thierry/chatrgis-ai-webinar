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
          "a, button:not([data-advances-beat]), input, select, textarea, [contenteditable='true']",
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

        if (event.key === "Escape" && root.classList.contains("is-drawer-open")) {
          event.preventDefault();
          this.closeDrawer();
          return;
        }

        if (isEditable || isPersistentControl || root.classList.contains("is-drawer-open")) return;

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

      const leavingOpening = this.currentIndex === 0 && targetIndex > 0;
      const isFirstLaunch = leavingOpening && !this.hasStarted;
      const transitionDelay = immediate || reducedMotion.matches ? 0 : isFirstLaunch ? 290 : 60;
      const unlockDelay = immediate || reducedMotion.matches ? 20 : 1120;

      this.isTransitioning = true;
      root.classList.add("is-reacting");

      const activationTimer = window.setTimeout(() => {
        this.currentIndex = targetIndex;
        this.hasStarted ||= targetIndex > 0;
        this.render({ immediate });

        if (targetIndex === 0) {
          this.setInfoOpen(true);
        } else if (leavingOpening) {
          this.setInfoOpen(false);
        }
      }, transitionDelay);

      const unlockTimer = window.setTimeout(() => {
        root.classList.remove("is-reacting");
        this.isTransitioning = false;
        this.updateControls();
      }, unlockDelay);

      this.transitionTimers = [activationTimer, unlockTimer];
    }

    render({ immediate = false } = {}) {
      const current = this.manifest[this.currentIndex];
      if (!current) return;
      const sectionId = current.sectionId ?? current.id;

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
      this.beginTimeline(current);
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

    beginTimeline(beat) {
      this.cancelTimeline();
      const section = this.sections.get(beat.sectionId ?? beat.id);
      if (!beat.timeline || !section) {
        root.dataset.timeline = "idle";
        return;
      }

      const className = beat.timeline.className ?? "is-sequencing";
      section.classList.remove(className, "is-settled");
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
        section.classList.remove("is-sequencing", "is-entering", "is-unlocking", "is-settled");
      });
      this.activeTimelineClass = null;
    }

    interruptTransition() {
      this.transitionTimers.forEach((timer) => window.clearTimeout(timer));
      this.transitionTimers = [];
      this.isTransitioning = false;
      root.classList.remove("is-reacting");
      this.updateControls();
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
    get currentBeat() {
      return controller.manifest[controller.currentIndex];
    },
  };
})();
