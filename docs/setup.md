# Setup

## Prerequisites

- Node.js 18+ and npm
- Nothing else for local development — SQLite is used automatically, no database server to
  install or configure.

## Install

```bash
npm run install:all
```

This installs dependencies in both `server/` and `client/`.

## Environment variables (`server/.env`)

Copy `server/.env.example` to `server/.env`. All variables:

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `5001` | API port |
| `NODE_ENV` | `development` | |
| `DB_DIALECT` | `sqlite` | `sqlite` or `mysql` |
| `DB_STORAGE` | `./database/dev.sqlite` | Only used when `DB_DIALECT=sqlite` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | — | Only used when `DB_DIALECT=mysql` |
| `JWT_SECRET` | *(placeholder)* | **Change this in any real deployment** |
| `JWT_EXPIRES_IN` | `7d` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-list |
| `SEED_DEMO_PASSWORD` | `Demo@1234` | Password assigned to every seeded account |

Never commit a real `.env` file — it's already in `.gitignore`.

## Switching to MySQL

1. Create a database and user: `CREATE DATABASE rurify; CREATE USER 'rurify'@'%' IDENTIFIED BY '...'; GRANT ALL ON rurify.* TO 'rurify'@'%';`
2. In `server/.env`, set `DB_DIALECT=mysql` and fill in `DB_HOST`, `DB_PORT`, `DB_NAME`,
   `DB_USER`, `DB_PASSWORD`.
3. Run `npm run seed` (from the repo root) to create the schema and seed data. The seed script
   refuses to run against a MySQL database in `NODE_ENV=production` unless `FORCE_SEED=1` is
   also set, as a safety guard against accidentally wiping a real deployment.
4. `database/schema.sql` is kept as a hand-maintained MySQL DDL mirror of the Sequelize models,
   useful for inspection or for provisioning a database without running the seed script.

## Seed data

```bash
npm run seed
```

Re-running this **drops and recreates every table** (`sequelize.sync({ force: true })`) —
intended for development only. It creates:

- 5 regions (Maharashtra towns), 6 categories, 35 products
- 10 vendor accounts, 20 retailer accounts, 1 admin account
- 50+ inventory rows, retailer↔vendor connections
- Search history, demand requests, and orders tuned so the Demand Intelligence Score produces
  the exact top-5 ranking and aggregate numbers described in the project brief and in the
  root README's demo flows — computed live, not hard-coded

## Running the app

```bash
npm run dev
```

Starts the API (`server`, port from `.env`, default 5001) and the Vite dev server (`client`,
default port 5173 — Vite will pick the next free port if 5173 is already in use locally, and
will print the actual URL) together via `concurrently`.

To run them separately:

```bash
npm run server   # API only
npm run client   # frontend only
```

## Frontend configuration

The Vite dev server proxies `/api/*` to the backend (see `client/vite.config.js`), so the
frontend never needs to know the API's absolute URL in development. For a production build,
serve `client/dist` behind the same reverse proxy that routes `/api` to the Express server, or
set an absolute API base URL in `client/src/services/api.js` if they're deployed separately.

## Running a production build

```bash
cd client && npm run build   # outputs client/dist
cd server && NODE_ENV=production node app.js
```

## Troubleshooting

- **Port already in use**: both `server/.env` (`PORT`) and Vite (automatic) will pick around a
  busy port, but check `server/.env`'s `CLIENT_ORIGIN` and the proxy target in
  `client/vite.config.js` if you change the backend port manually.
- **`SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`** on registration: the `regionId` you
  sent doesn't exist — reseed the database or use a region id from `GET /api/regions`.
- **CSV import rejects every row**: check the required columns —
  `productName, category, unit, quantity, price, moq` (case-sensitive header names).
