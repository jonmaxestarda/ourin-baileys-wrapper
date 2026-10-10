/**
 * Ejemplo 3: Todos los tipos de mensajes "básicos" (bot.messages.*)
 * ---------------------------------------------------------
 * Útil como referencia rápida de cada método disponible en MessagesModule.
 * No necesitas copiar todo; cada bloque es independiente.
 */
import { OurinBot } from '../src/index.js';

const bot = new OurinBot({ sessionPath: './session' });

bot.on('open', async () => {
  const jid = '628xxx@s.whatsapp.net'; // reemplaza con el JID destino

  // Texto simple
  await bot.messages.sendText(jid, 'Hola mundo!');

  // Texto con mención
  await bot.messages.sendText(jid, 'Hola @628xxx!', ['628xxx@s.whatsapp.net']);

  // Imagen
  await bot.messages.sendImage(jid, './photo.jpg', 'Una foto bonita');

  // Video (gifPlayback=false)
  await bot.messages.sendVideo(jid, './video.mp4', 'Mi video', false);

  // Audio como nota de voz
  await bot.messages.sendAudio(jid, './audio.ogg', true);

  // Sticker
  await bot.messages.sendSticker(jid, './sticker.webp');

  // Pack de stickers completo
  await bot.messages.sendStickerPack(jid, {
    name: 'Mi Pack',
    publisher: 'Yo',
    description: 'Pack de prueba',
    stickers: [
      { url: './stickers/1.webp', emojis: ['🔥'] },
      { url: './stickers/2.webp', emojis: ['😎'] },
    ],
    cover: { url: './stickers/cover.webp' },
  });

  // Documento
  await bot.messages.sendDocument(jid, './file.pdf', 'informe.pdf', 'application/pdf');

  // Ubicación
  await bot.messages.sendLocation(jid, -6.2, 106.8, 'Jakarta');

  // Contacto
  await bot.messages.sendContact(jid, 'Contactos', [
    'BEGIN:VCARD\nVERSION:3.0\nFN:John\nTEL:+628xxx\nEND:VCARD',
  ]);

  // Encuesta
  await bot.messages.sendPoll(jid, '¿Cuál prefieres?', ['Opción A', 'Opción B'], 1);

  // Álbum de varias imágenes/videos
  await bot.messages.sendAlbum(jid, [
    { image: { url: './photo1.jpg' }, caption: 'Primera' },
    { image: { url: './photo2.jpg' }, caption: 'Segunda' },
  ]);

  // Evento
  await bot.messages.sendEvent(jid, {
    name: 'Encuentro de la comunidad',
    description: 'Reunión mensual',
    startTime: Date.now() + 86400000,
    endTime: Date.now() + 90000000,
    location: { name: 'Jakarta', degreesLatitude: -6.2, degreesLongitude: 106.8 },
  });

  // Solicitud de pago
  await bot.messages.requestPayment(jid, 50000, 'IDR', 'Pago del pedido #123', jid);
});

await bot.start();

/**
 * Para reaccionar, borrar o editar necesitas un `msg` recibido primero:
 *
 * bot.on('messages.upsert', async ({ messages }) => {
 *   const msg = messages[0];
 *   if (!msg?.message || msg.key.fromMe) return;
 *
 *   await bot.messages.react(msg.key, '👍');
 *
 *   const sent = await bot.messages.sendText(msg.key.remoteJid, 'Texto original');
 *   await bot.messages.edit(sent.key, 'Texto editado');
 *   await bot.messages.delete(sent.key);
 *
 *   await bot.messages.forward(msg.key.remoteJid, msg, 1);
 * });
 */
