/**
 * Minimal dictionary-based i18n — no library, because the app has no routing
 * and no plural/gender complexity beyond what a couple of inline ternaries
 * already handle. A full i18n framework would be solving a problem this app
 * does not have.
 *
 * Every key must exist in both locales; DEFAULT_LOCALE backs a key missing
 * from the active one rather than rendering nothing.
 */

export const LOCALES = ['bg', 'en']
export const DEFAULT_LOCALE = 'bg'

// Maps our two UI locales to a concrete Intl tag for number/date formatting.
// Kept separate from the dictionary below: this table has two entries and
// will not grow the way the string dictionary does.
export const INTL_LOCALE = { bg: 'bg-BG', en: 'en-US' }

const STRINGS = {
  bg: {
    eyebrow: 'Калкулатор за индексен фонд',
    titleAccent: 'Лихва върху лихва',
    lede: 'Историческа средна доходност ~10.5% / година (номинална)',

    statFinalValue: 'Крайна стойност',
    statTotalInvested: 'Общо вложено',
    statGains: 'Печалба',

    controlYears: 'Години',
    controlYearsValue: '{n} г.',
    controlYearsAriaValue: '{n} години',
    controlRate: 'Годишна доходност',
    controlRateHint: 'S&P ср. ~10.5%',
    controlRateAriaValue: '{n} процента годишно',

    fieldMonthly: 'Месечно (€)',
    fieldInitial: 'Начална сума (€)',
    amountDecreaseAriaLabel: '{label}: намали с {step}',
    amountIncreaseAriaLabel: '{label}: увеличи с {step}',

    save: 'Запази',
    saved: '✓ Запазено',
    saveHint: 'Линкът е копиран — отвори го от всеки браузър',
    reset: 'Нулирай',
    resetAriaLabel: 'Върни стойностите по подразбиране',

    // --- Акаунт и синхронизация ---
    authSignIn: 'Вход',
    authAccount: 'Акаунт',
    authClose: 'Затвори',
    authLede:
      'Влез, за да пазиш настройките си и да ги намериш на всяко устройство. ' +
      'Калкулаторът работи и без акаунт.',
    authWithApple: 'Продължи с Apple',
    authWithGoogle: 'Продължи с Google',
    authOpening: 'Отваряне…',
    authOrEmail: 'или с имейл',
    authEmail: 'Имейл',
    authEmailPlaceholder: 'ime@primer.bg',
    authSendCode: 'Изпрати код',
    authSending: 'Изпращане…',
    authCodeSentTo: 'Изпратихме шестцифрен код на {email}.',
    authCode: 'Код',
    authVerify: 'Потвърди',
    authVerifying: 'Проверка…',
    authOtherEmail: '← Друг имейл',
    authSignOut: 'Изход',
    authSigningOut: 'Излизане…',
    authNoEmail: 'Без имейл',
    authDelete: 'Изтрий акаунта',
    authDeleting: 'Изтриване…',
    authDeleteWarning:
      'Това изтрива акаунта и запазените настройки завинаги. Действието е необратимо.',
    authDeleteConfirm: 'Да, изтрий акаунта',
    authCancel: 'Отказ',

    syncIdle: 'Настройките се пазят при натискане на „Запази“.',
    syncPulling: 'Изтегляне на запазените настройки…',
    syncPushing: 'Запазване в облака…',
    syncSynced: 'Настройките са синхронизирани.',
    syncError: 'Синхронизацията не успя.',
    saveHintAccount: 'Запазено в акаунта ти',

    authErrorGeneric: 'Нещо се обърка.',
    authErrorNoEmail: 'Въведи имейл адрес.',
    authErrorNoCodeFactor: 'Този акаунт не поддържа вход с код по имейл.',
    authErrorIncomplete: 'Входът не завърши. Опитай отново.',
    authErrorProviderSteps:
      'Доставчикът поиска още стъпки, които приложението не поддържа.',
    authErrorCancelled: 'Входът беше прекратен.',
    authErrorTimeout: 'Изтече времето за вход.',
    authErrorNoRedirect: 'Clerk не върна адрес за вход.',
    authErrorExpiredSession: 'Сесията изтече — влез отново.',
    clerkIdentifierNotFound: 'Няма акаунт с този имейл.',
    clerkIdentifierExists: 'Вече има акаунт с този имейл — влез вместо това.',
    clerkFormatInvalid: 'Имейлът изглежда невалиден.',
    clerkParamNil: 'Попълни полето.',
    clerkCodeIncorrect: 'Кодът е грешен. Провери го и опитай отново.',
    clerkVerificationExpired: 'Кодът изтече. Поискай нов.',
    clerkVerificationFailed: 'Твърде много опити с грешен код. Поискай нов.',
    clerkTooManyRequests: 'Твърде много опити. Изчакай малко и опитай отново.',
    clerkSessionExists: 'Вече си влязъл в друга сесия.',
    clerkCaptchaInvalid: 'Проверката за бот не мина. Опитай отново.',

    projectionAriaLabel: 'Прогноза по години',
    legendPortfolio: 'Портфолио',
    legendInvested: 'Вложено',
    tooltipYear: 'Година {n}',

    incomeAriaLabel: 'Средна месечна печалба',
    incomeLabel: 'Средна месечна печалба',
    incomeForYear: 'за година {n}',
    incomeForYearZero: '0 (начален момент)',
    controlYear: 'Година',
    controlYearAriaValue: 'година {year} от {years}',

    disclaimer:
      'Миналите резултати не гарантират бъдещи. Историческа номинална ' +
      'доходност на S&P 500 ~10.5%/год. Реална (след инфлация) ~7%.',
    footerPrivacy: 'Поверителност',
    footerSupport: 'Поддръжка',

    quoteAriaLabel: 'Цена на SXR8',
    quoteStale: 'Няма връзка · последна известна цена {time}',
    quoteLoading: 'Зареждане…',
    quoteError: 'Грешка при зареждане на данните',
    quoteRetry: 'Опитай отново',
    quoteNoData: 'Няма налични данни',
    quoteRangeGroupAriaLabel: 'Времеви обхват',

    range1dLong: 'Последен ден',
    range5dLong: 'Последна седмица',
    range1moLong: 'Последен месец',
    range6moLong: 'Последни 6 месеца',
    range1yLong: 'Последна година',
    range5yLong: 'Последни 5 години',
    rangeMaxLong: 'От началото',

    themeToLight: 'Включи светла тема',
    themeToDark: 'Включи тъмна тема',
    themeLightTitle: 'Светла тема',
    themeDarkTitle: 'Тъмна тема',
    localeToggleAriaLabel: 'Смени езика на English',
    localeToggleTitle: 'English',

    relativeNow: 'току-що',
    relativeMinutes: 'преди {n} мин',
    relativeHours: 'преди {n} ч',
    relativeDaysOne: 'преди {n} ден',
    relativeDaysMany: 'преди {n} дни',
    axisThousand: 'к',

    controlGrowth: 'Годишен ръст на вноската',
    controlGrowthHint: '0 € = постоянна вноска',
    controlGrowthAriaValue: '{n} евро на година',

    goalAriaLabel: 'Кога ще стигна тази сума?',
    goalHeading: 'Кога ще стигна тази сума?',
    goalFieldLabel: 'Целева сума (€)',
    goalAlready: 'Вече имаш повече от {amount}',
    goalReached: 'ще стигнеш {amount}',
    goalDuration: '{years} г. {months} мес.',
    goalDurationYearsOnly: '{years} г.',
    goalUnreachable:
      'Няма да стигнеш {amount} в рамките на 100 години при тези настройки — ' +
      'увеличи вноската, началната сума или доходността.',

    shareButton: 'Сподели резултат',
    shareCardCaption: 'Изчислено с калкулатор за индексен фонд S&P 500',
    shareCardHorizon: '{years} г. · {rate}% годишно',
    shareFailed: 'Споделянето не бе успешно — картинката е изтеглена вместо това.',

    priceAlertCta: 'Известие при цена',
    priceAlertFieldLabel: 'Известие при цена (€)',
    priceAlertConfirm: 'Постави',
    priceAlertCancel: 'Отказ',
    priceAlertArmedAbove: 'Известие при ≥ {price}',
    priceAlertArmedBelow: 'Известие при ≤ {price}',
    priceAlertRemoveAriaLabel: 'Премахни известието за цена',
    priceAlertTriggeredTitle: 'SXR8 достигна целта',
    priceAlertTriggeredBody: 'Цената достигна {price}',
    priceAlertTriggeredBanner: 'Известие: цената достигна {price}',
    priceAlertDismiss: 'Скрий',
  },
  en: {
    eyebrow: 'Index fund calculator',
    titleAccent: 'Compound Interest',
    lede: '~10.5% average historical annual return (nominal)',

    statFinalValue: 'Final value',
    statTotalInvested: 'Total invested',
    statGains: 'Gains',

    controlYears: 'Years',
    controlYearsValue: '{n} yr',
    controlYearsAriaValue: '{n} years',
    controlRate: 'Annual return',
    controlRateHint: 'S&P avg ~10.5%',
    controlRateAriaValue: '{n} percent annually',

    fieldMonthly: 'Monthly (€)',
    fieldInitial: 'Initial amount (€)',
    amountDecreaseAriaLabel: '{label}: decrease by {step}',
    amountIncreaseAriaLabel: '{label}: increase by {step}',

    save: 'Save',
    saved: '✓ Saved',
    saveHint: 'Link copied — open it in any browser',
    reset: 'Reset',
    resetAriaLabel: 'Restore default values',

    // --- Account and sync ---
    authSignIn: 'Sign in',
    authAccount: 'Account',
    authClose: 'Close',
    authLede:
      'Sign in to keep your settings and find them on any device. ' +
      'The calculator works without an account too.',
    authWithApple: 'Continue with Apple',
    authWithGoogle: 'Continue with Google',
    authOpening: 'Opening…',
    authOrEmail: 'or with email',
    authEmail: 'Email',
    authEmailPlaceholder: 'name@example.com',
    authSendCode: 'Send code',
    authSending: 'Sending…',
    authCodeSentTo: 'We sent a six-digit code to {email}.',
    authCode: 'Code',
    authVerify: 'Confirm',
    authVerifying: 'Checking…',
    authOtherEmail: '← Different email',
    authSignOut: 'Sign out',
    authSigningOut: 'Signing out…',
    authNoEmail: 'No email',
    authDelete: 'Delete account',
    authDeleting: 'Deleting…',
    authDeleteWarning:
      'This deletes the account and the saved settings for good. It cannot be undone.',
    authDeleteConfirm: 'Yes, delete the account',
    authCancel: 'Cancel',

    syncIdle: 'Settings are stored when you press Save.',
    syncPulling: 'Fetching your saved settings…',
    syncPushing: 'Saving to your account…',
    syncSynced: 'Settings are in sync.',
    syncError: 'Sync failed.',
    saveHintAccount: 'Saved to your account',

    authErrorGeneric: 'Something went wrong.',
    authErrorNoEmail: 'Enter an email address.',
    authErrorNoCodeFactor: 'This account does not support signing in with an email code.',
    authErrorIncomplete: 'Sign-in did not complete. Try again.',
    authErrorProviderSteps: 'The provider asked for steps this app does not support.',
    authErrorCancelled: 'Sign-in was cancelled.',
    authErrorTimeout: 'Sign-in timed out.',
    authErrorNoRedirect: 'Clerk did not return a sign-in address.',
    authErrorExpiredSession: 'Your session expired — sign in again.',
    clerkIdentifierNotFound: 'No account with that email.',
    clerkIdentifierExists: 'An account with that email already exists — sign in instead.',
    clerkFormatInvalid: 'That email looks invalid.',
    clerkParamNil: 'Fill in the field.',
    clerkCodeIncorrect: 'Wrong code. Check it and try again.',
    clerkVerificationExpired: 'The code expired. Request a new one.',
    clerkVerificationFailed: 'Too many wrong attempts. Request a new code.',
    clerkTooManyRequests: 'Too many attempts. Wait a moment and try again.',
    clerkSessionExists: 'You are already signed in elsewhere.',
    clerkCaptchaInvalid: 'The bot check did not pass. Try again.',

    projectionAriaLabel: 'Year-by-year projection',
    legendPortfolio: 'Portfolio',
    legendInvested: 'Invested',
    tooltipYear: 'Year {n}',

    incomeAriaLabel: 'Average monthly profit',
    incomeLabel: 'Average monthly profit',
    incomeForYear: 'for year {n}',
    incomeForYearZero: '0 (starting point)',
    controlYear: 'Year',
    controlYearAriaValue: 'year {year} of {years}',

    disclaimer:
      'Past results do not guarantee future ones. Historical nominal S&P ' +
      '500 return ~10.5%/yr. Real (after inflation) ~7%.',
    footerPrivacy: 'Privacy',
    footerSupport: 'Support',

    quoteAriaLabel: 'SXR8 price',
    quoteStale: 'No connection · last known price {time}',
    quoteLoading: 'Loading…',
    quoteError: 'Failed to load data',
    quoteRetry: 'Try again',
    quoteNoData: 'No data available',
    quoteRangeGroupAriaLabel: 'Time range',

    range1dLong: 'Last day',
    range5dLong: 'Last week',
    range1moLong: 'Last month',
    range6moLong: 'Last 6 months',
    range1yLong: 'Last year',
    range5yLong: 'Last 5 years',
    rangeMaxLong: 'Since inception',

    themeToLight: 'Switch to light theme',
    themeToDark: 'Switch to dark theme',
    themeLightTitle: 'Light theme',
    themeDarkTitle: 'Dark theme',
    localeToggleAriaLabel: 'Switch language to Bulgarian',
    localeToggleTitle: 'БГ',

    relativeNow: 'just now',
    relativeMinutes: '{n} min ago',
    relativeHours: '{n} hr ago',
    relativeDaysOne: '{n} day ago',
    relativeDaysMany: '{n} days ago',
    axisThousand: 'k',

    controlGrowth: 'Annual contribution growth',
    controlGrowthHint: '€0 = flat contribution',
    controlGrowthAriaValue: '{n} euros per year',

    goalAriaLabel: 'When will I reach this amount?',
    goalHeading: 'When will I reach this amount?',
    goalFieldLabel: 'Target amount (€)',
    goalAlready: 'You already have more than {amount}',
    goalReached: "you'll reach {amount}",
    goalDuration: '{years} yr {months} mo',
    goalDurationYearsOnly: '{years} yr',
    goalUnreachable:
      "You won't reach {amount} within 100 years at these settings — " +
      'increase the contribution, initial amount, or return.',

    shareButton: 'Share result',
    shareCardCaption: 'Calculated with the S&P 500 index fund calculator',
    shareCardHorizon: '{years} yr · {rate}% annually',
    shareFailed: 'Sharing did not work — the image was downloaded instead.',

    priceAlertCta: 'Price alert',
    priceAlertFieldLabel: 'Alert price (€)',
    priceAlertConfirm: 'Set',
    priceAlertCancel: 'Cancel',
    priceAlertArmedAbove: 'Alert at ≥ {price}',
    priceAlertArmedBelow: 'Alert at ≤ {price}',
    priceAlertRemoveAriaLabel: 'Remove the price alert',
    priceAlertTriggeredTitle: 'SXR8 hit your target',
    priceAlertTriggeredBody: 'Price reached {price}',
    priceAlertTriggeredBanner: 'Alert: price reached {price}',
    priceAlertDismiss: 'Dismiss',
  },
}

