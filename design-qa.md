# Profile design QA

final result: passed

## User-requested revision

The subsequent browser annotation requests removal of the `skernel` and `sse-client` cards. Both cards and their containing row were removed from `README.md`. The refreshed preview contains one project row with only `axiom` and `mimic`, no removed project text, and no horizontal overflow. Screenshot: `dist/design/projects-after-removal.png`. The original four-card composition in the comparison evidence below is superseded by this explicit content change; the retained cards keep their existing appearance.

## Scope and visual target

- Selected target: the first displayed Product Design option, “Quiet Systems”.
- Source image: `dist/design/reference.png` (a copy of generated image `exec-29376cc9-6e42-4754-a4cd-4213a561be64.png`).
- Implementation: `http://127.0.0.1:4173/`, rendered from the current README through GitHub's Markdown API, with repository-owned images.
- Final desktop screenshot: `dist/design/implementation-dark.png`.
- Full comparison: `dist/design/comparison-final.png` (reference left, implementation right).
- Source and final implementation: 1024 × 1536 pixels; browser viewport: 1024 × 1536 CSS pixels at device scale factor 1. No density resampling was used for the final comparison.
- State: dark theme, page top, subtitle fully revealed. The reference is static; the live perimeter trail is captured at one point in its cycle.
- The native browser scrollbar takes 10 px of the implementation viewport. This small content-width difference is expected, rather than a layout defect.
- Evidence is intentionally kept in ignored `dist/design/`, not in the published profile.

## Findings and iteration history

1. **Pass 1 — blocked.** `comparison-pass-1.png` shows the systems and tooling descriptions wrapping onto three lines instead of two. The focus row grew to 143 px and displaced subsequent sections. The wordmark also needed a heavier display treatment. Icon-only links emitted by GitHub's renderer had empty accessible names.
   - Fix: adjusted column padding, shortened the tooling description, used explicit editorial line breaks, strengthened the static wordmark, and supplied meaningful icon alt text.
2. **Pass 2 — blocked.** `comparison-pass-2.png`, `comparison-hero.png`, and `comparison-focus.png` show the corrected two-line descriptions, but the first description crowded its column divider and the hero footer spread much farther than the reference.
   - Fix: fixed the intended description breaks and reduced the footer's text span from 1080 to 900 SVG units. Tuned the name's size and weight without introducing a cursor or name animation.
3. **Final comparison — passed.** `comparison-final.png`, `comparison-hero-final.png`, `comparison-focus-final.png`, and `comparison-projects-final.png` show the final implementation and source together. The focus row is now 119 px tall, each description occupies two lines, and the project grid keeps consistent padding and hierarchy. No actionable P0/P1/P2 findings remain within the GitHub-compatible profile scope.

## Required fidelity surfaces

| Surface | Assessment |
| --- | --- |
| Fonts and typography | The local body actually renders with Inter, verified through browser font inspection. Display headings, italic project summaries, and monospaced labels preserve the reference hierarchy. The hero uses system font fallbacks so the SVG stays self-contained. Font rasterization and the generated reference's exact glyph shapes differ slightly; these are P3 fidelity differences. |
| Spacing and layout | Hero, centered navigation, introductory statement, three focus columns, the project grid, and SuperKernel appear in the selected order. The later user revision reduces the project grid to one row of two cards. Focused comparisons confirm consistent cell padding and readable wrapping. Local mobile layout stacks columns and project cells. |
| Colors and tokens | Deep navy, teal/cyan accents, restrained dividers, and minimal surface contrast follow option 1. Generated light assets switch to pale backgrounds and dark teal/slate text. Dark and light views were inspected. |
| Images and assets | The existing canonical hero and stack SVGs were adapted to preserve the user's required animations, accessibility metadata, and generated light variants. No raster placeholder replaces them. Terminal, layers, and settings geometry comes from Feather v4.29.2, with its MIT license retained in `assets/icons/LICENSE`. Seven displayed images loaded in each theme. |
| Copy and content | All visible profile copy is English. The two retained projects and SuperKernel links remain factual. Repeated wording was tightened instead of copying generated text verbatim. All 17 remaining toolbox entries are preserved; Hyperf is absent. |

## Platform constraints and accepted differences

- GitHub applies its own Markdown font sizes, table borders, links, and responsive behavior. `scripts/profile-preview.css` is local preview styling, not CSS injected into the GitHub README. The README itself uses supported headings, tables, links, images, and theme-aware pictures.
- The user requires an immediately visible name, a typed subtitle, fading perimeter trails, and canonical SVG/light-generator ownership. Those existing vector assets therefore remain the production source instead of replacing the hero with a static generated bitmap.
- The static reference only covers the page through SuperKernel. The existing toolbox, live statistics, contribution animation, and contact section remain below it and were also inspected.
- The reference's tiny trailing accent beside the SuperKernel heading is omitted. This is P3 decoration and is not needed for navigation or hierarchy.
- SVG fonts remain dependent on viewer-installed fallback fonts. The local preview is not a pixel-exact guarantee of GitHub's surrounding page typography.

## Verification

- Desktop dark: `implementation-dark.png`.
- Desktop light: `implementation-light.png`; complete page: `implementation-light-full.png`.
- Mobile at 390 × 844 CSS px, scale 1: `implementation-mobile.png` and `implementation-mobile-projects.png`. All seven images loaded, project cards stack, and no horizontal page overflow was detected.
- Tablet at 768 × 1024 CSS px: no horizontal overflow; all focus titles fit. Keyboard navigation reached the next section link with a visible 2 px focus outline.
- The current 933 px desktop pane needed the compact column layout slightly earlier; its breakpoint was moved from 900 to 960 px. `implementation-handoff.png` records the final check at the user's restored viewport. The 1024 px source comparison is unaffected.
- Projects, SuperKernel, Toolbox, and Contact navigation were clicked and resolved to existing section IDs. The mobile Projects link scrolled its heading into view.
- All project destinations, the source-repository listing, ecosystem links, and the email URI were inspected in the rendered DOM. Existing remote destinations were retained.
- Four `<picture>` fallbacks were tested by disabling their source candidates temporarily: each fallback loaded successfully. A page reload restored normal source selection.
- At SVG times 0, 1.3, and 3 seconds, the name remained visible and the subtitle reveal measured 0, 285, and 580 SVG units. The perimeter stroke offset changed from 100 to 45.83 to -25, with fading opacity. No moving-dot element or name cursor is used.
- With reduced motion enabled, the typed subtitle and moving trails are hidden, and a complete static subtitle is shown.
- No browser console warnings or errors were observed in the checked preview states.
- Generator and preview-script syntax checks passed. All seven SVGs parsed with title/description metadata. Local image paths exist. Both light assets regenerate deterministically. `git diff --check` passed.
- Statistics-generation code and its workflow were not changed, so a new statistics generation was not required. The existing generated remote cards loaded in both schemes.
- Visual verification was performed against the local preview; GitHub's published rendering was not part of that check.

## Implementation checklist

- [x] Implement the selected visual direction in README and canonical assets.
- [x] Regenerate matching light assets.
- [x] Verify desktop and mobile views, both themes, fallback images, navigation, and animation behavior.
- [x] Compare full and focused regions after fixing P2 findings.
- [x] Preserve the local preview for review.

## Follow-up polish

Only optional P3 adjustments remain: exact system-font glyph matching and the omitted decorative heading accent. No further iteration is required for this handoff.
