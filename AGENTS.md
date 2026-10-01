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