// Every key in one locale must exist in the other — a typo here silently
// falls back to Bulgarian for one English string, which is easy to miss by
// eye but trivial to catch by just comparing the two key sets.
const bgKeys = Object.keys(STRINGS.bg).sort()
const enKeys = Object.keys(STRINGS.en).sort()
if (bgKeys.join() !== enKeys.join()) {
  const missingFromEn = bgKeys.filter((k) => !enKeys.includes(k))
  const missingFromBg = enKeys.filter((k) => !bgKeys.includes(k))
  throw new Error(
    `i18n: bg/en key sets differ. Missing from en: [${missingFromEn}]. ` +
      `Missing from bg: [${missingFromBg}].`,
  )
}

/**
 * `t('en', 'incomeForYear', { n: 5 })` → "for year 5". Falls back to
 * DEFAULT_LOCALE, then to the raw key, rather than throwing — a missing
 * translation should degrade visibly, not crash the render.
 */
export function t(locale, key, vars) {
  let template = STRINGS[locale]?.[key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      template = template.replaceAll(`{${name}}`, String(value))
    }
  }
  return template
}

const STORAGE_KEY = 'sp500-locale'

export const readStoredLocale = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LOCALES.includes(stored) ? stored : null
  } catch {
    return null
  }
}

export const storeLocale = (locale) => {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Persistence is a convenience; a blocked write must not break the toggle.
  }
}

/**
 * The app has exactly two locales, so "does the device prefer Bulgarian"
 * is the only question worth asking — everything else (French, Japanese,
 * English itself) lands on English, which is the wider-reach default for an
 * app whose primary market is Bulgaria but whose App Store audience is not.
 */
export const deviceLocale = () =>
  typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('bg')
    ? 'bg'
    : 'en'

/** An explicit choice wins over the device language. */
export const initialLocale = () => readStoredLocale() ?? deviceLocale()
