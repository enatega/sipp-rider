package expo.modules.orderalertring

/** Process-wide flags shared by the module, the ring service and the FCM service. */
object RingState {
  /** The JS runtime exists: the app process is alive. A killed app starts with this false. */
  @Volatile var jsAlive = false

  /** An activity is visible; JS plays the in-app loop instead of the native ring. */
  @Volatile var foreground = false

  @Volatile var ringing = false
}
