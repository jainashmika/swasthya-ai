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

if (!key) {
  console.log(red('  ✗ No API key found.'))
  console.log()
  console.log('  Get a free one in about two minutes:')
  console.log('    1. Open https://aistudio.google.com/apikey')
  console.log('    2. Sign in with any Google account')
  console.log('    3. Click "Create API key"')
  console.log('    4. Paste it into .env.local after AI_API_KEY=')
  console.log()
  process.exit(1)
}

try {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
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
  console.log(green('  ✓ Provider responded.'))
  console.log(dim(`    reply: ${reply}`))
  console.log()
  console.log('  The chatbot, image analysis and symptom checker will all work.')
  console.log()
} catch (err) {
  console.log(red('  ✗ Could not reach the provider.'))
  console.log(dim(`    ${err.message}`))
  console.log()
  console.log('  Check your internet connection and that AI_BASE_URL is correct.')
  console.log()
  process.exit(1)
}
