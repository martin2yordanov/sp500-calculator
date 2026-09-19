import { useCallback, useRef, useState } from 'react'
import { useClerk, useSignIn, useSignUp } from '@clerk/clerk-react'
import Sheet from './Sheet'
import { AppleMark, GoogleMark } from './ProviderIcons'
import { isNotFound, messageOf } from './errors'
import { startSso } from './ssoFlow'
import { tapFeedback } from '../lib/native'

const PROVIDERS = [
  // Apple first, and not only for looks: App Store review requires Sign in
  // with Apple to be offered wherever another social login is (guideline
  // 4.8), and reviewers check that it is not buried below the alternatives.
  { strategy: 'oauth_apple', label: 'Продължи с Apple', Mark: AppleMark },
  { strategy: 'oauth_google', label: 'Продължи с Google', Mark: GoogleMark },
]

export default function SignInSheet({ onClose }) {
  const { signIn, isLoaded: signInReady } = useSignIn()
  const { signUp, isLoaded: signUpReady } = useSignUp()
  const { setActive } = useClerk()

  const [step, setStep] = useState('start')
  // Which resource the emailed code belongs to. A code prepared on a sign-up
  // cannot be verified against a sign-in, so this has to be remembered.
  const mode = useRef('signIn')

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const ready = signInReady && signUpReady

  const run = useCallback(async (key, work) => {
    setBusy(key)
    setError(null)
    try {
      await work()
    } catch (cause) {
      // A cancelled OAuth sheet is a decision, not a failure — messageOf
      // returns null for it and the panel stays as it was.
      setError(messageOf(cause))
    } finally {
      setBusy(null)
    }
  }, [])

  const sendCode = (event) => {
    event.preventDefault()
    return run('code', async () => {
      const identifier = email.trim()
      if (!identifier) throw new Error('Въведи имейл адрес.')

      try {
        const attempt = await signIn.create({ identifier })
        const factor = attempt.supportedFirstFactors?.find(
          (candidate) => candidate.strategy === 'email_code',
        )
        if (!factor) {
          throw new Error('Този акаунт не поддържа вход с код по имейл.')
        }
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: factor.emailAddressId,
        })
        mode.current = 'signIn'
      } catch (cause) {
        // An unknown address is not an error here — it just means this is a
        // registration. One field, one button, either way.
        if (!isNotFound(cause)) throw cause
        await signUp.create({ emailAddress: identifier })
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        mode.current = 'signUp'
      }

      setCode('')
      setStep('code')
    })
  }

  const verifyCode = (event) => {
    event.preventDefault()
    return run('verify', async () => {
      const result =
        mode.current === 'signIn'
          ? await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() })
          : await signUp.attemptEmailAddressVerification({ code: code.trim() })

      if (result.status !== 'complete' || !result.createdSessionId) {
        throw new Error('Входът не завърши. Опитай отново.')
      }

      await setActive({ session: result.createdSessionId })
      await tapFeedback()
      onClose()
    })
  }

  const signInWith = (strategy) =>
    run(strategy, async () => {
      const status = await startSso({ strategy, signIn, signUp, setActive })
      if (status === 'complete') {
        await tapFeedback()
        onClose()
      } else if (status !== 'redirecting') {
        throw new Error('Доставчикът поиска още стъпки, които приложението не поддържа.')
      }
    })

  return (
    <Sheet title="Вход" onClose={onClose}>
      {step === 'start' ? (
        <>
          <p className="sheet-lede">
            Влез, за да пазиш настройките си и да ги намериш на всяко устройство.
            Калкулаторът работи и без акаунт.
          </p>

          <div className="sso-buttons">
            {PROVIDERS.map(({ strategy, label, Mark }) => (
              <button
                key={strategy}
                type="button"
                className="sso-btn"
                disabled={!ready || busy !== null}
                onClick={() => signInWith(strategy)}
              >
                <span className="sso-glyph">
                  <Mark />
                </span>
                {busy === strategy ? 'Отваряне…' : label}
              </button>
            ))}
          </div>

          <div className="sheet-divider">
            <span>или с имейл</span>
          </div>

          <form onSubmit={sendCode} className="sheet-form">
            <label className="field-label" htmlFor="auth-email">
              Имейл
            </label>
            <input
              id="auth-email"
              className="sheet-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="ime@primer.bg"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {/* clerk-js mounts its bot check here when the instance has one
                enabled; without the element sign-up fails with captcha_invalid. */}
            <div id="clerk-captcha" />
            <button
              type="submit"
              className="sheet-submit"
              disabled={!ready || busy !== null}
            >
              {busy === 'code' ? 'Изпращане…' : 'Изпрати код'}
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={verifyCode} className="sheet-form">
          <p className="sheet-lede">
            Изпратихме шестцифрен код на <strong>{email.trim()}</strong>.
          </p>
          <label className="field-label" htmlFor="auth-code">
            Код
          </label>
          <input
            id="auth-code"
            className="sheet-input num"
            type="text"
            inputMode="numeric"
            // Lets iOS offer the code straight from the Messages/Mail banner.
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            required
          />
          <button type="submit" className="sheet-submit" disabled={busy !== null}>
            {busy === 'verify' ? 'Проверка…' : 'Потвърди'}
          </button>
          <button
            type="button"
            className="sheet-link"
            onClick={() => {
              setStep('start')
              setError(null)
            }}
          >
            ← Друг имейл
          </button>
        </form>
      )}

      {error && (
        <p className="sheet-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  )
}
