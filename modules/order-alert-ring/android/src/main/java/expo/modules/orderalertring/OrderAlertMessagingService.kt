package expo.modules.orderalertring

import android.app.ActivityManager
import android.util.Log
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.ExpoFirebaseMessagingService
import org.json.JSONObject

private const val TAG = "OrderAlertRing"
private const val RING_SIGNAL = "order_ring"

/**
 * The visible order push is shown by Firebase itself while the app is in the background, so this
 * service never sees it. The server therefore sends a companion data-only "order_ring" push, which
 * does arrive here in every state, and this service starts the ring from it. Everything else goes to
 * expo-notifications untouched.
 */
class OrderAlertMessagingService : ExpoFirebaseMessagingService() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val signal = RingSignal.from(remoteMessage.data)
    if (signal == null) {
      super.onMessageReceived(remoteMessage)
      return
    }
    try {
      startRing(signal)
    } catch (error: Exception) {
      Log.w(TAG, "Unable to start the order ring", error)
    }
  }

  private fun startRing(signal: RingSignal) {
    val visible = isAppVisible()
    val hasTask = OrderAlertRing.hasAppTask(this)
    Log.i(TAG, "ring signal orderId=${signal.orderId} hasTask=$hasTask visible=$visible jsAlive=${RingState.jsAlive}")
    // A swiped-away app keeps only the push's own sound; a visible app rings from JS.
    if (!hasTask || visible) return
    OrderAlertRing.start(
      this,
      signal.title,
      signal.body,
      if (RingState.jsAlive) OrderAlertRing.DEFAULT_MAX_RING_MS else OrderAlertRing.UNATTENDED_MAX_RING_MS,
    )
  }

  /** Process importance is exact for the visible app, unlike lifecycle callbacks that can be missed. */
  private fun isAppVisible(): Boolean {
    val info = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(info)
    return info.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
  }

  private class RingSignal(val orderId: String, val title: String, val body: String) {
    companion object {
      fun from(data: Map<String, String>): RingSignal? {
        // Expo may deliver the custom payload flat or as a JSON string under "body".
        val nested = data["body"]?.let { runCatching { JSONObject(it) }.getOrNull() }
        fun field(name: String): String? = data[name] ?: nested?.optString(name)?.takeIf { it.isNotEmpty() }
        if (field("type") != RING_SIGNAL) return null
        return RingSignal(
          orderId = field("orderId") ?: "",
          title = field("ringTitle") ?: "New order",
          body = field("ringBody") ?: "",
        )
      }
    }
  }
}
