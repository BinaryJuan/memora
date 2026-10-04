// El widget va primero. Cuando Android lo tiene que dibujar con la app cerrada, arranca la app
// en segundo plano y busca la tarea del widget: si se registrara después de cargar la navegación
// y algo de ahí fallara sin pantalla, la tarea nunca quedaría registrada y el widget se vería vacío.
import '@/widget/register';
import 'expo-router/entry';
