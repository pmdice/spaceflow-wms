# SpaceFlow WMS — Interview Brief
**Claimini / Head of IT — Hamburg | 2026-04-27**

---

## 0. Repo Top-Level

```
spaceflow-wms/                     ← git root, pnpm workspace
├── apps/
│   ├── api/                       NestJS v11 scaffold (TypeScript, Jest)
│   └── web/                       Next.js 16 App Router (React 19, TS 5)
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/parse-intent/route.ts   ← BFF: OpenAI intent parsing
│       │   │   ├── features/
│       │   │   │   ├── ai-search/              MagicSearchbar
│       │   │   │   ├── logistics-table/        TanStack Table + Virtual
│       │   │   │   ├── parcel-detail/          detail panel
│       │   │   │   └── warehouse-3d/           Three.js/R3F scene
│       │   │   └── inventory/page.tsx
│       │   ├── components/ui/                  shadcn/ui generated
│       │   ├── store/                          Zustand + filter logic
│       │   ├── types/wms.ts                    Zod schemas + TS types
│       │   └── lib/                            utils, KPIs, math, events
│       └── public/data/pallets.json            20 seed pallets
├── docs/
├── .claude/settings.local.json    ← Claude Code CLI config
├── .github/workflows/ci.yml       GitHub Actions (lint + build)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json                   (monorepo root, pnpm@10.30.3)
```

No `packages/` directory populated — workspace config references it, intentionally empty for future shared libs.

---

## 1. Stack Inventory

| Claimini item | In project? | Detail |
|---|---|---|
| **TypeScript** | Yes | `^5.7` (api), `^5` (web) |
| **React** | Yes | `19.2.3` |
| **Turborepo** | Yes | `turbo ^2.5.6`; `turbo.json` orchestrates `build/lint/dev` with env var propagation and output caching |
| **TanStack Table** | Yes | `@tanstack/react-table ^8.21.3` — `LogisticsTable.tsx`, sortable columns with typed `ColumnDef<SpatialPallet>[]` |
| **TanStack Virtual** | Yes | `@tanstack/react-virtual ^3.13.18` — same file, `useVirtualizer` with `overscan: 8`, `estimateSize: 72` |
| **TanStack Query** | No | State via Zustand + native `fetch`. Defend: no server cache invalidation needed; all mutations are optimistic/local; TanStack Query would add network-layer complexity for zero benefit here. |
| **TanStack Router** | No | Next.js 16 App Router used instead — same concept (file-system, type-safe routes), different implementation. Would add TanStack Router in a standalone SPA context. |
| **TanStack Form** | No | No form-heavy UI in this prototype. Would reach for it on any multi-step warehouse form flow. |
| **Tailwind** | Yes | `tailwindcss ^4` with `@tailwindcss/postcss ^4` and `tw-animate-css` |
| **shadcn/ui** | Yes | `shadcn ^3.8.5` dev dep; components in `src/components/ui/` — badge, button, card, input, separator, sheet, sidebar, skeleton, sonner, table, tooltip, avatar, chart |
| **Storybook** | No | See §6. |
| **Fastify** | No | NestJS v11 scaffold on the API side. See §6. |
| **Drizzle** | No | No ORM — data is static JSON. A Prisma + BetterAuth integration was built in the dev branch (`feat(auth): BetterAuth + Prisma adapter + RBAC`) and stripped in the monorepo migration. Drizzle is the natural next step for the DB layer. |
| **Zod** | Yes | `zod ^4.3.6` — **the** source of truth for the AI contract. Three schemas in `types/wms.ts`: `LogisticsFilterSchema`, `PalletActionSchema`, `LogisticsIntentSchema`. Also used for runtime validation of the OpenAI response. |
| **OpenAPI generation** | No | Zod schemas serve the same contractual purpose client-side. See §6. |
| **PostgreSQL / AWS RDS** | No | No database in this build. See §6. |
| **Vitest** | Yes | `vitest ^4.0.0` — 2 test files, 5 tests, all passing. Tests `filterPallets` and `calculateLogisticsKpis` with deterministic fixtures. |
| **Playwright** | No | See §6. |
| **Sentry** | No | `console.error` only. See §6. |
| **AI-assisted dev** | Yes | Claude Code CLI (`.claude/settings.local.json` present and active); OpenAI SDK v6 (`openai ^6.22.0`) powering the product AI feature; `zodResponseFormat` from the OpenAI SDK for structured outputs. |

