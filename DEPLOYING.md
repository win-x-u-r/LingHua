# Deploying LingHua

LingHua runs on a Huawei Cloud ECS server: nginx serves the website and
proxies `/api/` to the Flask backend (with MindSpore). The server was set up
once with `deploy.sh`.

Every merge into `master` now goes live by itself: the **Deploy to Huawei
Cloud** GitHub workflow logs in to the server over SSH and runs `update.sh`,
which pulls the code, updates packages, rebuilds the website and restarts the
backend. It doesn't touch nginx, SSL or the firewall.

## One-time setup (someone with server access)

1. **Make a deploy key.** On your own computer:
   ```
   ssh-keygen -t ed25519 -f linghua-deploy -N ""
   ```
   This makes `linghua-deploy` (private) and `linghua-deploy.pub` (public).
2. **Allow it on the server.** Log in to the server once and add the contents
   of `linghua-deploy.pub` as a new line in `~/.ssh/authorized_keys` for the
   deploy user. That user needs `sudo` without a password (root works).
3. **Add it to GitHub.** In `win-x-u-r/LingHua`, open **Settings**, then
   **Secrets and variables**, then **Actions**.
   - **Secrets** tab:
     - `DEPLOY_HOST`: the server's public IP
     - `DEPLOY_USER`: the user from step 2, for example `root`
     - `DEPLOY_SSH_KEY`: the whole contents of the private `linghua-deploy` file
   - **Variables** tab:
     - `DEPLOY_DOMAIN`: the site's domain, for example `linghua.example.com`
     - `DEPLOY_DIR`: the folder `deploy.sh` installed into, for example `/opt/linghua`
4. **Try it.** Open the **Actions** tab, pick **Deploy to Huawei Cloud**, and
   click **Run workflow**. It takes a few minutes. The last step checks
   `https://<domain>/api/health`.

Delete the private key from your computer once it's in GitHub.

## Keys and settings on the server

| File | What it holds |
|------|---------------|
| `/etc/linghua/backend.env` | Backend keys (Huawei, Munsit, Anthropic, OpenAI, ElevenLabs). Copied into `backend/.env` on each deploy. |
| `<install dir>/.env` | Website settings: the three `VITE_SUPABASE_*` values. `VITE_API_BASE` is set automatically. |

To let another website (for example a Vercel copy) use the backend, add
`EXTRA_CORS_ORIGINS=https://that-site.vercel.app` to
`/etc/linghua/backend.env`. It takes effect on the next deploy.

Never commit any keys to the repo.

## Optional: a Vercel copy of the website

`vercel.json` lets anyone put the website on Vercel too (useful for quick
previews). Import the repo or a fork into Vercel and add the three
`VITE_SUPABASE_*` values, plus `VITE_API_BASE=https://<domain>/api` for the
speech features. The Huawei-hosted site is the main one, and it also works
inside mainland China.

## Other hosts

`backend/Dockerfile` builds the backend with MindSpore in a container, if it
ever needs to move to a container service. MindSpore needs about 550 MB of
memory, so pick a plan with at least 1 GB.
