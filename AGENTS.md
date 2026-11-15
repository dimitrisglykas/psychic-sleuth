<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep each suspect's interrogation transcript in browser storage; this preserves case progress without requiring accounts.
- Keep all suspect roleplay prompts and AI Gateway access server-side; this prevents hidden case truths and credentials from reaching the browser.

- Case content (suspects, clues, hotspots, motives, solution) lives in `src/game/case.ts`; game UI pieces live in `src/components/game/`. Keeps puzzles data-driven so new cases can be added without touching UI.
- AI suspect replies end with a `<<META {...}>>` line (stress, observation, tell) parsed client-side; this streams dialogue while still returning structured game state.
- Each case is a `CaseData` entry in `src/game/case.ts` (registry `CASES`), provided via `CaseContext`/`useCase()`; components never import case constants directly. Keeps adding cases data-only.
- Suspect personas/secrets live in Lovable Cloud tables `case_people`/`case_files` (RLS on, no policies, service_role only) and are read by `/api/chat` via the admin client; never ship them in client code.
- Browser storage keys are prefixed per case with `CaseData.storageKey`; the active case code is stored under `psychic-case`.

- Case solutions and final explanations live in Lovable Cloud `case_files` and are checked by the `checkAccusation` server function; never put answers in `src/game/case.ts`. Keeps answers out of the browser.
- Every case supplies its crime-scene image, evidence sheet, evidence crop slots, scene stamp, and hotspot coordinates through `CaseContext`; shared UI must not branch on case codes. Keeps every current and future case cinematic without duplicating presentation logic.
- Cooperative rooms share clues, progress, final outcomes, and player-authored chat through server-validated room credentials; interviews, stress, notes, and intuition remain browser-private.
- The series opening reads public metadata from the case registry and hands off through the existing case selector; this keeps episode continuity data-driven.
- Interrogations use the server-only AI Gateway SDK with inline dialogue history and an AI UI stream adapter; saved provider IDs cannot break resumed conversations, and service errors retain their safe reasons.
- The opening soundtrack is an original local instrumental, played only after a user gesture and stopped on skip or case entry; no protected theme or autoplay audio is used.
- Player locale uses a nonblocking header dropdown and is persisted separately from case progress; local public-text dictionaries translate shared screens, while the server applies locale to dialogue and metadata without translating IDs or private solutions.
- The opening defaults to its playable title screen with a case-data-driven evidence preview; credits and gesture-triggered music are opt-in so first entry never waits on a sequence.
- Normalize long dash punctuation at the AI stream boundary and visible text boundary so restored dialogue and metadata follow the same copy rule without rewriting saved outcomes.
- Use fluid document-flow app layouts and grid-based headers with inline language controls; scroll overlays from the top and offer scene hotspot controls in a wrapping grid so narrow or short viewports never hide required actions.
- Load the first-visit 3D eye through a browser-only dynamic Three.js import, cap rendering resolution, and dispose all resources after its brief skippable display; game loading must never await graphics.
- Serve SVG, raster, and touch favicons derived from the same game eye mark; template metadata and icons must not compete with game branding.
