import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Keyboard, KeyboardResize } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

export const isNative = () => Capacitor.isNativePlatform()

/**
 * Everything the WebView needs before the first paint is safe to leave until
 * after React mounts except the splash screen, which is configured with
 * `launchAutoHide: false` precisely so the user never sees a white flash
 * between the launch image and the rendered app.
 */
export async function bootstrapNative() {
  if (!isNative()) return

  // Lets styles.css scope the rules that only make sense inside the app —
  // no tap highlight, no long-press callout on chrome.
  document.documentElement.classList.add('native')

  const tasks = [
    // `Style.Dark` means light content — which is what a #080808 background
    // needs. The literal reading of the name is the opposite of its effect.
    StatusBar.setStyle({ style: Style.Dark }),
    // The layout already reserves `env(safe-area-inset-top)`, so letting the
    // WebView run under the status bar gains the app a full notch of height
    // instead of a grey band.
    StatusBar.setOverlaysWebView({ overlay: true }),
    // Without this the amount fields sit under the keyboard on an iPhone SE.
    Keyboard.setResizeMode({ mode: KeyboardResize.Native }),
    Keyboard.setAccessoryBarVisible({ isVisible: true }),
  ]

  // A plugin that is missing or unimplemented must not stop the splash screen
  // from being dismissed, or the app hangs on a black screen forever.
  await Promise.allSettled(tasks)
  await SplashScreen.hide().catch(() => {})
}

/**
 * A short tick on the actions that commit something. Silently does nothing on
 * the web and on devices without a Taptic Engine.
 */
export async function tapFeedback(style = ImpactStyle.Light) {
  if (!isNative()) return
  try {
    await Haptics.impact({ style })
  } catch {
    // No haptics hardware, or the user disabled system haptics.
  }
}

export { ImpactStyle }
