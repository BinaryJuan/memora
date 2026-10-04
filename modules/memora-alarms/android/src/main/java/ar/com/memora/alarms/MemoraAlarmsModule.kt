package ar.com.memora.alarms

import android.app.AlarmManager
import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Le pregunta a Android si Memora puede programar alarmas a la hora exacta (Android 12+). */
class MemoraAlarmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MemoraAlarms")

    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return@Function true
      val context = appContext.reactContext ?: return@Function true
      val alarms = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return@Function true
      alarms.canScheduleExactAlarms()
    }
  }
}
