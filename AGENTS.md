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
- Cooperative rooms share only clues, progress, and final outcomes through server-validated room credentials; interviews, stress, notes, and intuition remain browser-private.
