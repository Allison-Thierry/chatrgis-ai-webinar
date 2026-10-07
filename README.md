# ChatRGIS AI Webinar — Phase 3

A self-contained interactive webinar support designed for GitHub Pages. It currently includes the continuous visual shell, opening experience, the automatic “simple requests to broader goals” introduction, the reusable three-case teaser hub and its Case 01 reveal, Webinar Info, the WeLearn AI course drawer, case-progress foundations and presenter controls.

## Preview

No build step or third-party runtime dependency is required.

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173` in Edge or Chrome.

## Presenter controls

| Action | Input |
| --- | --- |
| Next beat | Click the stage, `Space`, or `Right Arrow` |
| Previous beat | `Left Arrow` |
| Return to opening | `Home` or the discreet home control |
| Open AI courses | Right-edge **AI on WeLearn** tab |
| Close AI courses | Close button or `Escape` |

The presentation does not advance when the Webinar Info panel, course drawer or presenter controls are used.

## GitHub Pages

The site is ready to publish from the repository root:

1. Add this folder to a GitHub repository.
2. In **Settings → Pages**, select **Deploy from a branch**.
3. Choose the relevant branch and `/ (root)` folder.

All fonts use the device's system stack and all images, styles and scripts are local, so the live webinar does not depend on a CDN or external service.

## Adding presentation beats later

The presentation flow is deliberately data-driven:

1. Add a new `<section class="beat" data-beat-id="your-id">` to `index.html`.
2. Add the matching entry to `window.WEBINAR_BEATS` in `js/beats.js`.
3. Use existing scene primitives or add a section-specific class in `styles.css`.

Each manifest entry can carry a future case-progress state:

```js
{
  id: "case-1-search",
  label: "Case 1 — Search",
  caseProgress: { active: 1, complete: 0 },
}
```

A beat can also run one complete internal timeline while forward navigation is temporarily locked:

```js
{
  id: "intro-evolution",
  timeline: {
    className: "is-sequencing",
    duration: 14000,
    reducedDuration: 250,
  },
}
```

Multiple beats can reuse one stateful scene through `sectionId`. The case hub uses this to move from the fully frosted teaser to the Case 01 reveal without recreating the scene:

```js
{
  id: "case-hub-case-1",
  sectionId: "case-hub",
  hubState: { active: 1, complete: 0 },
}
```

The reusable connected-energy motif lives in `capabilityClusterTemplate`. Add `data-component-template="capabilityClusterTemplate"` to an empty host element to clone it into another future scene.

The shell exposes a small API for future scripted cues:

```js
webinar.next();
webinar.previous();
webinar.home();
webinar.setCaseProgress({ active: 2, complete: 1 });
webinar.setCaseHubState({ active: 2, complete: 1 });
webinar.highlightCourse("intermediate-3", { open: true, duration: 5000 });
```

Available course IDs are `basics-1`, `basics-2`, and `intermediate-1` through `intermediate-4`.

## Project structure

```text
index.html          Semantic shell and presentation scenes
styles.css          Visual system, animation and reusable scene patterns
js/beats.js         Ordered beat manifest and future component factories
js/app.js           Navigation, overlays, progress and public presenter API
assets/             RGIS logo, course cards and reusable case identities
```

## Motion and accessibility

- The visual object uses CSS and inline SVG only.
- `prefers-reduced-motion` removes non-essential motion and transition delays.
- Overlays have labelled controls, focus handling and appropriate ARIA state.
- At 620px and below, the course drawer becomes a single-column layout.
