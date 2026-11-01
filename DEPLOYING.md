# Deploying LingHua

The site runs on two free services. Both update by themselves every time
something is merged into `master`, so nobody has to log in to a server.

| Part | Service | Set up by |
|------|---------|-----------|
| Front end (the website) | [Vercel](https://vercel.com) | `vercel.json` |
| Backend with MindSpore (speech, translation, tutor API) | [Hugging Face Spaces](https://huggingface.co/spaces) | `backend/Dockerfile`, `.github/workflows/deploy-backend.yml` |
| Accounts and database | Supabase (unchanged) | |

The backend runs on Hugging Face because MindSpore needs about 520 MB of
memory just to start. Hugging Face's free CPU Space has 16 GB.

`deploy.sh` is the old one-server setup for Huawei Cloud ECS. It still works
but is no longer needed.

## One-time setup

You can do the website on its own first. Sign-in, flashcards and dashboards
work without the backend; translation, speech and the tutor need it.

### 1. Website on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New** then **Project**, and import the repo.
3. Open **Environment Variables** and add the front-end values listed below.
   Leave `VITE_API_BASE` out until the backend exists.
4. Click **Deploy**. Copy the site address, for example
   `https://linghua-abc.vercel.app`.

### 2. Backend on Hugging Face

1. Sign up at [huggingface.co](https://huggingface.co).
2. Click your picture, then **New Space**. Name it `linghua-backend`, pick
   **Docker** then **Blank**, keep **CPU basic (free)**, and make it
   **Public** (the website has to be able to reach it). Click **Create Space**.
3. In the Space, open **Settings**, then **Variables and secrets**. Add each
   backend value listed below with **New secret**. Set `CORS_ORIGINS` to the
   Vercel address from step 1.4. Keys you don't have yet can be added later.
4. Click your picture, then **Settings**, then **Access Tokens**. Create a
   token with the **Write** role and copy it.
5. On GitHub, open the repo, then **Settings**, then
   **Secrets and variables**, then **Actions**.
   - Under **Secrets**, add `HF_TOKEN` with the token from step 4.
   - Under **Variables**, add `HF_SPACE` with your Space name, for example
     `your-name/linghua-backend`.
6. Open the **Actions** tab. On a fork, click the button to enable workflows.
   Pick **Deploy backend**, then **Run workflow**. The first build takes about
   10 minutes; you can watch it under **Logs** in the Space.
7. The backend address is `https://your-name-linghua-backend.hf.space`.
   Open it with `/health` on the end; it should say `"status": "ok"`.

### 3. Connect the two

1. In Vercel, open the project, then **Settings**, then **Environment
   Variables**, and add `VITE_API_BASE` with the backend address (no slash at
   the end). Then go to **Deployments** and click **Redeploy** on the latest
   one.
2. In Supabase, open **Authentication** then **URL Configuration**. Set
   **Site URL** to the Vercel address and add it under **Redirect URLs** too,
   so sign-up and password emails link to the new site.

## Environment variables

### Front end (Vercel)

| Name | What it is | Where to find it |
|------|------------|------------------|
| `VITE_SUPABASE_URL` | Supabase project address | Supabase > Project Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase public (anon) key | Supabase > Project Settings > API |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project id | Supabase > Project Settings > General |
| `VITE_API_BASE` | The backend address | Hugging Face Space |

These end up in the website itself, so they must never be secret keys.

### Backend (Hugging Face Space secrets)

| Name | What it is |
|------|------------|
| `CORS_ORIGINS` | Website address(es) allowed to use the backend, comma-separated |
| `HUAWEI_AK`, `HUAWEI_SK` | Huawei Cloud access key and secret key (IAM) |
| `HUAWEI_SIS_REGION`, `HUAWEI_SIS_PROJECT_ID` | Region and project id for speech (SIS) |
| `HUAWEI_NLP_REGION`, `HUAWEI_NLP_PROJECT_ID` | Region and project id for translation (NLP) |
| `MUNSIT_API_KEY` | Munsit Arabic speech |
| `ANTHROPIC_API_KEY` | AI tutor |
| `OPENAI_API_KEY` | Voice conversation and Whisper |
| `ELEVENLABS_API_KEY` | AI voice |

The current values are in `/etc/linghua/backend.env` on the old Huawei
server. Never commit any of these to the repo.

## Good to know

- **Sleep.** A free Space goes to sleep after 48 hours with no visitors. The
  next visit wakes it, which takes a minute or two.
- **Updates.** The backend redeploys only when files in `backend/` change.
  To force it, run **Deploy backend** from the Actions tab.
- **Forks.** A fork doesn't follow the main repo by itself. Click **Sync fork**
  on GitHub to pull in new changes; Vercel and the backend then update.
- **Preview links.** Vercel also builds every pull request. Add a preview's
  address to `CORS_ORIGINS` if you want speech features to work there.
