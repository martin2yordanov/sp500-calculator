import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

/**
 * Every call here is fire-and-forget. Most desktop browsers and iOS Safari
 * have no vibration API at all, and the plugin's web shim rejects rather
 * than silently doing nothing — without this, every slider drag would log
 * an unhandled-rejection warning on the very platforms haptics cannot reach.
 * Inside the native shell the same calls reach the real iOS feedback
 * generators, which is the point of adding this at all.
 */
const attempt = (fn) => {
  fn().catch(() => {})
}

export const hapticLight = () => attempt(() => Haptics.impact({ style: ImpactStyle.Light }))
export const hapticSuccess = () => attempt(() => Haptics.notification({ type: NotificationType.Success }))
export const hapticWarning = () => attempt(() => Haptics.notification({ type: NotificationType.Warning }))
export const hapticSelectionChanged = () => attempt(() => Haptics.selectionChanged())
