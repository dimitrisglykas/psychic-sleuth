# Living World and Cooperative Case Lobbies

## What will be built

### Jane's character dossier
- Add Jane as a dedicated, cinematic profile inside the character gallery.
- Include his consultant backstory, personal stakes, working relationship with Lisbon, signature habits, and why he notices what others miss.
- Explain Jane's Intuition as an in-world method: observation, contradiction, behavioral baseline, and clue connection—not supernatural powers.
- Use an original portrait and presentation that evokes a charming consulting mentalist without copying a protected actor likeness.

### A connected mystery universe
- Expand Blackwood Manor with the Blackwood dynasty, the family firm, old scandals, the manor's history, and the investigation's place in the larger world.
- Add recurring-world entries for the investigative unit, Lisbon, Jane's corner, and links between current and future cases.
- Keep lore concise and discoverable from case research, so the main investigation remains simple.
- Keep culprit identity, private suspect instructions, and solution-only facts out of browser-visible lore.

### No-account cooperative lobby
- Add a lobby available before or during a case where a player can create a room, choose a display name, and copy an unguessable invite code.
- Let another player join with that code and see who is currently in the room.
- Synchronize only the agreed shared state: discovered clues, investigation progress, case start, and final result.
- Keep each player's suspect conversations, notes, intuition usage, and suspect stress private in their own browser.
- Show small, cinematic live activity notices when a teammate discovers evidence or advances the case.

## Security and reliability
- Store authoritative lobby state in Lovable Cloud behind server-only access; the browser receives no case solutions or suspect personas.
- Use a long random room secret. Every read and write validates it server-side before returning or changing room state.
- Use live room broadcasts only as refresh signals; after each signal, clients re-read authoritative state. A forged signal cannot alter progress.
- Expire inactive rooms and validate case codes, clue IDs, display names, and state transitions.
- Preserve solo browser saves and automatically merge already-found clues when creating a room.

## Technical details
- Add locked-down `case_rooms` and `case_room_members` tables with explicit service-role grants, RLS enabled, no browser data policies, and timestamps for expiry.
- Add client-safe server functions for create, join, read, and update actions; privileged database access remains inside handlers after room-secret validation.
- Add a reusable lobby overlay and a small in-case room status control.
- Extend the data-driven case registry with public lore fields and Jane's public profile; shared UI will not branch on case codes.
- Generate the original Jane-style consultant portrait as a local app asset.

## Verification
- Create a Gala Heist room in one browser and join it from a second browser with only the invite code.
- Confirm clues and overall progress appear in both browsers in real time and survive reloads.
- Confirm interviews, notes, intuition tokens, and suspect stress do not cross between players.
- Complete an accusation and confirm the shared outcome reopens for both players without exposing the hidden answer beforehand.
- Check the Jane dossier and Blackwood lore on phone and desktop, then confirm the app builds without errors.
