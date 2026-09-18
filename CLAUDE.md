# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Suotar (suoritustarkistin) — a University of Helsinki tool for registering course completions
into Sisu. Graders paste/upload rows of completions; Suotar validates them against student,
enrolment and attainment data fetched from external services, then forwards them to Sisu.
Cron jobs additionally poll MOOC courses weekly and register completions automatically.

Express + Sequelize/Postgres backend, React + Redux (thunk) + MUI frontend, Vite build,
Cypress E2E. Backend is CommonJS with `module-alias` path aliases: `@server` → `server/`,
`@shared` → `utils/`. Registered in `index.js`, declared in `package.json._moduleAliases`.

## Commands

```bash
npm run dev                    # full dev stack in docker (app :8000, adminer :8080)
npm run lint                   # oxlint (pre-commit hook runs this)
npm run format                 # oxfmt
npm run test:integration       # node --test on server/**/*.test.js
npm test                       # full Cypress E2E suite in docker (~5 min) — the CI path
npm run cypress:open           # interactive Cypress
./scripts/get_prod_db.sh       # pull production data for local debugging
```

Node 24 (`.nvmrc`, `engines`). `.npmrc` sets `ignore-scripts=true`, so husky hooks need
`npm run prepare` manually after install. Requires a `.env` based on `.env.template` for dev.

CI (`.github/workflows/ci.yml`) runs three jobs: `lint:quiet`, `test:integration`, `npm test`.

See `CLAUDE.local.md` for the fast per-spec E2E loop (`npm run e2e:spec`) — prefer it over
`npm test` while iterating.

## Architecture

### Request path

`index.js` → dotenv → module-alias → `server/instrument.js` (Sentry, must load before
`./server`) → `server/index.js`. That file builds the express app, mounts `/api` from
`server/utils/routes.js`, and diverges by environment:

- **dev/test**: express listens on `PORT + 1`; `server/index.js` itself starts the Vite dev
  server on `PORT`, which proxies `/api` to express. Only the Vite port is published, so the
  browser and Cypress hit `PORT`.
- **production**: `vite build` output in `dist/` is served statically by express on `PORT`,
  with `app.get('/{*splat}')` for client-side routing. Shibboleth charset middleware is added.

Middleware order matters and is commented in place: Sentry's express error handler must sit
after all routes but before the final 500 handler; the 404 handler catches unmatched routes.

### Auth & permissions

`parseUser`/`currentUser` in `server/utils/middleware.js` build `req.user` from Shibboleth
headers (`SHIBBOLETH_HEADERS`); in dev/test `client/utils/mockHeaders.js` fakes them from
localStorage. Authorization is route-level middleware from `server/utils/permissions.js`:
`checkGrader`, `checkAdmin`, `checkIdMatch`, per-resource checks (`deleteSingleEntry` etc.),
and `checkToken` for the machine-to-machine `POST /api/create` endpoint (`SUOTAR_TOKEN`).
Routes are grouped into sub-routers by required permission in `server/utils/routes.js`.

### Data pipeline

The central flow is **raw entries → entries → Sisu**:

1. A report arrives as raw rows (`client/utils/inputParser.js` parses the paste/file format
   documented in README) → `rawEntryController` → `raw_entries` table.
2. `server/scripts/processEntries.js` "mankels" raw entries into `entries`: fetches persons,
   grades, enrolments, study rights and earlier attainments from importer, matches each
   completion to the right course unit realisation by attainment date, and resolves study
   rights. Failures get a reason from `server/utils/failureReasons.js`; completions missing an
   enrolment go to **enrolment limbo** and are retried by cron.
3. `server/utils/sendToSisu.js` posts entries to the importer's Sisu endpoints.
4. `checkSisEntries.js` polls back registration status; `refreshEntries.js` refreshes it.

Variants of step 2 exist per source: `processMoocEntries`, `processNewMoocEntries`,
`processEoaiEntries`, `processBaiIntermediateEntries`, `processBaiAdvancedEntries`,
`processExtraEntries`, `processManualEntry`, dispatched by `chooseAutomatedScript.js`.

`server/utils/earlierCompletions.js` decides whether a completion is a duplicate or must beat
every earlier attainment.

### External services

`server/services/`: `importer.js` (Sisu data via importer-db-api — the main dependency),
`eduweb.js`, `pointsmooc.js`, `newMooc.js`. Axios instances and agents live in
`server/config/` (`importerApi.js`, `moocApi.js`, `newMoocApi.js`, `httpAgents.js`).
Tokens come from env (`IMPORTER_DB_API_TOKEN`, `EDUWEB_TOKEN`, `MOOC_TOKEN`).

In E2E all of this is faked: `e2e-importer/` is a static fixture replayer that ignores request
bodies. No secrets needed to run tests.

### Cron

`server/scripts/cronjobs.js` plus explicit `cron.schedule` calls in `server/index.js`.
Guarded by `inProduction && EDUWEB_TOKEN && MOOC_TOKEN && !STAGING && !IN_MAINTENANCE` —
setting `IN_MAINTENANCE` also flips the client into `MaintenanceView` via `GET /api/status`.

### Database

Sequelize models auto-loaded and associated in `server/models/index.js`; connection config per
`NODE_ENV` in `config/config.js` (test hardcodes `postgres://…@e2e-db:5432`). Schema changes go
in `migrations/` (umzug, run on startup from `server/database/connection.js`) — never edit an
applied migration. `server/models/factory/` holds test-data factories used by
`cypressController.js`, which exposes `/api/seed/*` routes **only** outside production; every
Cypress spec re-seeds through them.

### Client

`client/index.jsx` → `App.jsx` → `Router.jsx` with `ProtectedRoute`. State is Redux with one
reducer per domain in `client/utils/redux/`, all async work through thunks calling
`client/utils/apiConnection.js`. Pages under `client/components/` mirror the backend domains
(NewReportPage, ReportsPage, CoursesPage, UsersPage, AutomatedReportsPage, ApiChecks, Sandbox).
MUI theme in `client/theme.js`.
