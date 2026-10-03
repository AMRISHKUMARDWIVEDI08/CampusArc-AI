# CampusArc AI deployment

## Architecture

- Frontend: existing Vercel project, `campusarc-ai`.
- API: Render web service from the `backend` directory using `render.yaml`.
- Persistent database: Turso/libSQL remote database. Do not use local SQLite for production because free container filesystems can be reset.
- Initial network: Arc Testnet. Do not enable mainnet payments until testnet payment verification and reconciliation pass.

## Deploy sequence

1. Create a Turso database and an auth token in the user's own Turso account.
2. Import this repository into Render as a Blueprint from the reviewed deployment branch.
3. Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in Render's environment settings. Keep tokens private.
4. Deploy and open `https://<render-service-host>/health`. It must return HTTP 200 and `database: "connected"`.
5. In the existing Vercel project, set `NEXT_PUBLIC_API_URL` to the Render service's HTTPS origin, without a trailing slash, then redeploy the same frontend project.
6. Confirm the browser's registration/login requests reach the Render API and database.
7. Create demo data only after database migrations pass. Use unique demo-only passwords and never seed production student information.

## Required API environment variables

- `NODE_ENV=production`
- `JWT_SECRET`: generated secret of at least 32 characters
- `DATABASE_URL`: Turso/libSQL URL
- `DATABASE_AUTH_TOKEN`: private Turso token
- `CORS_ORIGINS=https://campusarc-ai.vercel.app`
- `ARC_NETWORK=arc-testnet` until payment QA is signed off

Optional AI provider keys should be added only when the owner chooses a provider and understands its billing.

## Release gates

- API health confirms database connectivity.
- Migrations run automatically at API startup and are safe to repeat.
- Student registration rejects invalid school join codes and creates no partial accounts.
- Login, token validation, role checks, and school/admin flows pass.
- AI clearly reports provider unavailability instead of fabricating answers.
- Payment completion requires an on-chain transaction verification and reconciliation.
- No real school/student personal data or mainnet funds are used during initial testing.

## Cost and reliability note

Free hosting tiers are suitable for initial verification, not a promise of production uptime. Check each provider's current limits and database retention policy before using real school data.
