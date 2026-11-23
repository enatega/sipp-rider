package expo.modules.orderalertring

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

object OrderAlertRing {
  /** Safety bound when JS is running and can stop the ring as soon as the order is handled. */
  const val DEFAULT_MAX_RING_MS = 10 * 60 * 1000L

  /** Shorter bound when no JS runtime exists to notice the order was handled elsewhere. */
  const val UNATTENDED_MAX_RING_MS = 60 * 1000L

  fun start(context: Context, title: String, body: String, maxRingMs: Long = DEFAULT_MAX_RING_MS) {
    val intent = Intent(context, OrderAlertRingService::class.java)
      .putExtra(OrderAlertRingService.EXTRA_TITLE, title)
      .putExtra(OrderAlertRingService.EXTRA_BODY, body)
      .putExtra(OrderAlertRingService.EXTRA_MAX_RING_MS, maxRingMs)
    ContextCompat.startForegroundService(context, intent)
  }

  fun stop(context: Context) {
    context.stopService(Intent(context, OrderAlertRingService::class.java))
  }

  /**
   * False once the user swiped the app away from recents. The process (and its JS runtime) can
   * outlive that swipe, so only the task list says whether the app was really closed.
   */
  fun hasAppTask(context: Context): Boolean {
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    return manager.appTasks.isNotEmpty()
  }
}
