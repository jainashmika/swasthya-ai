import OpenAI from 'openai'

/**
 * Every OpenAI call in the app goes through this file, so the safety rules
 * apply to chat, image analysis, and the symptom checker identically.
 */

export type Lang = 'en' | 'hi' | 'kn' | 'te'

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' },
]

const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada',
  te: 'Telugu',
}

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && ['en', 'hi', 'kn', 'te'].includes(v)
}

/**
 * Provider configuration.
 *
 * The app talks to any OpenAI-compatible chat-completions endpoint, so it runs
 * on OpenAI, Google Gemini, Groq or OpenRouter with no code change — only
 * these three environment variables differ. See .env.example for presets.
 *
 *   AI_API_KEY   the key
 *   AI_BASE_URL  the endpoint (omit for OpenAI itself)
 *   AI_MODEL     the model id
 */
const API_KEY =
  process.env.AI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  ''

const BASE_URL = process.env.AI_BASE_URL || undefined

const MODEL = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'

/** Which provider the current config points at — used only for error messages. */
export function providerName() {
  if (!BASE_URL) return 'OpenAI'
  if (BASE_URL.includes('generativelanguage.googleapis.com')) return 'Google Gemini'
  if (BASE_URL.includes('groq.com')) return 'Groq'
  if (BASE_URL.includes('openrouter.ai')) return 'OpenRouter'
  return 'the configured AI provider'
}

let client: OpenAI | null = null
function openai() {
  if (!client) {
    if (!API_KEY) throw new Error('AI_API_KEY is not set')
    client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL })
  }
  return client
}

/** Turns a thrown provider/config error into something worth showing a user. */
export function aiError(err: unknown) {
  const message = (err as Error)?.message ?? ''

  if (message.includes('AI_API_KEY')) {
    return {
      status: 503,
      error:
        'No AI API key is configured on the server. Set AI_API_KEY in .env.local — see .env.example for a free option.',
    }
  }
  if (message.includes('401') || message.toLowerCase().includes('api key')) {
    return {
      status: 503,
      error: `${providerName()} rejected the API key. Check AI_API_KEY is correct and still active.`,
    }
  }
  if (message.includes('429') || message.toLowerCase().includes('quota')) {
    return {
      status: 429,
      error: `${providerName()} is rate limiting this key. Wait a moment and try again.`,
    }
  }
  if (message.includes('404') || message.includes('model')) {
    return {
      status: 503,
      error: `${providerName()} does not recognise the model "${MODEL}". Check AI_MODEL.`,
    }
  }
  return { status: 503, error: 'The AI service is unavailable. Please try again.' }
}

// ─── Safety ─────────────────────────────────────────────────────────────────

/**
 * Checked against the USER'S INPUT ONLY — never against the model's own
 * output. Scanning the output makes an educational answer about heart attacks
 * trigger a false emergency.
 */
const EMERGENCY_KEYWORDS = [
  'chest pain', 'difficulty breathing', 'cannot breathe', "can't breathe",
  'breathless', 'unconscious', 'not breathing', 'severe bleeding',
  'heavy bleeding', 'heart attack', 'stroke', 'paralysis', 'seizure',
  'convulsion', 'choking', 'poisoning', 'overdose', 'suicidal', 'kill myself',
  // Hindi / transliterated
  'saans nahi', 'sans nahi', 'seene mein dard', 'behosh', 'dil ka daura',
  'छाती में दर्द', 'सांस नहीं', 'बेहोश', 'दौरा',
  // Kannada
  'ಎದೆ ನೋವು', 'ಉಸಿರಾಟ',
  // Telugu
  'ఛాతీ నొప్పి', 'ఊపిరి',
]

export function checkEmergency(input: string): boolean {
  const lower = input.toLowerCase()
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))
}

export const EMERGENCY_RESPONSE: Record<Lang, string> = {
  en: 'This may be a medical emergency. Call 108 for an ambulance or go to the nearest hospital right now. Do not wait.',
  hi: 'यह एक आपातकालीन स्थिति हो सकती है। तुरंत 108 पर कॉल करें या नजदीकी अस्पताल जाएं। इंतज़ार न करें।',
  kn: 'ಇದು ವೈದ್ಯಕೀಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಾಗಿರಬಹುದು. ಈಗಲೇ 108 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗಿ. ಕಾಯಬೇಡಿ.',
  te: 'ఇది వైద్య అత్యవసర పరిస్థితి కావచ్చు. వెంటనే 108కి కాల్ చేయండి లేదా సమీప ఆసుపత్రికి వెళ్లండి. ఆలస్యం చేయవద్దు.',
}

export const DISCLAIMER: Record<Lang, string> = {
  en: 'Health education only — not a substitute for a doctor. Consult a qualified healthcare provider about your own health.',
  hi: 'यह केवल स्वास्थ्य शिक्षा है — डॉक्टर का विकल्प नहीं। अपने स्वास्थ्य के बारे में योग्य डॉक्टर से सलाह लें।',
  kn: 'ಇದು ಆರೋಗ್ಯ ಶಿಕ್ಷಣ ಮಾತ್ರ — ವೈದ್ಯರಿಗೆ ಪರ್ಯಾಯವಲ್ಲ. ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  te: 'ఇది ఆరోగ్య విద్య మాత్రమే — వైద్యుడికి ప్రత్యామ్నాయం కాదు. మీ ఆరోగ్యం గురించి అర్హత గల వైద్యుడిని సంప్రదించండి.',
}

// ─── Prompts ────────────────────────────────────────────────────────────────