---

## 2. Architecture Map

**Repo structure:** Turborepo monorepo. Two apps: `@spaceflow/web` (Next.js 16) and `@spaceflow/api` (NestJS v11 scaffold, unused in runtime). Shared `packages/` dir is empty — reserved for future shared type or config packages.

**Frontend → Backend data flow:**
On mount, the web app fetches `pallets.json` from the public dir into a Zustand store. When the user types a natural-language query, `MagicSearchbar` POSTs the prompt to `/api/parse-intent` (a Next.js Route Handler acting as a BFF). That route calls OpenAI's `gpt-4o-mini` with `zodResponseFormat(LogisticsIntentSchema)` — which instructs the model to respond with JSON matching the Zod schema exactly. The response is parsed and validated server-side with `LogisticsIntentSchema.parse(...)`, then returned to the client. The store's `applyAIFilter` or `applyBulkPalletAction` mutates state, which React re-renders synchronously — the 3D scene, table, and KPI panel all update from the same Zustand slice.

**Where Zod lives and what it validates:**
`apps/web/src/types/wms.ts` contains all three schemas:
- `LogisticsFilterSchema` — 7 fields (palletId, destination, status, urgencyLevel, weightMin/Max, highlightColor), each with `.describe()` annotations passed verbatim to the LLM as field instructions.
- `PalletActionSchema` — discriminated enum of 9 warehouse operations (receive, putaway, scan, relocate, pick, load, delay, set_status, set_destination).
- `LogisticsIntentSchema` — composes both into the top-level intent object (intentType, filter, action, maxTargets, targeting fields).

TypeScript types (`LogisticsFilter`, `PalletAction`, `LogisticsIntent`) are derived with `z.infer<>` — the schema **is** the type, no duplication.

**How types flow from DB → API → frontend:**
No live DB in current build. Intended chain: Drizzle schema → inferred TypeScript types → shared across API and web via a `packages/` shared lib → frontend consumes. The Zod schemas in `wms.ts` already play that role for the AI contract layer.

**Auth:** BetterAuth with RBAC and a Prisma adapter was built in the `development` branch (`feat(auth): BetterAuth + Prisma adapter + RBAC (default role, session role)`) and middleware extended for route protection. Stripped in the v0.1.5 monorepo migration but visible in git history.

**State management:** Zustand v5 (`useLogisticsStore`) — single slice, typed `create<LogisticsState>`. All pallet mutations are pure functions (`mutatePalletForAction`) called inside store actions, with undo support via `restorePalletState`.

**Routing:** Next.js App Router — file-system routes. `app/inventory/page.tsx` is the main view. `app/api/parse-intent/route.ts` is the BFF endpoint.

---

## 3. Three Killer Code Examples

### Example 1 — Zod as the AI contract
**File:** `apps/web/src/types/wms.ts` · lines 28–82
**Interview question:** "How do you ensure type safety with AI-generated outputs?"

```ts
export const LogisticsFilterSchema = z.object({
    palletId: z.string().nullable()
        .describe("Die konkrete Paletten-ID (z.B. 'PAL-00001') bei direkter Suche."),
    status: z.enum(['all', 'stored', 'transit', 'delayed'])
        .describe("Der Status der Fracht. 'all', wenn nicht spezifisch gefragt."),
    weightMinKg: z.number().nullable()
        .describe("Minimales Gewicht in kg. Beispiel: 'über 300kg' => 300."),
    // ...
});
export type LogisticsFilter = z.infer<typeof LogisticsFilterSchema>;
```

Used downstream in the API route:
```ts
const completion = await openai.chat.completions.create({
    response_format: zodResponseFormat(LogisticsIntentSchema, 'logistics_intent'),
    // ...
});
const safeData = LogisticsIntentSchema.parse(parsedIntent); // runtime guard
```

**Why it's good:** The schema serves three roles simultaneously — OpenAI structured-output contract, runtime validator of the LLM response, and TypeScript type source. Adding a field means updating one object; types, validation, and LLM instructions all update automatically.

