package expo.modules.orderalertring

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class OrderAlertRingModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("OrderAlertRing")

    OnCreate {
      RingState.jsAlive = true
      RingState.foreground = appContext.currentActivity != null
    }

    OnDestroy {
      RingState.jsAlive = false
    }

    // Once the app is visible the JS loop takes over, so the native ring must not overlap it.
    OnActivityEntersForeground {
      RingState.foreground = true
      appContext.reactContext?.let { OrderAlertRing.stop(it) }
    }

    OnActivityEntersBackground {
      RingState.foreground = false
    }

    Function("start") { title: String, body: String ->
      appContext.reactContext?.let { OrderAlertRing.start(it, title, body) }
    }

    Function("stop") {
      appContext.reactContext?.let { OrderAlertRing.stop(it) }
    }

    Function("isRinging") {
      RingState.ringing
    }
  }
}
