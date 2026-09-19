/**
 * Clerk answers in English with a stable error code. The app is Bulgarian
 * throughout, so the codes worth showing a user are translated here and
 * anything unmapped falls back to Clerk's own text rather than to a shrug.
 */
const MESSAGES = {
  form_identifier_not_found: 'Няма акаунт с този имейл.',
  form_identifier_exists: 'Вече има акаунт с този имейл — влез вместо това.',
  form_param_format_invalid: 'Имейлът изглежда невалиден.',
  form_param_nil: 'Попълни полето.',
  form_code_incorrect: 'Кодът е грешен. Провери го и опитай отново.',
  verification_expired: 'Кодът изтече. Поискай нов.',
  verification_failed: 'Твърде много опити с грешен код. Поискай нов.',
  too_many_requests: 'Твърде много опити. Изчакай малко и опитай отново.',
  session_exists: 'Вече си влязъл в друга сесия.',
  captcha_invalid: 'Проверката за бот не мина. Опитай отново.',
}

export function messageOf(cause) {
  if (cause?.name === 'SsoCancelled') return null

  const first = cause?.errors?.[0]
  if (first) {
    return (
      MESSAGES[first.code] ?? first.longMessage ?? first.message ?? 'Нещо се обърка.'
    )
  }

  return cause?.message ?? 'Нещо се обърка.'
}

export const isNotFound = (cause) =>
  cause?.errors?.some((error) => error.code === 'form_identifier_not_found') ?? false
