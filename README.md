# שינה את חיים שלך
A web platform for שינה את החיים שלך that allows patients to access a personal area (אזור אישי) and participate in the organization’s events.

## Contents
- [Overview](#overview) • [Non‑Profit](#non-profit) • [Team](#team) • [Quick start](#quick-start) • [Handover](#handover) • [Privacy](#privacy) • [Contacts](#contacts)

## Overview
The goal of this project is to support the non-profit שינה את חיים שלך by providing a clear, simple, and accessible digital solution that helps organize information and improve communication with its target audience.
The project aims to make the organization’s work more visible, easier to manage, and more efficient, while ensuring usability, clarity, and respect for user privacy.

## Non‑Profit
- Organization:  שינה את חיים שלך
- Primary stakeholder(s): Name — role — email  
- Key deliverable for them: e.g., "Simple roster export and sign-up form."

## Team
- Team lead — Tala Jabareen — talajabareen12@gmail.com — Backend Developer - [Tala-Jabareen](https://github.com/Tala-Jabareen)
- Members — Fadi Sayej — Backend Developer — [Fadi-Sayej](https://github.com/Fadi-Sayej)
- Members — Dema Dabbagh — Frontend Developer — [demadabbagh](https://github.com/demadabbagh)
- Members — Ali Shabany — Frontend Developer — [AliShabanyJCE](https://github.com/AliShabanyJCE)
Include student IDs if required.

## Quick start (local)
1. git clone https://github.com/<org>/<repo>.git
2. cd <repo>
3. cp .env.example .env  # edit values
4. npm install
5. npm run dev
Open http://localhost:3000

(Or: docker-compose up --build)

## Demo / Deployment
- Hosting platform: Firebase Hosting
- Firebase project ID: `fullstack-team-12`
- Live URLs:
  - https://fullstack-team-12.web.app
  - https://fullstack-team-12.firebaseapp.com
- Hosting output directory: `frontend/dist`
- Manual deploy:
  1. `cd frontend`
  2. `npm ci`
  3. `npm run build`
  4. `cd ..`
  5. `firebase use fullstack-team-12`
  6. `firebase deploy --only hosting`
- CI/CD: GitHub Actions deploys Firebase Hosting automatically on every push to `main`.
- Full deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Handover (minimum)
- [ ] Deployed URL + admin credentials (shared securely)  
- [ ] HANDOVER.md with maintenance steps  
- [ ] Add non‑profit staff as repo collaborators or transfer repo

## Privacy & Security
List data collected (names, emails), storage location, and retention policy. Never commit secrets; use environment variables and GitHub secrets.

## Known limitations
Briefly list major limitations or missing features and any workarounds.

## Contacts
- Project lead: Tala Jabareen — talajabareen12@gmail.com
- Non‑profit contact: טלי רפאל — tali.reimm@gmail.com
- Instructor / TA: נועה קרניאל — noaca@post.jce.ac.il

## License
Specify license (e.g., MIT) and any IP/ownership notes relevant to the non‑profit.