---

### Example 2 — TanStack Table + Virtual in one component
**File:** `apps/web/src/app/features/logistics-table/components/LogisticsTable.tsx` · lines 136–157
**Interview question:** "How do you handle large data sets in the UI?"

```ts
const table = useReactTable({
    data: pallets,            // filteredPallets from Zustand
    columns,
    state: { sorting },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
});

const rows = table.getRowModel().rows;
const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 8,             // render 8 rows outside viewport
});
const virtualRows = rowVirtualizer.getVirtualItems();
const paddingTop    = virtualRows[0]?.start ?? 0;
const paddingBottom = rowVirtualizer.getTotalSize()
    - (virtualRows.at(-1)?.end ?? 0);
```

**Why it's good:** TanStack Table owns sort/column logic, Virtual owns the DOM rendering budget — neither leaks into the other. The padding row trick keeps the scrollbar correct without rendering real rows; the pattern scales to 100k rows without modification.

---

### Example 3 — Bulk action with undo via Zustand snapshot
**File:** `apps/web/src/app/features/ai-search/components/MagicSearchbar.tsx` · lines 61–83
**Interview question:** "How do you handle destructive operations triggered by AI?"

```ts
const targets = filterPallets(beforeState.pallets, data.intent.filter)
    .slice(0, Math.max(1, Math.min(50, data.intent.maxTargets)));
const previous = targets.map((t) => ({
    ...t, logicalAddress: { ...t.logicalAddress }  // deep clone before mutation
}));

const result = applyBulkPalletAction(
    data.intent.action, data.intent.filter,
    data.intent.maxTargets, overrides,
);
if (result.affected > 0) {
    toast.success(getBulkActionToastTitle(data.intent.action, result.affected), {
        action: {
            label: 'Undo',
            onClick: () => restorePalletState(previous, result.eventIds),
        },
    });
}
```

**Why it's good:** The undo pattern snapshots only the affected objects before mutation, restores them by ID in the store, and removes the matching event log entries — all in one `restorePalletState` call. The `maxTargets` cap (1–50, enforced in both the Zod schema and the store) ensures a bad LLM output can never bulk-mutate unbounded pallets.

---

## 4. Real Numbers

| Metric | Value |
|---|---|
| TypeScript LOC | ~4,739 (web app only) |
| Total source files (excl. node_modules/.next) | 63 |
| Apps in monorepo | 2 (`web`, `api`) |
| Packages in monorepo | 0 populated |
| Pallets in seed data | 20 |
| Warehouse slots (3 zones × 5 aisles × 8 bays × 4 levels) | 480 total addressable |
| Vitest tests | 5 across 2 files — all passing |
| Zod schemas | 3 (`LogisticsFilterSchema`, `PalletActionSchema`, `LogisticsIntentSchema`) |
| API endpoints | 1 (`POST /api/parse-intent`) |
| DB tables | 0 in current build |
| shadcn/ui components | 13 generated |
| TanStack Virtual overscan | 8 rows |
| AI model | `gpt-4o-mini`, `temperature: 0.1` |
| OpenAI request size cap | 500 chars prompt / 2000 bytes payload (enforced server-side) |

---

## 5. Decisions & Trade-offs

### Decision 1: Zustand over TanStack Query
**What:** Used Zustand v5 for all state (pallets, filter, hover, selection, simulation) rather than TanStack Query.
**Alternative:** TanStack Query with `useQuery` / `useMutation` for data fetching and cache management.
**Why this one:** The data source is static JSON — there is no server cache to invalidate. All mutations are local and optimistic (pallet state lives entirely in the browser). TanStack Query's network-centric model would add indirection for zero benefit. Zustand keeps the entire pallet lifecycle in one slice, including the undo snapshot pattern, which would be awkward to model inside TQ's cache.
**Story form:** "I reached for TanStack Query first, then realized there was no round-trip to invalidate — every mutation is optimistic and the source of truth is local. Zustand was a better fit because it let me co-locate the undo logic directly with the mutation."

---

