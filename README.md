# CampusArc AI

Global, mobile-first education + AI + USDC campus platform built around the Arc ecosystem.

## Current architecture

- Frontend: Next.js static-export-friendly UI for mobile, tablet and desktop.
- Backend: Node.js + Express REST API.
- Database: SQLite/LibSQL without native sqlite3 or node-gyp dependencies.
- Payments: direct student wallet → school wallet USDC transfers on Arc Testnet, followed by backend on-chain verification and reconciliation.
- AI: provider boundary for real Gemini/Claude responses; the UI does not fabricate answers when a provider is unavailable.
- Circle Developer API: intentionally not used by the product runtime.
- Arc App Kit: use only where it adds real value, such as future cross-chain bridging or unified-balance flows; simple Arc Testnet USDC payment does not require an extra kit layer.

## Demo preparation

The backend includes an idempotent demo-data seed command. Configure `DEMO_ADMIN_PASSWORD` and `DEMO_STUDENT_PASSWORD` (8-72 characters) before running `npm run db:seed-demo`. Add `DEMO_SCHOOL_WALLET_ADDRESS` only when the team should test a real Arc Testnet USDC payment.

The demo seed creates a school, admin account, student account, fee ledger, attendance, homework, exams and notifications. No secret or private key belongs in the repository.

## Development status

Active development. Production readiness is not claimed until the QA Release Gate passes end-to-end.

## Safety rules

- Never commit secrets, API keys, private keys, seed phrases, or real environment values.
- Wallet connection is not user authentication; production wallet login must use a signed challenge.
- Blockchain payment status is only considered complete after actual on-chain verification and reconciliation.
- Vercel deployment remains deferred until build/config/runtime validation is complete.
