package expo.modules.orderalertring

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager

/**
 * Loops the new-order beep from a foreground service so it keeps sounding while the app is
 * in the background. It ends when JS or the app coming to the front stops it, when the user
 * taps Silence, or after MAX_RING_MS as a safety net.
 */
class OrderAlertRingService : Service() {
  private var player: MediaPlayer? = null
  private val handler = Handler(Looper.getMainLooper())
  private val safetyStop = Runnable { stopSelf() }
  private var maxRingMs = OrderAlertRing.DEFAULT_MAX_RING_MS
  private val clearPushNotifications = Runnable { cancelOrderPushNotifications() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }
    maxRingMs = intent?.getLongExtra(EXTRA_MAX_RING_MS, OrderAlertRing.DEFAULT_MAX_RING_MS)
      ?: OrderAlertRing.DEFAULT_MAX_RING_MS
    startInForeground(
      intent?.getStringExtra(EXTRA_TITLE) ?: "New order",
      intent?.getStringExtra(EXTRA_BODY) ?: "",
    )
    startPlayback()
    RingState.ringing = true
    handler.removeCallbacks(safetyStop)
    handler.postDelayed(safetyStop, maxRingMs)
    // The push that triggered this ring plays its own sound; dropping it avoids a doubled beep.
    handler.removeCallbacks(clearPushNotifications)
    handler.postDelayed(clearPushNotifications, 1_500)
    return START_NOT_STICKY
  }

  private fun startInForeground(title: String, body: String) {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "New order ringing", NotificationManager.IMPORTANCE_LOW).apply {
          setSound(null, null)
          description = "Shown while a new order alert is ringing"
        },
      )
    }
    val open = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }
    val silence = PendingIntent.getService(
      this,
      1,
      Intent(this, OrderAlertRingService::class.java).setAction(ACTION_STOP),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    val icon = resources.getIdentifier("notification_icon", "drawable", packageName)
      .takeIf { it != 0 } ?: applicationInfo.icon
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION") Notification.Builder(this)
    }
    val notification = builder
      .setSmallIcon(icon)
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(Notification.CATEGORY_ALARM)
      .setOngoing(true)
      .setContentIntent(open)
      .addAction(@Suppress("DEPRECATION") Notification.Action.Builder(0, "Silence", silence).build())
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun startPlayback() {
    if (player != null) return
    val resId = resources.getIdentifier(SOUND_NAME, "raw", packageName)
    if (resId == 0) return
    player = MediaPlayer().apply {
      // Media stream: the volume keys adjust it while it plays, and silent mode does not mute it.
      setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
          .build(),
      )
      resources.openRawResourceFd(resId).use { setDataSource(it.fileDescriptor, it.startOffset, it.length) }
      isLooping = true
      setWakeMode(this@OrderAlertRingService, PowerManager.PARTIAL_WAKE_LOCK)
      prepare()
      start()
    }
  }

  private fun cancelOrderPushNotifications() {
    // Notification.channelId needs API 26; older devices keep the push's own notification.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val recently = System.currentTimeMillis() - RECENT_PUSH_MS
    manager.activeNotifications
      .filter { it.id != NOTIFICATION_ID }
      .filter {
        // The fallback channel carries order pushes sent without a beep channel, but also other
        // notifications, so only the ones that just arrived are dropped.
        it.notification.channelId in ORDER_CHANNELS ||
          (it.notification.channelId == FALLBACK_CHANNEL && it.postTime >= recently)
      }
      .forEach { manager.cancel(it.tag, it.id) }
  }

  /** Swiping the app away means the user closed it: stop ringing instead of outliving the app. */
  override fun onTaskRemoved(rootIntent: Intent?) {
    stopSelf()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    player?.run {
      runCatching { stop() }
      release()
    }
    player = null
    RingState.ringing = false
    stopForeground(STOP_FOREGROUND_REMOVE)
    super.onDestroy()
  }

  companion object {
    const val EXTRA_TITLE = "title"
    const val EXTRA_BODY = "body"
    const val EXTRA_MAX_RING_MS = "maxRingMs"
    private const val ACTION_STOP = "expo.modules.orderalertring.STOP"
    private const val CHANNEL_ID = "order-alert-ring"
    private const val NOTIFICATION_ID = 7421
    private const val SOUND_NAME = "new_order_beep_5s"
    private const val FALLBACK_CHANNEL = "default"
    private const val RECENT_PUSH_MS = 20_000L
    private val ORDER_CHANNELS = setOf(
      "new-orders-beep-5s-v4",
      "store-new-orders-beep-5s-v4",
    )
  }
}
