# SwasthyaAI

Multilingual AI health information for India — chatbot, photo analysis, symptom
checker, and public health alerts. English, Hindi, Kannada, Telugu.

One Next.js app. No accounts, no sign-up, no mobile app, no third-party services
beyond OpenAI and a Postgres database.

## Running it

```bash
npm install
cp .env.example .env.local     # fill in OPENAI_API_KEY at minimum
npm run dev
```

Open http://localhost:3000.

The chatbot, image analysis, and symptom checker work with just
`OPENAI_API_KEY`. Alerts and the admin panel additionally need a database.

### Database (optional but needed for alerts + admin)

1. Create a free Postgres database at [neon.tech](https://neon.tech).
2. Put its connection string in `DATABASE_URL`.
3. Run `schema.sql` against it — paste it into the Neon SQL editor, or:
   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```

Without `DATABASE_URL` the app degrades gracefully: reads return empty and
writes are skipped, rather than crashing.

## Deploying

Push to GitHub, import the repo on Vercel, and set `OPENAI_API_KEY`,
`DATABASE_URL`, and `ADMIN_PASSWORD` in the project's environment variables.
Nothing else to configure.

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
