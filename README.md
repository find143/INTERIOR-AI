# INTERIOR-AI

Modern static SPA + Express backend for an interior design showcase and contact intake.

**Quick overview**
- Frontend: single-page app served from `public/index.html` (gallery, hero, contact form, planner, contract modal).
- Backend: `server.js` — Express server exposing REST endpoints and serving static assets.
- Database: local SQLite file managed via `db.js` (uses `better-sqlite3`).

**Features**
- Responsive landing page and project gallery (50 images).
- Contact form that persists submissions to the local SQLite DB (`contact_requests` table).
- Simple API endpoints for contractors and budget optimization.

**Requirements**
- Node.js 18+ (tested with Node 24 in dev container)
- npm

**Install & run (local)**
1. Install dependencies:

	```bash
	npm install
	```

2. Start the server:

	```bash
	npm start
	```

3. Open http://localhost:3000 in your browser.

**Environment**
- Optionally set `GEMINI_API_KEY` in a `.env` file for the budget optimization/Gemini integration used by `server.js`.

**Important files**
- `public/index.html` — main frontend UI and client-side scripts (gallery rendering, contact form).
- `server.js` — Express server and API routes.
- `db.js` — SQLite initialization and helper functions (seeds contractor data on first run).

**API endpoints**
- `GET /api/contractors` — list seeded contractors.
- `POST /api/contact` — accept contact submissions (name, email, phone, message) and save to DB.
- `POST /api/budget/optimize` — budget optimization (calls Gemini if `GEMINI_API_KEY` present; has fallback behavior).

Example: submit a contact via curl

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","phone":"+91 80087 26709","message":"Interested in a remodel"}'
```

**Gallery images**
The gallery is currently populated from Unsplash (search query for interior-design) with a Picsum fallback to improve reliability in restricted environments. If you prefer local images (no external requests), add your images under `public/assets/gallery/` and update `renderProjectGallery()` in `public/index.html` accordingly.

**Troubleshooting**
- If images do not load in Codespaces or restricted networks, try opening the site locally in a browser with network access or provide local assets as above.
- If `better-sqlite3` fails to install, ensure the Node version matches a supported `better-sqlite3` release; rebuild native modules if needed.

**Next steps you might want**
- Add an admin UI to view contact submissions.
- Replace external gallery images with curated local assets.
- Add email/SMS notifications for new contact requests.

If you'd like, I can add a small set of local placeholder images into `public/assets/gallery/` so gallery images never rely on external services.