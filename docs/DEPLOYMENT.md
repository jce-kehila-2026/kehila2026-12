# Deployment Guide

This project is deployed with Firebase Hosting. The frontend is a Vite React application located in `frontend`, and Firebase Hosting serves the production build from `frontend/dist`.

## Project Overview

- Application: She-Na web platform
- Hosting provider: Firebase Hosting
- Firebase project ID: `fullstack-team-12`
- Hosting output directory: `frontend/dist`
- Main deployment branch: `main`

## Live URLs

- https://fullstack-team-12.web.app
- https://fullstack-team-12.firebaseapp.com

## Firebase Configuration

Firebase Hosting is configured in the repository root:

- `firebase.json`
- `.firebaserc`

The current hosting configuration is:

```json
{
  "hosting": {
    "public": "frontend/dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

The rewrite is required because the app uses React Router. It allows direct links such as `/admin/dashboard` or `/events` to load correctly from Firebase Hosting.

## Prerequisites

Before deploying manually, install:

1. Node.js 20 or newer
2. npm
3. Firebase CLI

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

Log in to Firebase:

```bash
firebase login
```

Select the project:

```bash
firebase use fullstack-team-12
```

## Environment Variables

The frontend uses Vite environment variables. They must be available during the build.

Required Firebase variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=fullstack-team-12
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Optional feature variables:

```bash
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_REJECT_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_TRANSLATE_PROXY_URL=
VITE_APP_VERSION=
```

Notes:

- `VITE_FIREBASE_*` values are required for the deployed app to connect to the real Firebase project.
- EmailJS variables are required only for approval/rejection email functionality.
- `VITE_TRANSLATE_PROXY_URL` is required only for the translation proxy feature.
- `VITE_APP_VERSION` is used in bug reports. In GitHub Actions it is set automatically to the commit SHA.

For local development, place these values in:

```bash
frontend/.env.local
```

Do not commit `.env.local` or secret values.

## Build Steps

From the repository root:

```bash
cd frontend
npm ci
npm run build
```

This creates the production build in:

```bash
frontend/dist
```

## Manual Deployment

From the repository root:

```bash
cd frontend
npm ci
npm run build
cd ..
firebase use fullstack-team-12
firebase deploy --only hosting
```

To deploy Firestore rules and indexes too:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

To deploy Cloud Functions too:

```bash
firebase deploy --only functions
```

For the normal website deployment, use:

```bash
firebase deploy --only hosting
```

## Automatic Deployment from GitHub

Automatic deployment is configured with:

```bash
.github/workflows/firebase-hosting-main.yml
```

The workflow runs on every push to:

```bash
main
```

It performs these steps:

1. Checks out the repository.
2. Installs Node.js 20.
3. Installs frontend dependencies with `npm ci`.
4. Builds the frontend with `npm run build`.
5. Deploys `frontend/dist` to Firebase Hosting.

## Required GitHub Secrets

Add these secrets in GitHub:

Repository page -> Settings -> Secrets and variables -> Actions -> New repository secret

Required deployment secret:

```bash
FIREBASE_SERVICE_ACCOUNT_FULLSTACK_TEAM_12
```

Required frontend secrets:

```bash
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Optional frontend secrets:

```bash
VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID
VITE_EMAILJS_REJECT_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY
VITE_TRANSLATE_PROXY_URL
```

## Creating the Firebase Service Account Secret

Option A: Firebase CLI command

```bash
firebase init hosting:github
```

Select:

- Firebase project: `fullstack-team-12`
- GitHub repository: `jce-kehila-2026/kehila2026-12`
- Deploy on merge/push to `main`

Firebase can create the service account secret automatically.

Option B: Manual Firebase Console setup

1. Open Firebase Console.
2. Select project `fullstack-team-12`.
3. Go to Project settings.
4. Open the Service accounts tab.
5. Click Generate new private key.
6. Copy the entire JSON file contents.
7. In GitHub, open the repository settings.
8. Go to Secrets and variables -> Actions.
9. Create a new repository secret named:

```bash
FIREBASE_SERVICE_ACCOUNT_FULLSTACK_TEAM_12
```

10. Paste the full JSON content as the secret value.

The service account must have permission to deploy Firebase Hosting for the `fullstack-team-12` project.

## Verifying a Successful Deployment

After a manual deploy or GitHub Actions deploy:

1. Open the GitHub Actions tab and confirm the workflow completed successfully.
2. Open Firebase Console -> Hosting and confirm a new release was created.
3. Open the live site:

```bash
https://fullstack-team-12.web.app
```

4. Verify important routes:

```bash
/
/login
/events
/admin/dashboard
```

5. Confirm Firebase Authentication works.
6. Confirm Firestore-backed pages load real data.

## Common Troubleshooting

### The live website shows a blank page

Check that the frontend build succeeded and that Firebase Hosting is serving `frontend/dist`.

Run locally:

```bash
cd frontend
npm run build
npm run preview
```

### Firebase app connects to demo config

The production build is missing one or more `VITE_FIREBASE_*` environment variables. Add the missing values to GitHub Secrets and rerun the workflow.

### Direct links return 404

Check that `firebase.json` contains the SPA rewrite:

```json
{
  "source": "**",
  "destination": "/index.html"
}
```

### GitHub Actions deploy fails with Firebase permission error

Check that `FIREBASE_SERVICE_ACCOUNT_FULLSTACK_TEAM_12` exists and contains the full service account JSON. Also confirm the service account has Firebase Hosting deployment permissions.

### Build works locally but fails in GitHub Actions

Check:

- Node.js version is 20.
- All required GitHub Secrets exist.
- `frontend/package-lock.json` is committed.
- The workflow runs from the repository root and builds inside `frontend`.

## Code Review Answer

After the required GitHub Secrets are added and the first workflow run succeeds, the team can answer:

- The project is deployed to Firebase Hosting.
- The deployment process is documented.
- Pushes to `main` automatically build and deploy the latest version.
