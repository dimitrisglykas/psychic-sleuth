# Cinematic Gala Heist rebuild

## What will change
- Replace the Gala crime-scene illustration with the new cinematic museum image and place accessible glowing hotspots over the actual objects.
- Turn discovered Gala clues into visual evidence cards with image crops, clear “Inspect” actions, and a focused evidence viewer.
- Upgrade suspect presentation with large portraits, stress-linked tension effects, and readable reaction badges without changing AI behavior.
- Add portrait-focused visual treatments for Jane’s Intuition and Cold Read, plus cinematic overlays for the tea reflection and My Desk.
- Preserve the simplified “Do this next” path, three core actions, existing interviews, accusation flow, music, and per-player browser storage.

## Verification
- Walk Gala from briefing through every hotspot, suspect/victim interactions, evidence inspection, accusation, and win screen.
- Confirm tea, My Desk music, Cold Read, and Intuition still work with the new visuals.
- Open two isolated browser sessions and confirm clues, stress, transcripts, and the win result do not cross between players.
- Check phone and desktop layouts, browser errors, and the final app build signal.

## Technical details
- Keep all case data flowing through the existing case registry and context.
- Reuse existing per-case storage keys; no changes to secret case answers or server-side AI prompts.
- Use semantic design tokens and motion that respects reduced-motion settings.
