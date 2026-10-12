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
  const caseThreeThread = document.getElementById("caseThreeChatThread");
  const chartLightbox = document.getElementById("chartLightbox");
  const chartLightboxImage = document.getElementById("chartLightboxImage");
  const recapOpenButton = document.getElementById("recapOpen");
  const recapOverlay = document.getElementById("recapOverlay");
  const recapDialog = document.getElementById("recapDialog");
  const recapContent = document.getElementById("recapContent");
  const recapPrevious = document.getElementById("recapPrevious");
  const recapNext = document.getElementById("recapNext");
  const recapProgressCount = document.getElementById("recapProgressCount");
  const recapProgressFill = document.getElementById("recapProgressFill");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const RECAP_SECTIONS = [
    {
      number: "01",
      title: "The Bigger Picture",
      icon: "sparkles",
      bullets: [
        "AI is already becoming part of everyday work. The goal is to help people use it effectively.",
        "We're moving from **one request → one answer** to **a goal → multiple steps → a result**.",
        "Don't just ask what AI can tell you. Ask what it could *do* for you.",
      ],
    },
    {
      number: "02",
      title: "Getting Around ChatRGIS",
      icon: "compass",
      bullets: [
        "Use conversations for everyday requests, research, files and follow-up questions.",
        "Explore Models, dedicated RGIS Assistants, Workspace and personal settings.",
        "Use feedback to help improve ChatRGIS, and explore the AI lessons on WeLearn to go further.",
      ],
    },
    {
      number: "03",
      title: "Case 01: STAY AHEAD",
      icon: "radar",
      bullets: [
        "Start with a simple question, then build on the conversation to discover opportunities.",
        "Web Search helps find recent information. **Ask for sources, then verify them before acting.**",
        "You don't need to know the feature name: describe your goal and ask ChatRGIS how to achieve it.",
        "Use automations for recurring research, briefings and meaningful-change alerts.",
      ],
      quote: "“We started by asking ChatRGIS a question. We ended up giving it a job.”",
    },
    {
      number: "04",
      title: "Breather: CAN YOU SMELL THE AI?",
      icon: "scanText",
      bullets: [
        "AI writing often has recognisable habits: em dashes, enthusiastic agreement, dramatic phrases…",
        "These are **patterns, not proof** that a text was AI-generated.",
        "AI writing styles evolve, and our own writing habits may be influenced by them too.",
      ],
    },
    {
      number: "05",
      title: "Case 02: FIND THE STORY",
      icon: "chart",
      bullets: [
        "**Talk to your files.** Upload a spreadsheet, start with one question and explore through follow-ups.",
        "Ask ChatRGIS to explain calculations, investigate outliers and highlight unexpected findings.",
        "Data can reveal patterns, but it doesn't automatically explain their causes. Apply your operational knowledge.",
        "A basic request often produces a basic result. A detailed brief gives AI more direction to create something impressive.",
      ],
      quote: "“Don't just analyse your files. Talk to them.”",
    },
    {
      number: "06",
      title: "Breather: OUR RELATIONSHIP WITH AI",
      icon: "heartHandshake",
      bullets: [
        "Ever argued with AI? Sometimes the real problem is that we haven't clearly explained what we want.",
        "AI doesn't need politeness, but **clarity, context and precise instructions** make a difference.",
        "ChatRGIS doesn't automatically learn company-wide facts from individual conversations. Shared RGIS knowledge must be managed deliberately.",
      ],
    },
    {
      number: "07",
      title: "Case 03: MAKE IT REAL",
      icon: "blocks",
      bullets: [
        "You don't need coding skills or technical vocabulary to start with an idea.",
        "**Chat A: Think with me.** Ask AI to interview you, clarify your needs and write a detailed brief.",
        "**Chat B: Build it.** Give a fresh conversation the final prompt and the relevant files.",
        "Review the finished result, including calculations, functionality and any AI-generated text, before sharing it.",
      ],
      quote: "“You don't need to know how to build it. You need to explain what you're trying to achieve.”",
    },
    {
      number: "08",
      title: "Final Takeaways",
      icon: "checkList",
      bullets: [
        "ChatRGIS has improved significantly. Give it another try if your first experience was disappointing.",
        "**Keep RGIS work in approved tools**, rather than sharing company information with unapproved public AI services.",
        "Check AI outputs before relying on them, especially sources, numbers and business conclusions.",
        "Share feedback and ideas. Your experience can help make ChatRGIS better for everyone.",
      ],
      quote: "“Don't copy the examples. Copy the way we approached them.”",
    },
  ];

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

  async function mountMegaDocuments() {
    const documents = [...document.querySelectorAll("[data-mega-document]")];
    await Promise.all(documents.map(async (documentHost) => {
      const message = documentHost.closest(".case-chat-message--mega");
      const source = message?.querySelector(".prompt-copy-source");
      if (!(source instanceof HTMLTextAreaElement)) return;

      const sourceUrl = source.dataset.sourceUrl;
      if (sourceUrl && !source.value.trim()) {
        try {
          const response = await fetch(sourceUrl);
          if (!response.ok) throw new Error(`Prompt source returned ${response.status}`);
          source.value = (await response.text()).trim();
        } catch (error) {
          console.warn("[ChatRGIS Webinar] Could not load the MEGA MEGA PROMPT", error);
          documentHost.textContent = "The complete brief could not be loaded.";
          return;
        }
      }

      const lines = source.value.replace(/\r/g, "").split("\n");
      let list = null;
      lines.forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) {
          list = null;
          return;
        }

        if (/^(?:[A-Z][A-Z /&()\-—0-9]+|\d+\s+—\s+.+)$/.test(line) && line.length < 110) {
          const heading = document.createElement("h3");
          heading.textContent = line;
          documentHost.append(heading);
          list = null;
          return;
        }

        if (line.startsWith("- ")) {
          if (!list) {
            list = document.createElement("ul");
            documentHost.append(list);
          }
          const item = document.createElement("li");
          item.textContent = line.slice(2);
          list.append(item);
          return;
        }

        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        documentHost.append(paragraph);
        list = null;
      });
    }));
  }

  mountMegaDocuments();

  class RecapOverlay {
    constructor() {
      this.currentStep = 0;
      this.totalSteps = RECAP_SECTIONS.length + 1;
      this.isOpen = false;
      this.returnFocusTo = null;
      this.copyFeedbackTimer = null;
      this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);

      this.bindEvents();
      this.render();
    }

    bindEvents() {
      recapOpenButton?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.open();
      });

      recapOverlay?.addEventListener("click", (event) => {
        event.stopPropagation();
        const closeControl = event.target.closest("[data-recap-close]");
        if (closeControl) this.close();
      });

      recapPrevious?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.previous();
      });

      recapNext?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.next();
      });

      recapContent?.addEventListener("click", (event) => {
        const copyButton = event.target.closest("[data-recap-copy]");
        const startButton = event.target.closest("[data-recap-start]");
        if (!copyButton && !startButton) return;

        event.preventDefault();
        event.stopPropagation();
        if (copyButton) this.copyFullRecap(copyButton);
        if (startButton) this.goTo(0);
      });

      document.addEventListener("keydown", this.handleDocumentKeydown, true);
    }

    open() {
      if (!recapOverlay || !recapDialog || this.isOpen) return;
      this.returnFocusTo = recapOpenButton ?? document.activeElement;
      this.currentStep = 0;
      this.isOpen = true;
      this.render();
      if (recapContent) recapContent.scrollTop = 0;
      recapDialog.scrollTop = 0;

      root.classList.add("is-recap-open");
      recapOverlay.removeAttribute("inert");
      recapOverlay.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        recapOverlay.classList.add("is-open");
        window.setTimeout(() => recapDialog.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 40);
      });
    }

    close() {
      if (!recapOverlay || !this.isOpen) return;
      this.isOpen = false;
      window.clearTimeout(this.copyFeedbackTimer);
      recapOverlay.classList.remove("is-open");
      recapOverlay.setAttribute("aria-hidden", "true");
      recapOverlay.setAttribute("inert", "");
      root.classList.remove("is-recap-open");

      const focusTarget = this.returnFocusTo instanceof HTMLElement
        ? this.returnFocusTo
        : recapOpenButton;
      window.setTimeout(() => focusTarget?.focus({ preventScroll: true }), 0);
    }

    next() {
      if (!this.isOpen || this.currentStep >= this.totalSteps - 1) return;
      this.goTo(this.currentStep + 1);
    }

    previous() {
      if (!this.isOpen || this.currentStep <= 0) return;
      this.goTo(this.currentStep - 1);
    }

    goTo(index) {
      const target = Math.max(0, Math.min(index, this.totalSteps - 1));
      if (target === this.currentStep) return;
      this.currentStep = target;
      this.render();
      if (recapContent) recapContent.scrollTop = 0;
      if (recapDialog) recapDialog.scrollTop = 0;
      recapDialog?.focus({ preventScroll: true });
    }

    render() {
      if (!recapContent || !recapProgressCount || !recapProgressFill || !recapPrevious || !recapNext) return;

      const visibleStep = this.currentStep + 1;
      recapProgressCount.textContent = `${String(visibleStep).padStart(2, "0")} / ${String(this.totalSteps).padStart(2, "0")}`;
      recapProgressFill.style.width = `${(visibleStep / this.totalSteps) * 100}%`;
      recapPrevious.disabled = this.currentStep === 0;
      recapNext.disabled = this.currentStep === this.totalSteps - 1;

      const nextLabel = recapNext.querySelector("span");
      if (nextLabel) {
        nextLabel.textContent = this.currentStep === RECAP_SECTIONS.length - 1
          ? "View Complete Recap"
          : "Next";
      }

      recapContent.replaceChildren(
        this.currentStep === RECAP_SECTIONS.length
          ? this.renderCompleteRecap()
          : this.renderSingleSection(RECAP_SECTIONS[this.currentStep]),
      );
    }

    renderSingleSection(section) {
      const step = document.createElement("div");
      step.className = "recap-step";
      step.innerHTML = `
        <article class="recap-card">
          <div class="recap-card__marker" aria-hidden="true">
            <span class="recap-card__icon">${this.iconMarkup(section.icon)}</span>
            <span class="recap-card__number">${section.number} / 08</span>
          </div>
          <div class="recap-card__body">
            <h3>${this.escapeHTML(section.title)}</h3>
            <ul>${section.bullets.map((bullet) => `<li>${this.formatInline(bullet)}</li>`).join("")}</ul>
            ${section.quote ? `<blockquote class="recap-card__quote">${this.escapeHTML(section.quote)}</blockquote>` : ""}
          </div>
        </article>
      `;
      return step;
    }

    renderCompleteRecap() {
      const step = document.createElement("div");
      step.className = "recap-step recap-step--complete";
      step.innerHTML = `
        <article class="recap-complete">
          <header class="recap-complete__intro">
            <div>
              <span class="recap-complete__kicker">09 / 09</span>
              <h3>THE COMPLETE RECAP</h3>
            </div>
            <button class="recap-copy-button" type="button" data-recap-copy>
              ${this.iconMarkup("copy")}
              <span>Copy Full Recap</span>
            </button>
          </header>
          <div class="recap-complete__sections">
            ${RECAP_SECTIONS.map((section) => `
              <section class="recap-complete__section">
                <span class="recap-complete__number" aria-hidden="true">${section.number}</span>
                <div>
                  <h4>${this.escapeHTML(section.title)}</h4>
                  <ul>${section.bullets.map((bullet) => `<li>${this.formatInline(bullet)}</li>`).join("")}</ul>
                  ${section.quote ? `<blockquote class="recap-complete__quote">${this.escapeHTML(section.quote)}</blockquote>` : ""}
                </div>
              </section>
            `).join("")}
          </div>
          <button class="recap-back-to-start" type="button" data-recap-start>
            ${this.iconMarkup("rewind")}
            <span>Back to Start</span>
          </button>
        </article>
      `;
      return step;
    }

    handleDocumentKeydown(event) {
      if (!this.isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.close();
        return;
      }

      if (event.key === "Tab") {
        this.keepFocusInside(event);
        event.stopImmediatePropagation();
        return;
      }

      const interactiveTarget = event.target instanceof HTMLElement &&
        event.target.closest("button, a, input, textarea, select, [contenteditable='true']");

      if (event.key === "ArrowRight" || (event.code === "Space" && !interactiveTarget)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.next();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.previous();
        return;
      }

      // The recap owns keyboard focus while open. Other keys may retain their
      // native behaviour (for example scrolling), but never reach the deck.
      event.stopImmediatePropagation();
    }

    keepFocusInside(event) {
      if (!recapDialog) return;
      const focusable = [...recapDialog.querySelectorAll(
        "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
      )].filter((element) => !element.hasAttribute("hidden") && element.offsetParent !== null);

      if (!focusable.length) {
        event.preventDefault();
        recapDialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === recapDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    async copyFullRecap(button) {
      const text = this.buildCopyText();
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          this.fallbackCopy(text);
        }
      } catch (_error) {
        this.fallbackCopy(text);
      }

      const label = button.querySelector("span");
      if (!label) return;
      window.clearTimeout(this.copyFeedbackTimer);
      label.textContent = "Copied!";
      button.classList.add("is-copied");
      this.copyFeedbackTimer = window.setTimeout(() => {
        label.textContent = "Copy Full Recap";
        button.classList.remove("is-copied");
      }, 1600);
    }

    fallbackCopy(text) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }

    buildCopyText() {
      return RECAP_SECTIONS.map((section) => {
        const lines = [
          `${section.number} — ${section.title}`,
          "",
          ...section.bullets.map((bullet) => `- ${this.stripInlineMarkup(bullet)}`),
        ];
        if (section.quote) lines.push("", "Key quote:", section.quote);
        return lines.join("\n");
      }).join("\n\n");
    }

    stripInlineMarkup(text) {
      return text.replace(/\*\*/g, "").replace(/\*/g, "");
    }

    formatInline(text) {
      return this.escapeHTML(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    }

    escapeHTML(value) {
      return value.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;",
      })[character]);
    }

    iconMarkup(icon) {
      const paths = {
        sparkles: '<path d="m10 2 1.1 3.1L14 6.2l-2.9 1.1L10 10.5 8.9 7.3 6 6.2l2.9-1.1ZM15.5 11l.7 2 1.8.7-1.8.7-.7 2-.7-2-1.8-.7 1.8-.7ZM4.5 11l.7 2 1.8.7-1.8.7-.7 2-.7-2-1.8-.7 1.8-.7Z" />',
        compass: '<circle cx="10" cy="10" r="7" /><path d="m12.8 7.2-1.6 4-4 1.6 1.6-4Z" />',
        radar: '<circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3" /><path d="M10 10 15 6M10 3v2M17 10h-2" />',
        scanText: '<path d="M6 3H4a1 1 0 0 0-1 1v2M14 3h2a1 1 0 0 1 1 1v2M17 14v2a1 1 0 0 1-1 1h-2M6 17H4a1 1 0 0 1-1-1v-2M6.5 8h7M6.5 11h7M6.5 14h4" />',
        chart: '<path d="M4 16V9M8 16V5M12 16v-4M16 16V3M3 16.5h14" />',
        heartHandshake: '<path d="M7.3 14.9 4.2 12a3.2 3.2 0 0 1 4.5-4.5L10 8.8l1.3-1.3a3.2 3.2 0 1 1 4.5 4.5l-3.1 2.9M7.2 10.7l2.1 2.1a1 1 0 0 0 1.4 0l1.8-1.8M5.7 12.9l1.1-1.1M8.3 15.8l1-1" />',
        blocks: '<rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="11" y="3" width="6" height="6" rx="1.5" /><rect x="7" y="11" width="6" height="6" rx="1.5" /><path d="M6 9v1.2h4M14 9v1.2h-4" />',
        checkList: '<path d="m4 5 1.5 1.5L8 4M10 5h6M4 10l1.5 1.5L8 9M10 10h6M4 15l1.5 1.5L8 14M10 15h6" />',
        copy: '<rect x="7" y="7" width="9" height="9" rx="2" /><path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />',
        rewind: '<path d="m8 5-5 5 5 5M17 5l-5 5 5 5" />',
      };
      return `<svg viewBox="0 0 20 20" aria-hidden="true">${paths[icon] ?? paths.sparkles}</svg>`;
    }
  }

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
      this.montageTimers = [];

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
          if (!button.closest(".beat.is-active")) return;
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
      const isCaseDive = currentSectionId === "case-hub" && ["case-1", "case-2", "case-3"].includes(targetSectionId);
      const isHubReturn = ["case-1", "case-2", "case-3"].includes(currentSectionId) && targetSectionId === "case-hub";
      const isBreatherEntry = currentBeat?.id === "case-1-automation-ideas" && targetBeat?.id === "breather-1";
      const isBreatherReturn = currentBeat?.id === "breather-1" && targetBeat?.id === "case-1-automation-ideas";
      const isBreatherHubReturn = currentBeat?.id === "breather-1" && targetBeat?.id === "case-hub-case-2";
      const isHubBreatherReturn = currentBeat?.id === "case-hub-case-2" && targetBeat?.id === "breather-1";
      const isBreatherTwoEntry = currentBeat?.id === "case-2-message-10" && targetBeat?.id === "breather-2-angry";
      const isBreatherTwoReturn = currentBeat?.id === "breather-2-angry" && targetBeat?.id === "case-2-message-10";
      const isBreatherTwoHubReturn = currentBeat?.id === "breather-2-both" && targetBeat?.id === "case-hub-case-3";
      const isHubBreatherTwoReturn = currentBeat?.id === "case-hub-case-3" && targetBeat?.id === "breather-2-both";
      const isCaseThreeClosingEntry = currentBeat?.id === "case-3-montage" && targetBeat?.id === "case-3-closing";
      const isCaseThreeConversationReturn = currentBeat?.id === "case-3-closing" && targetBeat?.id === "case-3-montage";
      const transitionDelay = immediate || reducedMotion.matches
        ? 0
        : isCaseDive || isHubReturn
          ? 620
          : isBreatherHubReturn || isHubBreatherReturn || isBreatherTwoHubReturn || isHubBreatherTwoReturn
            ? 720
          : isBreatherEntry
            ? 820
            : isBreatherReturn
              ? 620
            : isBreatherTwoEntry
              ? 760
              : isBreatherTwoReturn
                ? 620
                : isCaseThreeClosingEntry || isCaseThreeConversationReturn
                  ? 720
          : isFirstLaunch
            ? 290
            : 60;
      const unlockDelay = immediate || reducedMotion.matches
        ? 20
        : isCaseDive || isHubReturn || isBreatherHubReturn || isHubBreatherReturn || isBreatherTwoHubReturn || isHubBreatherTwoReturn
          ? 1600
          : isBreatherEntry || isBreatherReturn || isBreatherTwoEntry || isBreatherTwoReturn || isCaseThreeClosingEntry || isCaseThreeConversationReturn
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
      root.classList.toggle("is-breather-two-to-hub", isBreatherTwoHubReturn);
      root.classList.toggle("is-hub-to-breather-two", isHubBreatherTwoReturn);
      root.classList.toggle("is-entering-case-three-closing", isCaseThreeClosingEntry);
      root.classList.toggle("is-returning-case-three-conversation", isCaseThreeConversationReturn);

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
          "is-breather-two-to-hub",
          "is-hub-to-breather-two",
          "is-entering-case-three-closing",
          "is-returning-case-three-conversation",
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
      if (current.caseThreeState) {
        this.setCaseThreeState(current.caseThreeState, {
          animate: !immediate && direction === "forward" && !hasVisited,
        });
      }
      if (current.breatherTwoState) {
        this.setBreatherTwoState(current.breatherTwoState);
      }
      this.beginTimeline(current, {
        skip: Boolean(hasVisited && current.replayOnReturn === false),
      });
      if (
        current.caseThreeState?.montage &&
        !immediate &&
        direction === "forward" &&
        !hasVisited
      ) {
        this.startCaseThreeMontage();
      }
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
      this.montageTimers.forEach((timer) => window.clearTimeout(timer));
      this.montageTimers = [];
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
          "is-case-three-scenario-entering",
          "is-case-three-chat-entering",
          "is-case-three-montage-entering",
          "is-case-three-closing-entering",
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
        "is-breather-two-to-hub",
        "is-hub-to-breather-two",
        "is-entering-case-three-closing",
        "is-returning-case-three-conversation",
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

    setCaseThreeState({ scene = "scenario", messageCount = 0, montage = false } = {}, { animate = false } = {}) {
      const changed = this.setConversationState(
        "case-3",
        caseThreeThread,
        { scene, messageCount },
        {
          animate,
          deferScroll: montage && animate,
          eventName: "webinar:case-three-change",
        },
      );
      return changed;
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

    setConversationState(sectionId, thread, { scene = "scenario", messageCount = 0 } = {}, { animate = false, deferScroll = false, eventName = "webinar:conversation-change" } = {}) {
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

      section.querySelectorAll(".case-chat-message--mega.is-expanded").forEach((message) => {
        if (message.dataset.visible !== "true") {
          message.classList.remove("is-expanded");
          message.querySelector("[data-mega-toggle]")?.setAttribute("aria-expanded", "false");
        }
      });

      if (scene === "conversation" && messageCount > 0 && !deferScroll) {
        window.requestAnimationFrame(() => this.scrollToMessage(messageCount, { smooth: animate, thread }));
      }

      root.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { scene, messageCount, animate },
        }),
      );
      return true;
    }

    startCaseThreeMontage() {
      this.montageTimers.forEach((timer) => window.clearTimeout(timer));
      this.montageTimers = [];
      const indices = [6, 7, 8, 9, 10, 11, 12, 13, 14];
      const delays = reducedMotion.matches
        ? indices.map(() => 0)
        : [500, 1050, 1600, 2150, 2700, 3250, 3800, 4350, 5700];
      indices.forEach((index, position) => {
        const timer = window.setTimeout(() => {
          this.scrollToMessage(index, { smooth: true, thread: caseThreeThread });
        }, delays[position]);
        this.montageTimers.push(timer);
      });
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
        const thread = message.closest(".chat-thread");
        if (thread) {
          const top = Math.max(0, message.offsetTop - 18);
          thread.scrollTo({ top, behavior: reducedMotion.matches ? "auto" : "smooth" });
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

  const recap = new RecapOverlay();
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
    setCaseThreeState: (state, options) => controller.setCaseThreeState(state, options),
    setBreatherTwoState: (state) => controller.setBreatherTwoState(state),
    openRecap: () => recap.open(),
    closeRecap: () => recap.close(),
    get currentBeat() {
      return controller.manifest[controller.currentIndex];
    },
  };
})();
