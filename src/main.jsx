import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import SsoCallback from './auth/SsoCallback'
import { authEnabled, WEB_SSO_PATH } from './auth/config'
import { bootstrapNative } from './lib/native'
import './styles.css'

// The app has no router: one extra screen does not pay for one. The OAuth
// return path is the only other address the web build ever answers on, and
// vercel.json rewrites it to this same bundle.
//
// The `authEnabled` half matters: without a Clerk key there is no provider
// above this tree, and the callback component would throw on a stale link
// instead of quietly showing the calculator.
const isSsoCallback = authEnabled && window.location.pathname === WEB_SSO_PATH

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>{isSsoCallback ? <SsoCallback /> : <App />}</AuthProvider>
  </StrictMode>,
)

// Deliberately after the first render: the splash screen is configured not to
// auto-hide, so dismissing it here is what guarantees the user never sees a
// blank window between the launch image and the app.
bootstrapNative()
