# 3D Warehouse — Diorama Redesign Plan

**Date:** 2026-07-03
**Status:** Proposed (awaiting Patrick's direction sign-off)
**Branch target:** successor to `feat/3d-clay-rework`

---

## 1. Diagnosis — why it still doesn't feel right

The clay-rework branch fixed the black-shelf bug and gave pallets status
colours, but the scene still reads as noise. Measured root causes:

| # | Problem | Evidence |
|---|---------|----------|
| 1 | **Scale mismatch.** 2,400 structure meshes (1,200 posts + 1,200 decks) for 20 pallets — a 120:1 noise-to-signal ratio. The seed data reaches bay 20, inflating the grid to 3 zones x 5 aisles x 20 bays. | `ShelfInstances` renders the full cartesian grid regardless of occupancy |
| 2 | **Pole forest.** Every bay is a freestanding tower with 4 corner posts. Real racking is continuous rows with shared uprights. The eye reads ~1,200 near-parallel vertical lines as visual static. | Screenshots: dense vertical stripes dominate every frame |
| 3 | **No ground anchor.** Objects float over a fading grid on an endless beige void. The clay-diorama inspiration image works because the model sits on a defined base. | `<Grid fadeDistance={50}>` is the only floor |
| 4 | **No zone identity.** Zones A/B/C are indistinguishable — the per-zone shelf tints differ by ~4% lightness, and the coloured floor bands were removed earlier. | `CLAY_ZONE_SHELF_COLORS` deltas are imperceptible |
| 5 | **Default framing shows everything, so everything is small.** The camera fits the whole 60m-wide grid; pallets end up ~20px tall. The inspiration is a close, single-subject diorama shot. | `applyOverviewFrame` fits full pallet bounds |
| 6 | **Weak depth cues.** PCFSoftShadowMap is deprecated (console warns) and the single shadow map produces harsh stripes through the racking rather than grounding objects. | Console warning + screenshot shadow pattern |

**The one-sentence summary:** the scene renders an *empty industrial
building* at architectural scale, when what the feature needs is a
*tabletop model of the inventory*.

## 2. Design principles

1. **Diorama, not simulation.** Treat the warehouse as a hand-built
   tabletop model. Small, complete, framed — like the reference render.
2. **Data is the subject; the building is the stage.** Structure exists
   only to give pallets a place to sit. If a rack holds nothing and
   explains nothing, it isn't rendered.
3. **One colour = one meaning.** Saturated colour is reserved for pallet
   status (tan/teal/red-orange, already shipped). Everything else stays
   within the neutral clay ramp.
4. **Show structure the way the eye groups it.** Rows, not towers.
   Plates, not voids.

## 3. The redesign

### A. Structure: rack *rows*, occupancy-driven (biggest win)

- Replace per-bay towers with **continuous rack rows per aisle**:
  shared uprights at row ends and every 4 bays, one long deck slab per
  level per row (a single stretched box), instead of per-bay decks.
- **Render only occupied extent**: for each zone/aisle, find min..max
  occupied bay, pad by 1, and render just that row segment. Empty
  aisles vanish entirely.
- Expected result with current seed data: ~15 row segments ->
  **~60 posts + ~60 deck slabs ≈ 120 meshes, down from 2,400** (95%
  reduction), and the remaining shapes are long horizontals (calm)
  instead of verticals (noise).
- Files: `ShelfInstances.tsx` (rewrite), `warehouse-math.ts` (row
  extent helper), `constants.ts` (post spacing).

### B. Staging: give the model a base and the zones a name

- **Zone floor plates**: one rounded flat slab per zone (RoundedBox,
  height ~0.12) in the existing zone tints, sized to that zone's
  occupied extent + margin. This restores zone identity at floor level
  without colouring the air.
- **Zone labels**: flat 3D text (drei `Text`) lying on each plate near
  its front edge — "ZONE A" — low-contrast clay-on-clay, diorama
  nameplate style.
- **Diorama base**: one large rounded slab under all three plates,
  slightly darker than the background, so the model reads as an object
  sitting in the space rather than geometry floating in fog.
- **Contact shadows** (drei `ContactShadows`) under the whole model
  instead of the deprecated PCFSoftShadowMap — soft radial grounding,
  no shadow-stripe artefacts, kills the THREE deprecation warning.
- **Background**: keep the warm paper tone; optionally a very subtle
  vertical gradient (lighter top) to lift the diorama off the page.

### C. Framing: closer, lower, calmer

- Default camera: **~32° elevation, fit to occupied bounds x 0.62**
  (closer than today), so pallets are the size of thumbnails, not
  pixels.
- Keep the existing focus/deselect animation system — it's good — just
  retune the fit constants.
- Tighten zoom range (`minDistance` ~8, `maxDistance` ~60) so users
  can't zoom out into "everything is dust" territory.

### D. Interaction: focus is a state of the scene, not just an outline

- **Hover**: pallet lifts +0.15 with a short ease + existing outline.
  (Cheap spring on position.y; no library needed.)
- **Selection = focus mode**: selected pallet keeps full colour +
  dark outline; **all other pallets drop to ~35% opacity clay-ghost**,
  racks drop slightly too. The camera move already exists; this makes
  the scene itself answer "what am I looking at?".
- **Delayed pulse**: replace the static emissive on `urgency: high`
  with a slow sine pulse (0.2 -> 0.45 emissive over ~2.4s). Alive, not
  alarming.
- **AI-filter highlight** keeps its current outline treatment and now
  also gets the focus-fade for non-matches (consistent with selection).

### E. 2D overlay (HTML, cheap, high value)

- **Legend chips** (top-left, inside the canvas container): three small
  colour dots + labels — Stored / In Transit / Delayed. First-time
  users currently have to guess the colour code.
- **Zone pills** (top-centre): A / B / C buttons that frame that zone's
  plate (reuses the existing camera animation).
- **Reset-view button** next to the existing fullscreen control.

## 4. Phasing

| Phase | Scope | Effort | Files |
|-------|-------|--------|-------|
| 1 | Rack rows + occupancy-driven extent (A) | M | ShelfInstances, warehouse-math, constants |
| 2 | Floor plates, labels, base, contact shadows, camera retune (B+C) | M | WarehouseScene, new ZonePlates component, constants |
| 3 | Hover lift, focus fade, delayed pulse, legend + zone pills (D+E) | M | PalletInstances, WarehouseScene, new overlay components |
| 4 | Cleanup: drop the console.warn monkey-patch, perf check, remove dead zoneShelf tints if unused | S | WarehouseScene, constants |

Each phase is independently shippable and visually verifiable on a
preview deployment. Phase 1 alone removes ~95% of the geometry and
should transform the feel; if it doesn't, we stop and re-evaluate
before spending more.

## 5. Open questions (not blockers — defaults chosen)

1. **Orbit freedom**: keep free orbit (default) or constrain to a
   turntable (fixed elevation, rotate+zoom only)? Turntable is more
   "diorama" but less explorable. *Default: keep free orbit, tightened.*
2. **Empty aisles**: fully hidden (default) or shown as faint floor
   markings on the zone plate? *Default: hidden; plate implies space.*
3. **Zone labels**: on-floor 3D text (default) or floating HTML pills
   anchored in 3D? *Default: on-floor, quieter.*
