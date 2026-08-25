import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * The entire auth system: one password in an env var.
 *
 * The cookie holds a token derived from the password, not the password
 * itself, so a leaked cookie can't be read back into the plaintext.
 */

const COOKIE = 'swasthya_admin'

function token() {
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD is not set')
  return createHmac('sha256', password).update('swasthya-admin-v1').digest('hex')
}

function matches(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

export function checkPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return false
  return matches(input, password)
}

export async function signIn() {
  const jar = await cookies()
  jar.set(COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export async function signOut() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

/** Call at the top of every admin handler — reads included, not just writes. */
export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false
  const jar = await cookies()
  const value = jar.get(COOKIE)?.value
  return Boolean(value && matches(value, token()))
}

export function denied() {
  return Response.json({ error: 'Not authorised' }, { status: 401 })
}
