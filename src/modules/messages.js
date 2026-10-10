/**
 * MessagesModule
 * ---------------------------------------------------------
 * Envoltorio de los envíos de mensajes "básicos" de sock.sendMessage().
 * Cada método aquí simplemente arma el objeto de contenido correcto
 * y llama a sock.sendMessage(jid, content, options) — comportamiento
 * 100% idéntico al de ourin-baileys, solo con nombres de método claros.
 */
import { makeStickerPack } from 'ourin-baileys';

export class MessagesModule {
  constructor(sock) {
    this.sock = sock;
  }

  /**
   * Envía texto plano, opcionalmente con menciones.
   * @param {string} jid Destinatario, ej: '628xxx@s.whatsapp.net' o 'id@g.us'
   * @param {string} text Texto a enviar. Usa @numero dentro del texto si mencionas.
   * @param {string[]} [mentions] Lista de JIDs mencionados, ej: ['628xxx@s.whatsapp.net']
   * @param {Object} [options] Opciones extra de sendMessage (quoted, ephemeralExpiration, etc.)
   *
   * @example
   * await bot.messages.sendText(jid, 'Hola @628xxx!', ['628xxx@s.whatsapp.net']);
   */
  sendText(jid, text, mentions, options = {}) {
    const content = mentions?.length ? { text, mentions } : { text };
    return this.sock.sendMessage(jid, content, options);
  }

  /**
   * Envía una imagen (local o URL) con caption opcional.
   * @param {string} jid
   * @param {string} urlOrPath Ruta local o URL de la imagen
   * @param {string} [caption]
   * @param {Object} [options]
   *
   * @example
   * await bot.messages.sendImage(jid, './photo.jpg', 'Una foto');
   */
  sendImage(jid, urlOrPath, caption, options = {}) {
    return this.sock.sendMessage(jid, { image: { url: urlOrPath }, caption }, options);
  }

  /**
   * Envía un video. gifPlayback=true lo reproduce en bucle como GIF.
   * @example
   * await bot.messages.sendVideo(jid, './video.mp4', 'Un video', false);
   */
  sendVideo(jid, urlOrPath, caption, gifPlayback = false, options = {}) {
    return this.sock.sendMessage(jid, { video: { url: urlOrPath }, caption, gifPlayback }, options);
  }

  /**
   * Envía audio. ptt=true lo manda como nota de voz.
   * @example
   * await bot.messages.sendAudio(jid, './audio.ogg', true); // nota de voz
   */
  sendAudio(jid, urlOrPath, ptt = false, mimetype = 'audio/ogg; codecs=opus', options = {}) {
    return this.sock.sendMessage(jid, { audio: { url: urlOrPath }, mimetype, ptt }, options);
  }

  /**
   * Envía un sticker .webp.
   * @example
   * await bot.messages.sendSticker(jid, './sticker.webp');
   */
  sendSticker(jid, urlOrPath, options = {}) {
    return this.sock.sendMessage(jid, { sticker: { url: urlOrPath } }, options);
  }

  /**
   * Crea y envía un pack de stickers completo usando el helper nativo makeStickerPack.
   * @param {string} jid
   * @param {{name:string, publisher:string, description?:string, stickers:{url:string, emojis?:string[]}[], cover?:{url:string}}} packConfig
   *
   * @example
   * await bot.messages.sendStickerPack(jid, {
   *   name: 'Mi Pack', publisher: 'Yo',
   *   stickers: [{ url: './1.webp', emojis: ['🔥'] }],
   * });
   */
  sendStickerPack(jid, packConfig, options = {}) {
    return this.sock.sendMessage(jid, makeStickerPack(packConfig), options);
  }

  /**
   * Envía un documento/archivo.
   * @example
   * await bot.messages.sendDocument(jid, './file.pdf', 'document.pdf', 'application/pdf');
   */
  sendDocument(jid, urlOrPath, fileName, mimetype = 'application/pdf', options = {}) {
    return this.sock.sendMessage(jid, { document: { url: urlOrPath }, fileName, mimetype }, options);
  }

