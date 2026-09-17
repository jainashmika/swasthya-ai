/**
 * Verifies the AI provider is reachable with the configured key.
 *
 *   npm run check:ai
 *
 * Reads .env.local directly so it works without starting the app.
 */

import { readFileSync } from 'node:fs'

function loadEnv(file = '.env.local') {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // no .env.local — fall back to real environment variables
  }
}

loadEnv()

const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY
const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const model = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'

const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

console.log()
console.log(`  endpoint  ${dim(baseUrl)}`)
console.log(`  model     ${dim(model)}`)
console.log(`  key       ${dim(key ? `${key.slice(0, 6)}…${key.slice(-4)}` : '(not set)')}`)
console.log()

// A key is only mandatory when talking to OpenAI itself. Keyless gateways,
// Ollama and LM Studio all work without one.
if (!key && !process.env.AI_BASE_URL) {
  console.log(red('  x No API key, and no AI_BASE_URL to reach a keyless endpoint.'))
  console.log()
  console.log('  Get a free key in about ninety seconds:')
  console.log('    1. Open https://aistudio.google.com/apikey')
  console.log('    2. Sign in with any Google account')
  console.log('    3. Click "Create API key"')
  console.log('    4. Paste it into .env.local after AI_API_KEY=')
  console.log()
  process.exit(1)
}

const authHeaders = key
  ? { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
  : { 'Content-Type': 'application/json' }

/**
 * Vision is the one capability that silently differs between providers, and a
 * model without it does not error — it guesses. So this asks about two solid
 * 8x8 swatches of known colour and requires BOTH answers to be right. A
 * guesser passes one about a third of the time and both rarely.
 */
const SWATCHES = [
  {
    colour: 'red',
    png: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC',
  },
  {
    colour: 'blue',
    png: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEElEQVR4nGNgYPiPAw0pCQCpcD/BFMrqcwAAAABJRU5ErkJggg==',
  },
]

async function askColour(png) {
  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      model,
      max_tokens: 12,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'One word only: what colour is this image?' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${png}` } },
          ],
        },
      ],
    }),
  })
  if (!r.ok) return null
  const b = await r.json()
  return (b?.choices?.[0]?.message?.content ?? '').toLowerCase()
}

async function probeVision() {
  try {
    for (const { colour, png } of SWATCHES) {
      const said = await askColour(png)
      if (said === null || !said.includes(colour)) return false
    }
    return true
  } catch {
    return false
  }
}

try {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      model,
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Reply with the single word: ready' }],
    }),
  })

  const body = await res.json()

  if (!res.ok) {
    console.log(red(`  ✗ ${res.status} ${res.statusText}`))
    console.log()
    console.log(dim(`  ${body?.error?.message ?? JSON.stringify(body).slice(0, 300)}`))
    console.log()
    if (res.status === 401 || res.status === 403) {
      console.log('  The key was rejected. Check it was copied in full.')
    } else if (res.status === 404) {
      console.log(`  The endpoint does not have a model called "${model}".`)
      console.log('  Check AI_MODEL matches a model your provider offers.')
    } else if (res.status === 429) {
      console.log('  Rate limited. Wait a minute and run this again.')
    }
    console.log()
    process.exit(1)
  }

  const reply = body?.choices?.[0]?.message?.content?.trim()
  console.log(green('  ✓ Text works.') + dim(`  reply: ${reply}`))

  const vision = await probeVision()
  if (vision) {
    console.log(green('  ✓ Vision works.') + dim('  photo analysis is available'))
    console.log()
    console.log('  Chat, symptom checker and photo analysis will all work.')
  } else {
    console.log(red('  x Vision not supported by this model.'))
    console.log()
    console.log('  Chat and the symptom checker work. Photo analysis will not.')
    console.log('  For photos, switch to Gemini — free, about ninety seconds:')
    console.log('    https://aistudio.google.com/apikey')
  }
  console.log()
} catch (err) {
  console.log(red('  ✗ Could not reach the provider.'))
  console.log(dim(`    ${err.message}`))
  console.log()
  console.log('  Check your internet connection and that AI_BASE_URL is correct.')
  console.log()
  process.exit(1)
}
