# Character Gallery and Full Case Verification

## Build
- Add a cinematic character gallery reachable from the case files before entering a case.
- Show every suspect’s portrait, role, background, alibi, possible motive, and player-safe known secret.
- Keep culprit identities, private persona instructions, and solution-only facts hidden on the server.
- Make gallery content part of each case’s data so future cases inherit the same experience without custom UI.
- Keep the gallery usable on the current phone view and on desktop.

## Verify
- Play Case 001 from briefing through every crime-scene hotspot, suspect/victim interviews, accusation, and win screen.
- Play Case 002 through the same complete journey.
- For each hotspot, confirm its discovered clue opens the matching Evidence Drawer image and description.
- Use two fresh browser profiles on the same case, save different clues/stress/results, reload both, and confirm no progress crosses between them.
- Check the final build and browser console for errors.

## Technical details
- Store only public research notes in client-visible case data; hidden truths remain in Lovable Cloud and server handlers.
- Preserve each case’s existing browser-storage prefix so player sessions remain isolated.
