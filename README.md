# Daret Backoffice

Admin web app for reviewing and granting KYC submissions. Dark theme with green accents, aligned with Daret’s design.

## Stack

- **Vite** + **React** + **TypeScript**
- **React Router** for routing
- **Tailwind CSS** for styling
- **Axios** for API calls (JWT in `Authorization` header)
- **TanStack React Query** for data fetching and cache

## Setup

1. **Environment**

   Copy `.env.example` to `.env` and set:

   - `VITE_API_URL` – backend base URL (e.g. `http://localhost:3000`)

2. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

   App runs at `http://localhost:5173` (or the port Vite prints).

3. **Backend and admin user**

   - Backend must be running (see main repo README / `Daret_Back`). Ensure CORS allows your backoffice origin (e.g. `http://localhost:5173`).
   - Run migrations if needed: `cd Daret_Back && npx prisma migrate dev`
   - Create an admin user (if needed):

     ```bash
     cd Daret_Back
     ADMIN_SEED_EMAIL=admin@example.com ADMIN_SEED_PASSWORD=your-secure-password node prisma/scripts/seed-admin.js
     ```

   Then log in with that email and password.

## Features

- **Login** – Admin-only login; JWT stored in `localStorage`.
- **Dashboard** – Counts by status (Submitted, In review, Approved, Rejected) and quick links.
- **KYC Queue** – Filter by status, search (name/email/phone), pagination; row click opens submission detail.
- **Submission detail** – User summary, tabs (Overview, Documents, Timeline, Notes), actions: Assign to me, Mark in review, Approve, Reject (with reasons), Add comment. Document “View” uses short-lived signed URL and logs access.
- **Audit log** – List of admin actions with filters.

## Build

```bash
npm run build
```

Output is in `dist/`. For production, serve with a static server and point `VITE_API_URL` to the live API.
