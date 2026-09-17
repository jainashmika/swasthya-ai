# SwasthyaAI

Multilingual AI health information for India — chatbot, photo analysis, symptom
checker, and public health alerts. English, Hindi, Kannada, Telugu.

One Next.js app. No accounts, no sign-up, no mobile app.

## Running it

```bash
npm install
cp .env.example .env.local
npm run check:ai        # confirms your key works before you start
npm run dev
```

Open http://localhost:3000.

## The AI provider

`npm run check:ai` tells you exactly what works with your current config —
text, vision, or neither — before you start the app.

### It already works with no key

`.env.local` ships pointed at a free public gateway. Chat and the symptom
checker answer immediately, with no signup. **Photo analysis does not work
there** — that model has no vision.

It has no uptime guarantee and no stated policy on what happens to the health
questions sent through it. Treat it as a way to see the app running, not
somewhere to send anything real.

### For photo analysis, and for anything you demo: Gemini

Free, no credit card, about ninety seconds:

1. Open <https://aistudio.google.com/apikey>
2. Sign in with any Google account
3. Click **Create API key**
4. In `.env.local`, paste it and swap to the Gemini block:
   ```
   AI_API_KEY=your-key
   AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
   AI_MODEL=gemini-2.5-flash
   ```
5. `npm run check:ai` — should report text **and** vision working

Roughly 1,500 requests a day. It also follows the safety rules in the prompt
noticeably better than the free keyless model, which matters here: the weaker
model had to be argued out of naming medicines.

> On Gemini's free tier Google may use submitted inputs to improve their
> models. Fine for a demo; for real health data, use a paid tier or a provider
> that does not train on your data.

### Switching provider

Three variables, no code changes. `.env.example` has ready-made blocks for
OpenAI, Groq, and OpenRouter alongside Gemini.

| Variable | Meaning |
|---|---|
| `AI_API_KEY` | your key |
| `AI_BASE_URL` | the endpoint — leave blank for OpenAI itself |
| `AI_MODEL` | the model id |

Note that Groq's free models are text-only, so image analysis will not work there.

### Database (optional — needed for alerts + admin)

1. Create a free Postgres database at [neon.tech](https://neon.tech).
2. Put its connection string in `DATABASE_URL`.
3. Run `schema.sql` against it — paste it into the Neon SQL editor, or:
   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```

Without `DATABASE_URL` the app degrades gracefully: reads return empty and
writes are skipped, rather than crashing. The chatbot is unaffected.

## Deploying

Set these environment variables on whichever host you use. They are the same
everywhere, and none of them may be prefixed `NEXT_PUBLIC_`:

| Variable | Required | Notes |
|---|---|---|
| `AI_API_KEY` | yes | without it, chat / image / symptoms return a clear 503 |
| `AI_BASE_URL` | for anything but OpenAI | e.g. the Gemini endpoint |
| `AI_MODEL` | yes | e.g. `gemini-2.5-flash` |
| `DATABASE_URL` | no | alerts and admin stay empty without it |
| `ADMIN_PASSWORD` | yes | gate for `/admin` |

### Netlify

1. Push to GitHub.
2. In Netlify, **Add new site → Import an existing project**, pick the repo.
3. Netlify detects Next.js. Build command `npm run build`, publish `.next` —
   both are already set in `netlify.toml`, so leave the defaults.
4. **Site configuration → Environment variables** → add the table above.
5. Deploy.

`netlify.toml` pins Node 22 and the `@netlify/plugin-nextjs` adapter version, so
a change to Netlify's defaults cannot break a build that already works. To take
adapter updates instead, remove `@netlify/plugin-nextjs` from
`devDependencies` and Netlify will manage it for you.

Both AI routes stream their responses. That matters more on Netlify than it
looks: a function that buffers a slow vision call for twenty seconds before
replying can hit the synchronous function timeout, while the same call streamed
starts sending within a second and does not.

### Vercel

Import the repo and set the same environment variables. No config file needed.

## What's where

```
app/
  page.tsx            landing page with an inline chat widget
  chat/               chatbot — text and photos
  symptoms/           structured symptom checker
  alerts/             public health alerts
  admin/              password gate -> alerts CRUD + activity log
  api/
    chat/             streams the reply
    image/            photo -> analysis
    symptoms/         form -> guidance
    alerts/           GET public, writes admin-only
    admin/            login, stats, activity log
lib/
  ai.ts               prompts, safety rules, every OpenAI call
  db.ts               raw SQL
  i18n.ts             UI strings and form options in 4 languages
  admin.ts            the whole auth system
  resize-image.ts     downscales photos in the browser before upload
components/
  ChatPanel.tsx       shared by the landing page and /chat
  LangProvider.tsx    language state
  SiteHeader.tsx      nav + language switcher
schema.sql            two tables
```

## Safety

The app gives health **education**, never a diagnosis. This is enforced in code,
not just in the prompt:

- Emergency keywords in the user's message short-circuit to a call-108 response
  before the model is asked anything.
- That check runs on user input only, never on the model's own output — scanning
  the output makes an ordinary answer about heart attacks fire a false alarm.
- Every AI answer is shown with a visible medical disclaimer.
- The prompt refuses diagnosis, refuses to name medicines, and refuses
  non-health questions, identically across chat, image, and symptoms.

## Notes

- **Chat history is stored in the browser**, not on the server. Clearing site
  data clears it. The server logs only the question text, language, and safety
  flags, for the admin activity view.
- **Photos are resized to 1024px in the browser** before upload. Vercel rejects
  request bodies over 4.5 MB and phone photos exceed that.
- **Nothing is held in memory between requests** — serverless instances don't
  persist. Anything that must survive goes in Postgres.