### Decision 2: Zod `.describe()` as LLM instructions
**What:** Field descriptions on `LogisticsFilterSchema` are written in German (matching the target user base) with concrete examples and explicit null-case rules.
**Alternative:** Separate system prompt text that duplicates the field contracts.
**Why this one:** OpenAI's `zodResponseFormat` serializes `.describe()` annotations into the JSON Schema passed to the model. Writing the instructions on the schema means there is one place to update when the contract changes — type, validator, and LLM instruction stay in sync. Added `applyPromptFallbacks` as a deterministic safety net for model drift rather than raising temperature or adding retry logic.
**Story form:** "Zod's `.describe()` is a first-class place to write LLM instructions. When I need to change what 'delayed' means to the model, I change one string in the schema — not a prompt string somewhere else that can drift out of sync."

---

### Decision 3: Next.js Route Handler as BFF instead of the NestJS API
**What:** The OpenAI call lives in `apps/web/src/app/api/parse-intent/route.ts`, not in `apps/api`.
**Alternative:** Route the intent parsing through the NestJS API at `apps/api`.
**Why this one:** The NestJS app is a scaffold reserved for future domain logic (warehouse events, RBAC, external scanner integrations). Putting the AI call in a Next.js Route Handler collocates it with the frontend types it depends on (`LogisticsIntentSchema` from `wms.ts`) and removes a network hop in the prototype. The BFF pattern also keeps the OpenAI API key out of the browser. When the NestJS API matures, this route moves there — the Zod contract stays unchanged.

---

## 6. Honest Gaps

| Gap | Bridge |
|---|---|
| **Fastify** | Used NestJS v11. Same TS-first, modular HTTP server philosophy. Fastify is simpler than NestJS — I'd be productive within a day. |
| **Drizzle** | No DB in current build. Built a Prisma + BetterAuth adapter in the dev branch (see commit `feat(auth): BetterAuth + Prisma adapter`). Drizzle is the natural swap: same SQL-first mindset, better TypeScript inference, lighter runtime. |
| **Storybook** | Not present. The shadcn/ui components here are generated; for a real design system I'd wire Storybook immediately. |
| **Playwright E2E** | Not present. CI runs lint + build only. First Playwright suite would cover the AI search flow and virtual table scroll behavior. |
| **OpenAPI generation** | Not present. Zod schemas serve as the typed contract for the one API route. In a multi-route NestJS backend I'd use `@nestjs/swagger` or `zod-to-openapi`. |
| **AWS RDS / PostgreSQL** | No database in this build. Would reach for Drizzle + `pg` driver + RDS as the next layer; the BetterAuth + Prisma work in the dev branch shows I've already thought through the schema design. |
| **Sentry** | Not instrumented. Would add `@sentry/nextjs` to web and `@sentry/node` to the NestJS API; the BFF route's `catch` blocks are already shaped for `captureException`. |

---

## 7. AI-Tooling Evidence

**Direct traces in the repo:**
- `.claude/settings.local.json` at repo root — Claude Code CLI is actively configured with project-level permissions.
- `openai ^6.22.0` is a production dependency; `zodResponseFormat` from `openai/helpers/zod` is used in the product, not just tooling.
- Commit messages show an AI-first build cadence: "Add MagicSearchbar component for AI-powered logistics filtering", "Add support for AI-driven pallet actions in MagicSearchbar", "Enhance README.md to reflect new AI capabilities and operations simulator", "Remove redundant comments throughout the codebase for improved readability and maintainability" (cleanup pass consistent with AI-assisted refactoring).
- `OPENAI_API_KEY` is wired through `turbo.json` env propagation and GitHub Actions secrets — AI is a first-class runtime concern, not an afterthought.

**30-second story:**
> "I use Claude Code as a pair programmer throughout the build — it's open in the terminal while I work. For SpaceFlow specifically, the AI tooling goes two layers deep: I used Claude Code to write the code, and the product itself uses an LLM (GPT-4o-mini via OpenAI's structured-output API) as the warehouse search interface. The key insight I landed on is that Zod is the right place to write LLM instructions — the `.describe()` annotations on each schema field become part of the JSON Schema sent to the model, so the TypeScript type definition, runtime validator, and LLM prompt are a single source of truth. When I iterate on the AI behavior, I edit the schema, not a separate prompt file."
