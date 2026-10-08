/**
 * Presentation manifest
 * ---------------------
 * Add future beats here in the same order as their matching
 * <section data-beat-id="..."> element in index.html.
 *
 * caseProgress is intentionally null during the introduction. Future values use:
 * { active: 1, complete: 0 }
 *
 * A timeline locks forward navigation while its internal animation runs. The
 * final composition remains visible after the lock ends until the next input.
 * sectionId lets multiple presentation beats reuse the same stateful scene.
 */
window.WEBINAR_BEATS = [
  {
    id: "opening",
    label: "Opening screen",
    caseProgress: null,
  },
  {
    id: "intro-evolution",
    label: "From individual requests to broader goals",
    caseProgress: null,
    timeline: {
      className: "is-sequencing",
      duration: 14000,
      reducedDuration: 250,
    },
  },
  {
    id: "case-hub-teaser",
    sectionId: "case-hub",
    label: "Three practical cases — teaser",
    caseProgress: null,
    hubState: { active: 0, complete: 0 },
    replayOnReturn: false,
    timeline: {
      className: "is-entering",
      duration: 4600,
      reducedDuration: 120,
    },
  },
  {
    id: "case-hub-case-1",
    sectionId: "case-hub",
    label: "Case 01 — Stay Ahead",
    caseProgress: { active: 1, complete: 0 },
    hubState: { active: 1, complete: 0 },
    replayOnReturn: false,
    timeline: {
      className: "is-unlocking",
      duration: 1800,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-scenario",
    sectionId: "case-1",
    label: "Case 01 — a new MINISO opportunity",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "scenario", messageCount: 0 },
    replayOnReturn: false,
    timeline: {
      className: "is-scenario-entering",
      duration: 4300,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-message-1",
    sectionId: "case-1",
    label: "Case 01 conversation — prompt 1",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "conversation", messageCount: 1 },
    replayOnReturn: false,
    timeline: {
      className: "is-chat-entering",
      duration: 3300,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-message-2",
    sectionId: "case-1",
    label: "Case 01 conversation — MINISO stores",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "conversation", messageCount: 2 },
    replayOnReturn: false,
    timeline: {
      className: "is-message-arriving",
      duration: 1900,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-message-3",
    sectionId: "case-1",
    label: "Case 01 conversation — news prompt",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "conversation", messageCount: 3 },
    replayOnReturn: false,
    timeline: {
      className: "is-message-arriving",
      duration: 3100,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-message-4",
    sectionId: "case-1",
    label: "Case 01 conversation — recent MINISO news",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "conversation", messageCount: 4 },
    replayOnReturn: false,
    timeline: {
      className: "is-message-arriving",
      duration: 2200,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-message-5",
    sectionId: "case-1",
    label: "Case 01 conversation — staying informed",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "conversation", messageCount: 5 },
    replayOnReturn: false,
    timeline: {
      className: "is-message-arriving",
      duration: 2700,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-message-6",
    sectionId: "case-1",
    label: "Case 01 conversation — monitoring schedule",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "conversation", messageCount: 6 },
    replayOnReturn: false,
    timeline: {
      className: "is-message-arriving",
      duration: 2800,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-message-7",
    sectionId: "case-1",
    label: "Case 01 conversation — weekly retail brief",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "conversation", messageCount: 7 },
    replayOnReturn: false,
    timeline: {
      className: "is-message-arriving",
      duration: 3300,
      reducedDuration: 120,
    },
  },
  {
    id: "case-1-automation-ideas",
    sectionId: "case-1",
    label: "Case 01 — automation ideas for RGIS roles",
    caseProgress: { active: 1, complete: 0 },
    caseOneState: { scene: "ideas", messageCount: 7 },
    replayOnReturn: false,
    timeline: {
      className: "is-ideas-entering",
      duration: 3900,
      reducedDuration: 120,
    },
  },
];

/**
 * Small DOM factories for content patterns planned for later phases.
 * They establish a reusable vocabulary for
 * conversations, cases and intermissions without coupling them to navigation.
 */
window.WebinarComponents = {
  chatMessage({ role = "assistant", text = "" } = {}) {
    const message = document.createElement("article");
    message.className = `chat-message chat-message--${role}`;
    message.dataset.role = role;
    message.textContent = text;
    return message;
  },

  caseHeading({ number, title, steps = [] } = {}) {
    const heading = document.createElement("header");
    heading.className = "case-heading";

    const marker = document.createElement("p");
    marker.className = "scene-label";
    marker.textContent = String(number ?? "").padStart(2, "0");

    const name = document.createElement("h2");
    name.textContent = title ?? "";

    const sequence = document.createElement("p");
    sequence.className = "case-heading__sequence";
    sequence.textContent = steps.join("  →  ");

    heading.append(marker, name, sequence);
    return heading;
  },

  intermission({ label = "Intermission" } = {}) {
    const surface = document.createElement("section");
    surface.className = "intermission-surface";
    surface.setAttribute("aria-label", label);
    return surface;
  },
};
