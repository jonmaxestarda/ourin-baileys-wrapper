/**
 * ChatProfileModule
 * ---------------------------------------------------------
 * Envoltorio de métodos de chat/perfil: foto de perfil, estado, presencia,
 * recibos de lectura, bloqueo, modificaciones de chat, contactos, etiquetas.
 */
export class ChatProfileModule {
  constructor(sock) {
    this.sock = sock;
  }

  /** @param {'image'|'preview'} type */
  getProfilePictureUrl(jid, type = 'image') {
    return this.sock.profilePictureUrl(jid, type);
  }

  updateProfilePicture(jid, mediaUpload) {
    return this.sock.updateProfilePicture(jid, mediaUpload);
  }

  removeProfilePicture(jid) {
    return this.sock.removeProfilePicture(jid);
  }

  updateProfileName(name) {
    return this.sock.updateProfileName(name);
  }

  updateProfileStatus(status) {
    return this.sock.updateProfileStatus(status);
  }

  /**
   * Actualiza presencia (available/composing/etc.).
   * @param {'available'|'unavailable'|'composing'|'recording'|'paused'} presence
   */
  sendPresenceUpdate(presence, jid) {
    return this.sock.sendPresenceUpdate(presence, jid);
  }

  presenceSubscribe(jid) {
    return this.sock.presenceSubscribe(jid);
  }

  /** @param {Object[]} keys Array de msg.key */
  readMessages(keys) {
    return this.sock.readMessages(keys);
  }

  /** @param {'read'|'read-self'} type */
  sendReceipt(jid, participant, msgIds, type = 'read') {
    return this.sock.sendReceipt(jid, participant, msgIds, type);
  }

  /** @param {'block'|'unblock'} action */
  updateBlockStatus(jid, action) {
    return this.sock.updateBlockStatus(jid, action);
  }

  fetchBlocklist() {
    return this.sock.fetchBlocklist();
  }

  /**
   * Modifica un chat (archivar, fijar, silenciar, marcar leído, etc.), según
   * el mismo objeto de modificación documentado por Baileys/ourin-baileys.
   * @example
   * await bot.chatProfile.modifyChat(jid, { archive: true, lastMessageOrig: msg, lastMessage: msg });
   */
  modifyChat(jid, modification) {
    return this.sock.chatModify(modification, jid);
  }

  /**
   * Marca/desmarca mensajes como destacados (estrella).
   * @param {{id:string, fromMe:boolean}[]} messageRefs
   */
  star(jid, messageRefs, starValue = true) {
    return this.sock.star(jid, messageRefs, starValue);
  }

  addOrEditContact(jid, contactData) {
    return this.sock.addOrEditContact(jid, contactData);
  }

  removeContact(jid) {
    return this.sock.removeContact(jid);
  }

  addChatLabel(jid, labelId) {
    return this.sock.addChatLabel(jid, labelId);
  }

  removeChatLabel(jid, labelId) {
    return this.sock.removeChatLabel(jid, labelId);
  }

  addMessageLabel(jid, messageId, labelId) {
    return this.sock.addMessageLabel(jid, messageId, labelId);
  }

  /**
   * Resincroniza el estado de la app (contactos, config, etc.).
   * @param {string[]} collections ej. ['regular', 'critical_block']
   */
  resyncAppState(collections, fromScratch = false) {
    return this.sock.resyncAppState(collections, fromScratch);
  }
}
