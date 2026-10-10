/**
 * Ejemplo 7: Llamadas de voz (VoIP nativo)
 * ---------------------------------------------------------
 * El motor VoIP comparte el mismo socket de WhatsApp (sin doble pairing).
 * Debe activarse DESPUÉS de que la conexión esté en estado 'open'.
 */
import { OurinBot } from '../src/index.js';

const bot = new OurinBot({ sessionPath: './session' });

bot.on('open', async () => {
  // 1. Activa el motor VoIP una sola vez
  const voip = await bot.enableVoip();
  console.log('Motor VoIP activo');

  // 2. Realiza una llamada
  try {
    const call = await voip.call('6281234567890', {
      durationMs: 60000,       // tiempo máximo de espera/duración
      audioSource: 'silence',  // 'silence' | 'mic' | 'file' (mic/file requieren audio-feeder y ffmpeg)
    });

    call.on('ringing', () => console.log('Sonando...'));
    call.on('connected', () => console.log('¡Conectado!'));
    call.on('ended', (reason) => console.log('Llamada terminada:', reason));

    await call.waitForEnd();
    console.log('Llamada finalizada.');
  } catch (err) {
    console.error('Error al llamar:', err);
  }
});

await bot.start();
