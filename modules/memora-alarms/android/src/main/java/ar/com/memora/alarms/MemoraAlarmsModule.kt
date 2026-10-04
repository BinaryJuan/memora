package ar.com.memora.alarms

import android.app.AlarmManager
import android.content.Context
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Preguntas chicas a Android que las librerías de Expo no cubren. */
class MemoraAlarmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MemoraAlarms")

    // ¿Memora puede programar alarmas a la hora exacta? (Android 12+)
    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return@Function true
      val context = appContext.reactContext ?: return@Function true
      val alarms = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return@Function true
      alarms.canScheduleExactAlarms()
    }

    // ¿El teléfono está en silencio o en vibración? Ahí el sonido de cumpleaños no suena.
    Function("isRingerSilent") {
      val context = appContext.reactContext ?: return@Function false
      val audio = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return@Function false
      audio.ringerMode != AudioManager.RINGER_MODE_NORMAL
    }
  }
}
