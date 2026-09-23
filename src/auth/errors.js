import { t } from '../lib/i18n'

/**
 * Clerk answers in English with a stable error code. The app speaks Bulgarian
 * and English through its own dictionary, so the codes worth showing a user
 * are mapped onto it and anything unmapped falls back to Clerk's own text
 * rather than to a shrug.
 */
const KEY_OF = {
  form_identifier_not_found: 'clerkIdentifierNotFound',
  form_identifier_exists: 'clerkIdentifierExists',
  form_param_format_invalid: 'clerkFormatInvalid',
  form_param_nil: 'clerkParamNil',
  form_code_incorrect: 'clerkCodeIncorrect',
  verification_expired: 'clerkVerificationExpired',
  verification_failed: 'clerkVerificationFailed',
  too_many_requests: 'clerkTooManyRequests',
  session_exists: 'clerkSessionExists',
  captcha_invalid: 'clerkCaptchaInvalid',
}

/** Returns null when there is nothing worth telling the user. */
export function messageOf(cause, locale) {
  // Dismissing the OAuth sheet is a decision, not a failure.
  if (cause?.name === 'SsoCancelled') return null

  const first = cause?.errors?.[0]
  if (first) {
    const key = KEY_OF[first.code]
    if (key) return t(locale, key)
    return first.longMessage ?? first.message ?? t(locale, 'authErrorGeneric')
  }

  // Errors this app raised itself carry a translation key rather than text.
  if (cause?.messageKey) return t(locale, cause.messageKey)

  return cause?.message ?? t(locale, 'authErrorGeneric')
}

export const isNotFound = (cause) =>
  cause?.errors?.some((error) => error.code === 'form_identifier_not_found') ?? false

/**
 * An error the app raised, carrying a dictionary key instead of a fixed
 * string — the locale is not known where these are thrown.
 */
export class AuthError extends Error {
  constructor(messageKey) {
    super(messageKey)
    this.name = 'AuthError'
    this.messageKey = messageKey
  }
}
