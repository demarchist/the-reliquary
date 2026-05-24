# Team Manager

A sport-agnostic team manager for amateur teams — sailboat crews, D&D parties,
soccer squads, anything where you've got people filling roles at scheduled events.

## Quick start

```sh
cd apps/team-manager
npm install
npm run dev          # http://localhost:4321
```

## Data model

- **Team** — name, activity, and a configurable list of **Positions**.
- **Position** — label, slot count (e.g. 3 trimmers), required flag.
- **Player** — name + contact, with default positions they typically play.
- **Event** (fixture) — race, match, practice, etc., with a lineup of
  `(positionId, slot, playerId)` triples generated from the team's positions.

The setup wizard ships with presets for sailboat racing, D&D, and 11-a-side
soccer, plus a blank slate.

## Storage

All data lives in `data/db.json`, read/written through `src/lib/store.ts`'s
`TeamStore` interface. To swap in BigQuery later, implement a `BigQueryStore`
in the same file and export it as `store`.

API routes under `src/pages/api/` are thin shells around the store:

```
GET  /api/teams              list
POST /api/teams              create
GET  /api/teams/[id]         read
PATCH /api/teams/[id]        update (incl. positions)
DELETE /api/teams/[id]       delete (cascades players + events)

POST  /api/players           create
PATCH /api/players/[id]      update
DELETE /api/players/[id]     delete (clears lineup slots)

POST  /api/events            create (auto-generates lineup from positions)
PATCH /api/events/[id]       update (incl. lineup)
DELETE /api/events/[id]      delete
```

## Stack

- Astro 5 in server mode (`@astrojs/node` standalone adapter)
- Tailwind v4 (utilities defined via `@utility` in `src/styles/global.css`)
- Vanilla JS for client interactivity (no React/Svelte dependency yet)
