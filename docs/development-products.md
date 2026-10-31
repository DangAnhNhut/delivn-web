# DELIVN persistent local development products

Normal manual development uses persistent product data in local `delivn_dev`. Automated Playwright tests remain isolated in resettable `delivn_e2e` and keep their separate F5 guards.

## Verify the target first

Before migrations or seeding, confirm the effective `DATABASE_URL` in the current shell resolves to PostgreSQL on `localhost` or `127.0.0.1` with the database path `/delivn_dev`. A PowerShell environment variable overrides `.env.local`, so clear any stale E2E override before continuing.

Run this credential-safe preflight in the same PowerShell session before `db:migrate` or `dev:seed`:

```powershell
npx tsx -e 'import { loadEnvConfig } from "@next/env"; import { loadDevProductEnvironment } from "./src/server/dev-products/dev-product-environment"; loadEnvConfig(process.cwd()); const { databaseUrl } = loadDevProductEnvironment(process.env); const target = new URL(databaseUrl); console.log({ protocol: target.protocol.slice(0, -1), host: target.hostname, port: target.port || "5432", database: target.pathname.slice(1) });'
```

Proceed only when it prints PostgreSQL, a loopback host, and `database: 'delivn_dev'`. The command fails for stale E2E, remote, or otherwise unsafe targets and never prints credentials or the full connection string. The `dev:seed` command independently enforces the same target restrictions and verifies `current_database()` after connecting.

## One-time bootstrap or intentional fixture update

```powershell
npm run db:migrate
npm run dev:seed
```

`dev:seed` creates or restores only deterministic `DEV-LOCAL-*` products, variants, and media. Missing inventory rows start at synthetic development stock `quantity = 100` and `reserved_quantity = 0`. Existing inventory values are preserved exactly, including reservations created by local checkout activity. The command never deletes orders and is not a database reset.

## Normal daily workflow

Start PostgreSQL, then run:

```powershell
npm run dev
```

Browse `http://localhost:3000` or `http://localhost:3000/san-pham`. PostgreSQL persistence keeps the products between application restarts; `dev:seed` is not run automatically and `DELIVN_E2E_DATABASE_URL` is not required for normal browsing.
