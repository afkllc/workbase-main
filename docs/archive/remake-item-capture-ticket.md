# Item Capture — Bottom Sheet with Progressive AI Disclosure

**Labels:** `mobile` `ux` `core-loop` `high`  
**Surface:** Mobile only  
**Source:** Inspector user feedback — items appeared tappable but did nothing

---

## Context

Inspector feedback identified a critical interaction failure: checklist items look tappable but produce no response, causing users to assume the app is broken. The fix replaces the current static item list with a bottom sheet that opens on item tap, delivering a progressive disclosure flow — photo first, then AI generates condition and description, then the clerk confirms or edits in one tap.

This is the core differentiator of Notara and must feel fast. Target: **three touches per item maximum.**

This ticket introduces three new dependencies required for the bottom sheet. These also unlock the post-demo animation work as a side effect.

---

## New Dependencies

Install in this order:

```bash
npx expo install react-native-reanimated react-native-gesture-handler @gorhom/bottom-sheet
```

Then add the Reanimated Babel plugin to `mobile/babel.config.js`:

```javascript
plugins: ["react-native-reanimated/plugin"];
```

Wrap the root layout in `mobile/app/_layout.tsx` with `GestureHandlerRootView` from `react-native-gesture-handler` at the outermost level — this is required for `@gorhom/bottom-sheet` to function correctly.

---

## Interaction Model

| Step | What happens                                                            |
| ---- | ----------------------------------------------------------------------- |
| 1    | Inspector taps a checklist item in the room screen                      |
| 2    | Bottom sheet rises from beneath — initial snap point ~50% screen height |
| 3    | Sheet shows: item name + large photo upload zone (primary action)       |
| 4    | Inspector uploads photo → sheet expands to full height                  |
| 5    | AI analyses photo → generates condition and short description           |
| 6    | Sheet shows AI output: condition badge + description, both editable     |
| 7    | Inspector taps **Confirm** (one tap) or edits then confirms             |
| 8    | Sheet dismisses, item in room list updates immediately                  |

---

## Tasks

### 1. Dependency setup

- Install the three packages above and configure the Babel plugin and `GestureHandlerRootView` as specified.
- Run `npm run typecheck` before writing any feature code — confirm the baseline is clean after dependency changes.

### 2. Create `mobile/src/components/ItemCaptureSheet.tsx`

A `@gorhom/bottom-sheet` component accepting these props:

```typescript
item: ChecklistItem
inspectionId: string
roomId: string
onConfirm: (itemId: string, condition: string, description: string) => void
onDismiss: () => void
```

Internal state machine: `idle → uploading → analysing → review → confirmed`

### 3. Idle state

- Sheet at 50% height.
- Item name rendered in `typography.sectionTitle`.
- Large `Pressable` upload zone centred in the sheet using `colours.surface` + `borders.subtle`, Feather `camera` icon, label `"Upload photo to analyse"`.
- Use `expo-image-picker` (already installed) for photo selection.

### 4. Uploading → Analysing state

- Sheet expands to full height.
- Show selected photo thumbnail.
- Show `AiPill` + `"Analysing photo..."` loading line beneath it.
- Call the existing backend AI photo analysis endpoint.
- **Do not call the AI provider directly from mobile** — route through the backend as per existing architecture.

### 5. Review state

Show AI-generated output with the following controls:

- **Condition** — tappable `StatusBadge` that cycles `Good → Fair → Poor → N/A` on each tap.
- **Description** — editable `TextInput` pre-filled with AI output, `multiline`, max 4 lines visible.
- **Primary action** — `Confirm` button using the existing `Button` component.
- **Secondary action** — `"Skip photo"` text link for items where no photo is needed. Confirms the item without AI analysis; condition defaults to `N/A`.

### 6. Wire into room screen

- In `mobile/app/inspection/[inspectionId]/room/[roomId].tsx` — make each checklist item row a `Pressable` that opens `ItemCaptureSheet` for that item.
- Pass `inspectionId`, `roomId`, and the item as props.
- On `onConfirm`, update item state locally and call the existing item update API endpoint.

### 7. Remove redundant upload card

- The existing "Upload photo for AI analysis" card in the room screen should be removed — its function is now handled entirely by the sheet.
- Do not leave two photo upload paths visible simultaneously.

---

## Constraints

- All colour values must reference tokens from `colours.ts` — no hardcoded hex or rgb values.
- AI analysis is always called through the backend — never directly from mobile.
- `GestureHandlerRootView` must wrap at root level, not per-screen.
- Do not change the room screen's overall structure beyond making items tappable and removing the redundant upload card.

---

## Edge Cases to Handle

- **AI analysis failure** — show an error notice inside the sheet. Allow the clerk to manually enter condition and description and still confirm. Do not crash or fail silently.
- **No photo needed** — `"Skip photo"` path must work end-to-end and produce a confirmed item.
- **Sheet dismissed mid-flow** — treat as cancel, no state changes persisted.

---

## Success Criteria

- [ ] Tapping any checklist item opens the bottom sheet immediately with no visible delay
- [ ] Photo upload triggers sheet expansion and AI analysis call via backend
- [ ] AI-generated condition and description appear correctly in the review state
- [ ] Clerk can confirm in one tap or edit before confirming
- [ ] Confirmed item updates visually in the room list immediately on sheet dismiss
- [ ] Sheet dismisses cleanly on confirm, on skip, and on swipe down
- [ ] AI failure shows an error notice inside the sheet — does not crash or fail silently
- [ ] `"Skip photo"` path works — item is confirmable without a photo
- [ ] No hardcoded colour values anywhere in `ItemCaptureSheet.tsx`
- [ ] `GestureHandlerRootView` wraps root layout correctly with no gesture conflicts against existing navigation
- [ ] `npm run typecheck` passes after all changes
