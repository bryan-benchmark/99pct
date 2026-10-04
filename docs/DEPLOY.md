# Deploy (Firebase App Hosting)

Repo stays **private**. The website can still be public.

This page describes the public protocol site's existing hosting path. The private customer workspace is not ready for a production rollout. Its database, identity, migration, backup, and recovery gates are in [WORKSPACE_OPERATIONS.md](WORKSPACE_OPERATIONS.md). Workspace routes fail closed without their server configuration; a successful public-site deploy or Next build is not a workspace release check.

## Branch model

| Branch | Purpose |
|--------|---------|
| `main` | Production — automatic App Hosting rollouts |
| feature branches / PRs | Optional preview backends later; not required to start |

Do not put secrets in the repo. Use App Hosting secrets / `apphosting.yaml` env when needed.

## One-time setup (Google account)

Firebase CLI auth on this machine was expired. In your own terminal:

```bash
firebase login --reauth
gcloud auth login
```

Then either:

### A. Console (easiest for first time)

1. Open [Firebase Console](https://console.firebase.google.com/) → **Add project** → name **missionism** (accept a generated project ID if `missionism` is taken).
2. Enable **App Hosting**.
3. Create a backend:
   - Connect GitHub → `bryan-benchmark/missionism`
   - Root directory: `/`
   - Live branch: `main`
   - Automatic rollouts: on
4. Finish and deploy. Point a custom domain later under App Hosting → Domains.

### B. CLI (after login)

```bash
firebase projects:create missionism --display-name "Missionism"
# if ID taken: firebase projects:create missionism-web --display-name "Missionism"
firebase use missionism   # or the ID that was created
firebase apphosting:backends:create --project missionism
```

Follow prompts to link the GitHub repo and `main`.

## After first deploy

Pushes to `main` rebuild and roll out automatically.

`npm run build` is **Next only** (what App Hosting runs). Local gates: `npm run verify`.

Config in-repo: `apphosting.yaml`, `firebase.json`, `.firebaserc`.
