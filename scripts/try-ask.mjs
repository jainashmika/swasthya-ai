/**
 * Sends real questions through the running app and prints the answers, so you
 * can judge whether responses are specific to the question or generic filler.
 *
 *   npm run dev          # in one terminal
 *   npm run try:ask      # in another
 *   npm run try:ask -- "my own question here"
 *   npm run try:ask -- --lang hi
 *
 * It calls the actual /api/chat route, so what you see is what a user sees.
 */

const args = process.argv.slice(2)
const langFlag = args.indexOf('--lang')
const lang = langFlag !== -1 ? args[langFlag + 1] : 'en'
const custom = args.filter((a, i) => !a.startsWith('--') && i !== langFlag + 1)

const BASE = process.env.APP_URL || 'http://localhost:3000'

/** Three shapes of input: a personal description, a general question, an emergency. */
const DEFAULTS = [
  'I have had a fever for 3 days and a headache, and my body aches. I am 34.',
  'How can I stop mosquitoes breeding around my house?',
  'my father is having chest pain and cannot breathe properly',
]

const questions = custom.length ? custom : DEFAULTS

const dim = (s) => `\x1b[2m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`

console.log()
console.log(dim(`  ${BASE}/api/chat   language: ${lang}`))

for (const q of questions) {
  console.log()
  console.log(bold(`  ? ${q}`))
  console.log()

  let res
  try {
    res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: q }], language: lang }),
    })
  } catch (err) {
    console.log(red(`  ✗ Could not reach ${BASE}. Is "npm run dev" running?`))
    console.log(dim(`    ${err.message}`))
    process.exit(1)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.log(red(`  ✗ ${res.status}  ${body.error ?? '(no message)'}`))
    continue
  }

  if (res.headers.get('X-Emergency') === '1') {
    console.log(red('  [emergency intercepted — no model call]'))
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  process.stdout.write('  ')
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    full += chunk
    process.stdout.write(chunk.replace(/\n/g, '\n  '))
  }
  console.log()
  console.log()
  console.log(dim(`  ${full.trim().split(/\s+/).length} words`))
  console.log(dim('  ' + '─'.repeat(60)))
}

console.log()
console.log(dim('  Judge it on: does the answer use the details in the question,'))
console.log(dim('  and does it name likely causes rather than "see a doctor"?'))
console.log()