const RULES = `You are SwasthyaAI, a health education assistant for people in India.

ANSWER WHAT THIS PERSON ACTUALLY ASKED.
- Respond to their specific question or situation. Never give a generic answer
  that would fit any health question equally well.
- Use the details they gave you — the symptoms, how long, the age, what they
  are worried about — and refer to those details directly in your answer.
- When someone describes symptoms, name the two to four most common causes of
  that particular combination, most likely first, and say briefly what makes
  each one more or less likely given what they told you.
- Never pad an answer with filler like "there can be many causes" or "it is
  important to consult a doctor" in place of real content. Say what the likely
  causes actually are, then say to see a doctor.
- If one missing detail would change your answer a lot — how long it has gone
  on, the person's age, whether they have a fever — answer with what you can,
  then ask one short question for that detail. Ask one, never a list.

WHERE THE LINE IS.
- Naming likely causes is health education and you should do it.
- Declaring which one this person has is a diagnosis and you must not do it.
  Say "this is most often caused by", never "you have".
- Never name, recommend or prescribe a specific medicine, brand or dose.
- If they ask you to diagnose them, give the likely causes, then explain plainly
  that only a doctor examining them can say which it is.
- Refuse anything that is not about health, briefly and politely.

HOW TO WRITE IT.
- Plain words and short sentences. Assume limited formal schooling.
- No markdown. No asterisks, no hash signs, no bold. Plain lines only.
  You may begin a line with "-" to list things.
- Leave a blank line between parts so it is easy to read on a phone.
- Under 200 words.
- Whenever symptoms are described, end by telling them to get checked at a
  doctor or the nearest PHC.`

/**
 * Shape for a question where the person is describing their own situation.
 * Kept separate from RULES so the chat and the symptom checker stay consistent.
 */
const ANSWER_SHAPE = `Structure the answer in this order, with a blank line
between each part and no headings:

1. One sentence that answers directly what they asked.
2. The most likely explanations, most likely first, with a few words on what
   makes each more or less likely for them specifically.
3. What they can safely do now.
4. The signs that mean see a doctor soon, and the signs that mean go now.

If they asked a general question rather than describing symptoms, drop parts 2
and 4 and simply answer the question well and specifically.`

function systemPrompt(lang: Lang) {
  return `${RULES}

${ANSWER_SHAPE}

Respond only in ${LANG_NAMES[lang]}, regardless of what language previous messages used.`
}

/**
 * Indic scripts tokenize far less efficiently than Latin — the same 200 words
 * can cost several times as many tokens. A flat cap truncated Kannada and
 * Telugu answers mid-sentence, so the budget scales with the script.
 */
function maxTokens(lang: Lang) {
  return lang === 'en' ? 800 : 1600
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** Returns a plain-text stream of the reply. */
export async function streamChat(history: ChatMessage[], lang: Lang) {
  const stream = await openai().chat.completions.create({
    model: MODEL,
    stream: true,
    temperature: 0.4,
    max_tokens: maxTokens(lang),
    messages: [
      { role: 'system', content: systemPrompt(lang) },
      ...history.slice(-8),
    ],
  })

  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content
          if (token) controller.enqueue(encoder.encode(token))
        }
      } catch (err) {
        console.error('[ai] stream failed:', (err as Error).message)
        controller.enqueue(encoder.encode('\n\nSorry, the connection dropped. Please try again.'))
      } finally {
        controller.close()
      }
    },
  })
}

// ─── Image analysis ─────────────────────────────────────────────────────────

export async function analyzeImage(dataUrl: string, description: string, lang: Lang) {
  const res = await openai().chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: maxTokens(lang),
    messages: [
      {
        role: 'system',
        content: `${systemPrompt(lang)}

This person has sent a photo about their health, along with whatever they wrote about it.

Say plainly what you can actually see in the image. Then give the most likely explanations for that specific appearance, most likely first, and what would tell them apart. Then say what would make this worth seeing a doctor about soon.

Do not state which condition this person has. If the photo is too blurry, too dark or too far away to judge, say exactly that and ask for a clearer one rather than guessing.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: description
              ? `Here is my photo. ${description}`
              : 'Here is my photo. What can you tell me about it?',
          },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
        ],
      },
    ],
  })
  return res.choices[0]?.message?.content ?? ''
}

// ─── Symptom checker ────────────────────────────────────────────────────────

export type SymptomInput = {
  symptoms: string[]
  details: string
  duration: string
  ageBand: string
}

export async function checkSymptoms(input: SymptomInput, lang: Lang) {
  const summary = [
    `Symptoms: ${input.symptoms.join(', ') || 'not specified'}`,
    input.details ? `In their words: ${input.details}` : '',
    `Duration: ${input.duration}`,
    `Age group: ${input.ageBand}`,
  ]
    .filter(Boolean)
    .join('\n')

  const res = await openai().chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: maxTokens(lang),
    messages: [
      {
        role: 'system',
        content: `${systemPrompt(lang)}

This person filled in the symptom form, so you know their symptoms, how long they have had them, and their age group. Use all three.

Name the most likely causes of this specific combination, at this duration, for this age group, most likely first. For each, say in a few words why it fits or does not fit what they reported. Duration and age genuinely change which causes are likely, so let them change your answer rather than giving the same list every time.

Then what they can safely do now, then the signs that mean see a doctor soon and the signs that mean go now.

Do not tell them which one they have. Do not name any medicine.`,
      },
      { role: 'user', content: summary },
    ],
  })
  return res.choices[0]?.message?.content ?? ''
}
