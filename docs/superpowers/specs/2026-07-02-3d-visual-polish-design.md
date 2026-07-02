# 3D Warehouse Scene — Visual Polish Design

**Date:** 2026-07-02
**Status:** Approved, ready for implementation planning

## Context

The 3D warehouse scene (`apps/web/src/app/features/warehouse-3d/`) currently reads as a light, pastel, semi-technical CAD view: a cool blue-grey background, a visible reference grid, colored zone floor bands (A blue / B green / C tan), near-transparent shelving (10-22% opacity), and sharp-edged box pallets colored by zone or by interaction state (hover/selected/filtered), all sharing one saturated-pastel palette with no particular hierarchy of what matters.

The goal is a more polished, considered look, anchored on two references the user gave verbatim: a "clay render style... with mirror's edge visual style. Means strong well polished colors and the rest pretty neutral," and a reference photo of an isometric clay-diorama render (a Venetian building scene) — matte off-white/warm-grey clay material across every surface (building, bridge, boat, railings, plants all rendered in the same monochrome family), soft even studio lighting with minimal contrast, and the *only* color in the entire image coming from warm glowing light (lit windows, lanterns) rather than painted surfaces.

These two references resolve into one coherent direction: a uniform matte "clay" material family across the whole scene, with the "strong color" signal implemented as **emissive glow** rather than flat paint — directly channeling the reference photo's lit-window trick, while still satisfying "strong colors for what matters, neutral for everything else."

## Goal

Restyle materials, colors, lighting, and pallet/shelf geometry in the 3D scene to this clay-render direction. Camera behavior (`CameraFocusController`, `OrbitControls` config, focus/overview animation logic in `WarehouseScene.tsx`) is unchanged — this is a materials/geometry/lighting pass only.

## Color & Material System

**Base clay family** — one warm off-white hue (`hsl(38, 28%, 92%)` ≈ `#f0e9dc`) used for every neutral surface: the floor plane, the grid helper (softened, see below), and pallets that don't need the attention signal. Material properties for all clay surfaces: `roughness: 0.92`, `metalness: 0.02`, no texture maps, no transparency — fully matte and fully opaque, matching the reference photo's plaster-like finish.

**Zone identity** moves entirely to shelf material — barely-perceptible lightness shifts within the same clay hue family, not the current saturated per-zone hues:
- Zone A shelf: `#ebe4d8`
- Zone B shelf: `#e6dfd0`
- Zone C shelf: `#e0d6c2`

The floor's colored zone-bands (`ZoneBands` component in `WarehouseScene.tsx`) are removed entirely — a uniform clay floor matches the reference and zone identity is now legible from the shelving alone.

**Status/urgency accent — emissive glow, not flat color.** A pallet's material is the same base clay `meshStandardMaterial`, except when `pallet.urgency === 'high'`, in which case it additionally gets `emissive: '#ff5a3c'`, `emissiveIntensity: 0.9`. Every other pallet (`urgency` `'low'` or `'medium'`, regardless of `status`) stays plain clay with no emissive. This is a single, binary signal — deliberately not tiered by status *and* urgency separately, since the existing mutation logic already sets `urgency: 'high'` whenever a pallet is flagged `delayed` (see `apps/api/src/pallets/pallets.service.ts`'s `mutatePallet`), so `urgency === 'high'` already captures "this pallet needs attention" without double-encoding the same condition two ways.

**Hover and selection** stay as an outline (not a color change, since color is now reserved for the urgency signal) — a rim outline via `@react-three/drei`'s `<Outlines>`, rendered per pallet mesh:
- Hover: `color="#8a8073"` (mid warm grey), `thickness={1.5}`
- Selected: `color="#2b2620"` (dark warm charcoal), `thickness={3}`
- Neither: no `<Outlines>` rendered (avoid the cost of an always-on outline pass on every pallet)

**Filter highlighting** (`activeHighlightColor` from AI filter results) currently tints the whole pallet. Under this system it becomes a third outline tier instead of a color fill, using the filter's own highlight color as the outline color (falls back to the existing default `#BC804C` when the AI didn't specify one) at the same thickness as hover. If a pallet is both filtered and hovered/selected, hover/selection outline takes precedence (it's the more specific, momentary state).

## Lighting

Soften the existing three-light setup toward the reference's near-shadowless, evenly-lit look — more fill, less directional contrast:
- `ambientLight`: intensity `0.75` → `0.95`
- `hemisphereLight`: args unchanged colors, intensity `0.4` → `0.55`
- `directionalLight`: intensity `1.1` → `0.85`, shadow type changes from `THREE.PCFShadowMap` to `THREE.PCFSoftShadowMap` on the `Canvas`'s `shadows` prop for softer shadow edges; `shadow-mapSize` unchanged at `[2048, 2048]`
- Background color: `#eef2f8` (cool blue) → `#f5f0e6` (warm off-white, same family as the clay material)
- Fog: `['#f0f2f5', 45, 170]` → `['#f5f0e6', 45, 170]` (match the new background so distant falloff reads as atmospheric haze, not a color shift)

**Grid helper** stays (it provides real spatial/scale reference for a warehouse-navigation tool, which the reference photo doesn't need to provide), but is softened so it doesn't compete with the clay look: `cellColor` `#cfd8e8` → `#e4dbc8`, `sectionColor` `#9fb0cb` → `#c9bea8` — both shifted into the same warm-neutral family at low contrast against the new background, rather than the current cool blue that stands out against the scene.

## Geometry

**Pallets** (`PalletInstances.tsx`): replace the plain `boxGeometry` with `@react-three/drei`'s `<RoundedBox>`, same overall dimensions (`WAREHOUSE_CONFIG.PALLET_SIZE`), corner radius `0.1`, `smoothness: 4` segments — enough to read as genuinely rounded without adding meaningful triangle cost at the current pallet counts (dozens, not thousands). Individual per-pallet meshes stay individual (not instanced) — unchanged from today, since each pallet already needs independent hover/click/outline handling.

**Shelves** (`ShelfInstances.tsx`): the current two-layer instanced approach (one bulky semi-transparent "frame" block spanning the whole bay volume, plus thin "deck" slabs per level) becomes an open-frame structure so opaque shelving doesn't occlude pallets:
- Remove the current single bulky frame block per bay.
- Add four thin vertical corner-post instances per bay (`InstancedMesh`, count = `totalRacks * 4`), each spanning the full rack height, positioned at the four corners of the bay footprint.
- Keep the per-level deck instances (unchanged count/positioning logic), but make them opaque clay material instead of the current `transparent opacity={0.22}`.
- Both new instance types use the same clay `meshStandardMaterial` params as pallets (`roughness: 0.92`, `metalness: 0.02`), tinted per-zone per the shelf colors above, fully opaque.

This keeps every pallet visible through the open sides of the frame from any camera angle (the same guarantee the current transparency provided), while the shelving itself reads as solid, real architecture like the reference.

## Explicit Non-Goals

- No changes to `CameraFocusController`, `OrbitControls` configuration, or any camera animation logic.
- No changes to interaction logic (hover/click/selection state itself) — only how those states are *rendered*.
- No changes to the hover tooltip UI (the HTML overlay in `WarehouseScene.tsx`).
- No post-processing pipeline (e.g. SSAO) — the softer look comes from lighting and material changes only, not a new rendering pass.
- No changes to `warehouse-math.ts`'s position calculations — only `constants.ts`'s size/color-adjacent values and the mesh/material code in the three component files.
- Zone floor-band removal and grid-color softening are the only floor-plane changes; no other floor geometry changes.
