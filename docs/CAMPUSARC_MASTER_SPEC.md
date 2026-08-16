# CampusArc AI — Master Product Specification

## Product identity
- Name: CampusArc AI
- Vision: global campus platform combining education, AI research/learning, school operations, and USDC payments on Arc.
- Default UI language: English-first. Hindi is explicitly excluded from the app, language selector, UI copy, AI language options, voice options, and Help Center.
- Platform: responsive mobile-first web app; Next.js static export frontend + Node.js/Express backend + embedded SQLite/LibSQL-compatible persistence.

## Opening experience
- On first/open experience: voice welcome, “Welcome to CampusArc AI.”
- User can disable or configure voice. Important actions may receive concise voice confirmation.

## Authentication
- Email/password and/or OTP/magic-link flow.
- Google/social login where configured.
- Wallet authentication by signing a message; connecting a wallet alone is not authentication.
- Mobile wallet discovery/connection.
- Desktop browser extension wallet connection.
- WalletConnect-compatible mobile flow where appropriate.
- School/institution login and future SSO.
- Multiple login methods can be linked to one CampusArc account.
- Account recovery, passkeys/2FA where supported, device/session management, remote logout.

## Roles
- Student
- Parent
- Teacher
- School Admin
- Institution/Staff roles can be added without breaking tenant isolation.

## Education
- Student profile, classes, subjects, attendance, homework, assignments, exams, grades/results, teacher feedback, certificates, calendar, announcements, documents.
- Student progress center with trends and weak/strong areas.
- AI exam preparation, quizzes, flashcards, study plans.

## Campus AI
AI is more than a chatbot and has four primary modes:
1. Ask AI — general academic and campus questions.
2. Research — web research with source links/citations.
3. Study from Files — user-provided PDFs/notes/documents.
4. Deep Research — multi-step research and structured reports.

Additional AI roles:
- AI Tutor
- Parent AI
- Teacher AI
- Admin AI
- AI navigation/command center
- AI Help Assistant

AI must respect role/data permissions. Clearly distinguish sources: web, uploaded documents, or campus data.

## AI plans
- Free tier with sensible usage limits.
- Paid student plans with higher limits and advanced research/document/voice capabilities.
- Institutional plans for schools.
- No financial action is executed by AI without explicit user confirmation.

## Payments
- USDC fee/invoice payments on Arc.
- Circle wallet/payment rails where appropriate.
- Payment initiation, verification, reconciliation, receipts, history.
- Transaction states: pending, processing, completed, failed, under_review, reconciliation_required, disputed as appropriate.
- Handle duplicate, partial, wrong-invoice, delayed, and successful-on-chain-but-not-reconciled cases.
- Link payment to school, student, invoice, amount, transaction hash, timestamp, and receipt.
- Payment dispute/support workflow.

## Wallet UX
- Mobile wallets and browser extension wallets.
- Never require a payment transaction for login; use signed-message authentication.
- Advanced blockchain details can be shown on demand rather than forcing blockchain complexity into the primary UX.

## Global/localization
- Multi-language architecture excluding Hindi.
- User can change language at any time.
- AI responses, Help Center, notifications and voice follow selected language where supported.
- Country-aware currency display, timezone, date/number formatting.
- RTL support for applicable languages.
- Translation is separate from app-language selection.

## Voice
- Welcome voice.
- Concise confirmations for important actions such as successful payments and important account changes.
- Voice on/off, speed/volume controls where supported.
- Voice AI/Tutor is an advanced feature.

## Help & support
- Help Center with search.
- Getting Started, Payments, Wallet, Academics, AI Tutor, Language, Voice, Parent, Teacher, Admin sections.
- Interactive/visual tutorials.
- AI Help Assistant.
- Human/school support escalation.

## Notifications & action center
- Notification Center for fees, assignments, exams, attendance, announcements, payments and AI/research completion.
- Action Center groups pending/high-priority tasks.

## Documents
- Secure Document Vault.
- Receipts, report cards, certificates, assignments and school documents.
- AI document search/analysis only within permitted scope.

## Security & privacy
- Multi-school tenant isolation using school_id.
- Role-based authorization.
- AI permission boundaries.
- Audit logs.
- Privacy/consent controls.
- AI memory controls.
- Conversation/data export and deletion controls.
- Session/device management.
- Security alerts.

## Accessibility
- Text scaling, high contrast, reduced motion, keyboard navigation, screen-reader support and voice controls.

## Offline/poor connectivity
- Cached dashboard/data where safe.
- Last-updated timestamps.
- Connection recovery and safe pending-action handling.

## Analytics
Student: academic/attendance/learning progress.
Admin: fee collection, pending fees, failed payments, reconciliation, attendance, academic trends, AI usage and engagement.
System health: AI, payment, wallet, database and Arc integration status.

## Architecture rules
- Keep the Termux/mobile environment lightweight and memory efficient.
- Avoid native C++ database packages that require node-gyp.
- Keep frontend as static export; no frontend API routes/server logic.
- Backend owns business logic, authentication, AI proxying, payments, reconciliation and blockchain integration.
- Prefer lightweight HTTP/RPC integrations where an Arc SDK conflicts with the existing runtime constraints.
- Never commit secrets, private keys, wallet credentials, or real environment values.

## MVP golden flow
Login → Student Dashboard → Academic Data → Ask/Research AI → School Fee → Pay USDC → Arc verification → Payment reconciliation → Receipt → Admin history.

## Future/advanced
- Cross-chain USDC/Bridge.
- Unified balance.
- Advanced wallet features.
- Institutional SSO.
- More advanced analytics and AI research.

## UI direction
- Distinctive glassmorphic education + fintech visual system.
- Mobile-first responsive layouts.
- Light/dark mode.
- Clear primary actions and minimal blockchain jargon.
- Voice/accessibility controls always discoverable.
