# Cinematic Opening and Case Continuity

## Goal
Create an original television-style opening for Psychic Sleuth that captures the observant, warm, suspenseful tone of a mentalist crime drama without copying protected logos, footage, music, or actor likenesses. Make the path into the game immediately clear and connect a solved episode to the next playable case.

## Build
- Add a full-screen opening sequence using the existing original case imagery, suspect portraits, fast editorial cuts, restrained credits, and a bold Psychic Sleuth title reveal.
- Keep the opening brief and controllable with Skip, sound-safe silent presentation, and reduced-motion support.
- End on a simple title screen with one obvious action: enter the current investigation. Also expose Case Files for players who want another episode.
- Present Blackwood Manor and The Gala Heist as connected episodes in one continuing world.
- After closing Case 001 successfully, offer a direct Continue to The Gala Heist action while preserving each case's separate saved progress.
- Replace all visible em dashes and en dashes in the app with natural punctuation so the oversized AI-like dash never appears.
- Preserve the current case-first briefing, private interviews, cooperative room behavior, and browser-saved progress.

## Technical details
- Build the opening as a reusable game component fed by the case registry rather than branching on case codes.
- Keep solutions and suspect secrets server-side. The title sequence uses only player-safe case metadata and existing original imagery.
- Add the next-case action through the existing case selection callback.
- Verify type safety, current diagnostics, phone layout, desktop layout, opening controls, case transition, and saved progress.
