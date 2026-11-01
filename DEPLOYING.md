# Deploying LingHua

The site runs on two free services. Both redeploy by themselves every time
something is merged into `master`, so nobody has to log in to a server.

| Part | Service | Set up by |
|------|---------|-----------|
| Front end (the website) | [Vercel](https://vercel.com) | `vercel.json` |
| Backend (speech, translation, tutor API) | [Render](https://render.com) | `render.yaml` |
| Accounts and database | Supabase (unchanged) | |

`deploy.sh` is the old one-server setup for Huawei Cloud ECS. It still works
but is no longer needed.

## One-time setup

Do these in order. The whole thing takes about 20 minutes.

### 1. Backend on Render

1. Go to [render.com](https://render.com) and sign up with GitHub.
2. Click **New** then **Blueprint**, and pick the `linghua` repo.
   If the repo is not listed, click the link to give Render access. The repo
   belongs to `win-x-u-r`, so that account may need to approve it once.
3. Render reads `render.yaml` and asks for the secret values listed below.
   Paste each one. Leave `CORS_ORIGINS` empty for now.
4. Click **Apply**. The first build takes a few minutes.
5. When it says **Live**, copy the address at the top of the page, for
   example `https://linghua-backend.onrender.com`. Open that address with
   `/health` on the end; it should say `"status": "ok"`.

### 2. Front end on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New** then **Project**, and import the `linghua` repo
   (same access note as above).
3. Before clicking Deploy, open **Environment Variables** and add the four
   front-end values listed below. For `VITE_API_BASE`, paste the Render
   address from step 1.5 (no slash at the end).
4. Click **Deploy**. When it finishes, copy the site address, for example
   `https://linghua-abc.vercel.app`.

### 3. Connect the two

1. In Render, open `linghua-backend`, then **Environment**, and set
   `CORS_ORIGINS` to the Vercel address from step 2.4. Save; Render restarts
   the backend.
2. In Supabase, open **Authentication** then **URL Configuration**. Set
   **Site URL** to the Vercel address and add it under **Redirect URLs** too,
   so sign-up and password emails link to the new site.

Open the Vercel address and try signing in, translating, and a pronunciation
practice to check everything works.

## Environment variables

### Front end (Vercel)

| Name | What it is | Where to find it |
|------|------------|------------------|
| `VITE_SUPABASE_URL` | Supabase project address | Supabase > Project Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase public (anon) key | Supabase > Project Settings > API |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project id | Supabase > Project Settings > General |
| `VITE_API_BASE` | The Render backend address | Render dashboard |

These end up in the website itself, so they must never be secret keys.

### Backend (Render)

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

- **Free plan sleep.** Render's free backend goes to sleep after 15 minutes
  with no visitors. The next request wakes it, which takes up to a minute.
  The paid Starter plan stays awake.
- **MindSpore.** The hosted backend installs `backend/requirements-cloud.txt`,
  which leaves out MindSpore because it needs more memory than the free plan
  has. Pronunciation scoring uses the built-in NumPy fallback and gives the
  same kind of score. To use MindSpore, switch `render.yaml` to
  `requirements.txt` and a plan with 2 GB of memory.
- **Preview links.** Vercel also builds every pull request and posts a
  preview link on it. Previews use the same backend, so add a preview's
  address to `CORS_ORIGINS` if you want speech features to work there.
