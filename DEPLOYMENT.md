# ApprovalIQ Deployment Guide

This project is prepared for a beginner-friendly deployment on Render with MongoDB Atlas.

## Recommended setup

- Host the app on Render as one Node web service.
- Host the database on MongoDB Atlas.
- Store uploaded files on a Render persistent disk.

This matches the current codebase well because the backend can serve the React app, the API, and uploaded files from one place.

## What you need

- A GitHub account
- A Render account
- A MongoDB Atlas account
- Your code pushed to a GitHub repository

## Step 1: Push this project to GitHub

If this project is not on GitHub yet:

```powershell
git add .
git commit -m "Prepare app for deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

If it is already connected to GitHub:

```powershell
git push origin main
```

## Step 2: Create the MongoDB Atlas database

1. Create an Atlas project.
2. Create a cluster.
3. Create a database user.
4. Add a network access rule that lets Render connect.
5. Copy the Node.js connection string.

Example format:

```text
mongodb+srv://USERNAME:PASSWORD@cluster-name.xxxxx.mongodb.net/approvaliq?retryWrites=true&w=majority
```

Replace:

- `USERNAME` with your Atlas database username
- `PASSWORD` with your Atlas database password
- `approvaliq` with your preferred database name if you want a different one

## Step 3: Deploy with Render Blueprint

1. In Render, click `New +`.
2. Choose `Blueprint`.
3. Connect your GitHub repo.
4. Render will detect the `render.yaml` file in the repo root.
5. Continue the setup.

The blueprint will create:

- one Node web service
- a persistent disk for `server/uploads`
- the correct build and start commands

## Optional: enable GitHub CI/CD

This repo now includes a GitHub Actions workflow at `.github/workflows/ci-cd.yml`.

What it does:

- runs backend tests on every push to `main`
- runs backend syntax checks on every push to `main`
- builds the frontend on every push to `main`
- runs the same checks for pull requests targeting `main`
- can trigger a Render deploy automatically after checks pass on `main`

To enable automatic deploys:

1. In Render, open your web service.
2. Find the deploy hook URL.
3. In GitHub, open `Settings` -> `Secrets and variables` -> `Actions`.
4. Add a repository secret named `RENDER_DEPLOY_HOOK_URL`.
5. Paste the Render deploy hook URL as the value.

If that secret is missing, the CI checks still run, but deployment is skipped.

## Step 4: Set the environment variables in Render

Required:

- `MONGO_URI`
- `JWT_SECRET`

Recommended:

- `CORS_ORIGIN`
- `BOOTSTRAP_USER_NAME`
- `BOOTSTRAP_USER_EMAIL`
- `BOOTSTRAP_USER_PASSWORD`
- `BOOTSTRAP_USER_ROLE`

Recommended first deploy values:

```text
CORS_ORIGIN=https://your-app-name.onrender.com
BOOTSTRAP_USER_NAME=System Principal
BOOTSTRAP_USER_EMAIL=principal@example.com
BOOTSTRAP_USER_PASSWORD=choose-a-strong-password
BOOTSTRAP_USER_ROLE=principal
```

Notes:

- `JWT_SECRET` should be a long random string.
- The bootstrap user is only for creating your first working login.
- After you log in successfully the first time, remove `BOOTSTRAP_USER_PASSWORD` from Render and redeploy.

## Step 5: Wait for the deploy to complete

After the deploy succeeds:

1. Open the Render URL.
2. Check that the login page loads.
3. Sign in with the bootstrap user.
4. Create any other accounts you need inside the app.

## Step 6: Post-deploy test checklist

Test these in order:

1. Open `/api/health`
2. Log in
3. Create a request
4. Upload a file
5. Open the uploaded file
6. Approve or reject a request
7. Refresh a deep route like `/dashboard`

If these work, the deployment is healthy.

## Common issues

### Build works but the app page is blank

Check that:

- the latest commit was deployed
- the client build completed successfully
- the browser console has no failing requests

### The server runs but login fails

Usually one of these is wrong:

- `MONGO_URI`
- `JWT_SECRET`
- the bootstrap user values

### Uploads disappear after redeploy

That means the service is not using persistent disk storage. This project stores uploads on disk, so keep the Render disk enabled.

### Atlas connection fails

Check:

- your database username and password
- Atlas network access settings
- the copied connection string

## Local production-style test

You can test the production flow before deploying:

```powershell
cd client
npm run build
cd ..\server
$env:MONGO_URI="<your-mongo-uri>"
$env:JWT_SECRET="<your-secret>"
$env:BOOTSTRAP_USER_NAME="System Principal"
$env:BOOTSTRAP_USER_EMAIL="principal@example.com"
$env:BOOTSTRAP_USER_PASSWORD="strongpassword"
node server.js
```

Then open:

```text
http://localhost:5000
```