  /**
   * Reacciona a un mensaje con un emoji. Usa '' para quitar la reacción.
   * @param {Object} key El `msg.key` del mensaje a reaccionar
   * @example
   * await bot.messages.react(msg.key, '👍');
   */
  react(key, emoji, options = {}) {
    return this.sock.sendMessage(key.remoteJid, { react: { key, text: emoji } }, options);
  }

  /**
   * Envía una ubicación geográfica.
   * @example
   * await bot.messages.sendLocation(jid, -6.2, 106.8, 'Jakarta');
   */
  sendLocation(jid, degreesLatitude, degreesLongitude, name, options = {}) {
    return this.sock.sendMessage(jid, { location: { degreesLatitude, degreesLongitude, name } }, options);
  }

  /**
   * Envía una tarjeta de contacto en formato vCard.
   * @example
   * await bot.messages.sendContact(jid, 'Contactos', [
   *   'BEGIN:VCARD\nVERSION:3.0\nFN:John\nTEL:+628xxx\nEND:VCARD',
   * ]);
   */
  sendContact(jid, displayName, vcards, options = {}) {
    return this.sock.sendMessage(
      jid,
      { contacts: { displayName, contacts: vcards.map((vcard) => ({ vcard })) } },
      options,
    );
  }

  /**
   * Envía una encuesta.
   * @example
   * await bot.messages.sendPoll(jid, 'Vote!', ['A', 'B', 'C'], 1);
   */
  sendPoll(jid, name, values, selectableCount = 1, options = {}) {
    return this.sock.sendMessage(jid, { poll: { name, values, selectableCount } }, options);
  }

  /**
   * Reenvía (forward) un mensaje ya recibido.
   * @example
   * await bot.messages.forward(jid, originalMsg, 1);
   */
  forward(jid, message, forwardingScore = 1, options = {}) {
    return this.sock.sendMessage(jid, { forward: message, forwardingScore, isForwarded: true }, options);
  }

  /**
   * Borra un mensaje (para todos) usando su key.
   * @example
   * await bot.messages.delete(msg.key);
   */
  delete(key) {
    return this.sock.sendMessage(key.remoteJid, { delete: key });
  }

  /**
   * Edita un mensaje de texto previamente enviado.
   * @example
   * await bot.messages.edit(msg.key, 'Texto editado');
   */
  edit(key, newText) {
    return this.sock.sendMessage(key.remoteJid, { text: newText, edit: key });
  }

  /**
   * Envía un álbum (varias imágenes/videos agrupados). El conteo se calcula solo.
   * @param {Array<{image?:{url:string}, video?:{url:string}, caption?:string}>} items
   * @example
   * await bot.messages.sendAlbum(jid, [
   *   { image: { url: './1.jpg' }, caption: 'Primera' },
   *   { video: { url: './clip.mp4' }, caption: 'Video' },
   * ]);
   */
  sendAlbum(jid, items, options = {}) {
    return this.sock.sendMessage(jid, { albumMessage: items }, options);
  }

  /**
   * Envía un mensaje de pago solicitado.
   * @example
   * await bot.messages.requestPayment(jid, 50000, 'IDR', 'Pago pedido #123', fromJid);
   */
  requestPayment(jid, amount, currency, note, from, options = {}) {
    return this.sock.sendMessage(jid, { requestPaymentMessage: { amount, currency, note, from } }, options);
  }

  /**
   * Envía un mensaje de evento.
   * @example
   * await bot.messages.sendEvent(jid, {
   *   name: 'Encuentro', description: 'Reunión mensual',
   *   startTime: Date.now()+86400000, endTime: Date.now()+90000000,
   *   location: { name: 'Jakarta', degreesLatitude: -6.2, degreesLongitude: 106.8 },
   * });
   */
  sendEvent(jid, eventConfig, options = {}) {
    return this.sock.sendMessage(jid, { eventMessage: eventConfig }, options);
  }

  /**
   * Envía un snapshot de resultados de una encuesta.
   * @example
   * await bot.messages.sendPollResult(jid, '¿Color favorito?', [
   *   { optionName: 'Rojo', optionVoteCount: 42 },
   * ]);
   */
  sendPollResult(jid, name, pollVotes, options = {}) {
    return this.sock.sendMessage(jid, { pollResultMessage: { name, pollVotes } }, options);
  }
}
