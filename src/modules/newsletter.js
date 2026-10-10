/**
 * NewsletterModule
 * ---------------------------------------------------------
 * Envoltorio de todos los métodos `sock.newsletter*` / `cekIDSaluran`
 * documentados en el README, agrupados bajo `bot.newsletter.*`.
 */
export class NewsletterModule {
  constructor(sock) {
    this.sock = sock;
  }

  /**
   * Resuelve una URL de canal (https://whatsapp.com/channel/xxxxx) a su metadata.
   * @example
   * const info = await bot.newsletter.resolveUrl('https://whatsapp.com/channel/xxxxx');
   * console.log(info.name, info.subscribers);
   */
  resolveUrl(channelUrl) {
    return this.sock.cekIDSaluran(channelUrl);
  }

  /**
   * Sigue varios canales a la vez (string con JIDs separados por espacio).
   * @example
   * await bot.newsletter.followMultiple('id1@newsletter id2@newsletter');
   */
  followMultiple(spaceSeparatedJids) {
    return this.sock.newsletterMultipleFollow(spaceSeparatedJids);
  }

  /** Obtiene todos los canales a los que el usuario está suscrito. */
  fetchAllSubscribed() {
    return this.sock.newsletterFetchAllSubscribe();
  }

  /**
   * Acción genérica: 'follow' | 'unfollow' | 'mute' | 'unmute'.
   * @example
   * await bot.newsletter.action('id@newsletter', 'follow');
   */
  action(jid, actionType) {
    return this.sock.newsletterAction(jid, actionType);
  }

  /** Crea un nuevo canal/newsletter. */
  create(name, description) {
    return this.sock.newsletterCreate(name, description);
  }

  /** Actualiza campos del canal (ej. { name: 'Nuevo Nombre' }). */
  update(jid, updates) {
    return this.sock.newsletterUpdate(jid, updates);
  }

  /** Obtiene el número de suscriptores. */
  getSubscriberCount(jid) {
    return this.sock.newsletterSubscribers(jid);
  }

  /** Obtiene la metadata completa del canal. */
  getMetadata(jid, newsletterJid) {
    return this.sock.newsletterMetadata(jid, newsletterJid);
  }

  follow(jid) {
    return this.sock.newsletterFollow(jid);
  }

  unfollow(jid) {
    return this.sock.newsletterUnfollow(jid);
  }

  mute(jid) {
    return this.sock.newsletterMute(jid);
  }

  unmute(jid) {
    return this.sock.newsletterUnmute(jid);
  }

  updateName(jid, name) {
    return this.sock.newsletterUpdateName(jid, name);
  }

  updateDescription(jid, description) {
    return this.sock.newsletterUpdateDescription(jid, description);
  }

  updatePicture(jid, mediaUpload) {
    return this.sock.newsletterUpdatePicture(jid, mediaUpload);
  }

  removePicture(jid) {
    return this.sock.newsletterRemovePicture(jid);
  }

  /**
   * Reacciona a un mensaje del canal.
   * @example
   * await bot.newsletter.reactToMessage('id@newsletter', serverId, '👍');
   */
  reactToMessage(jid, serverId, emoji) {
    return this.sock.newsletterReactMessage(jid, serverId, emoji);
  }

  /**
   * Obtiene mensajes del canal.
   * @example
   * const msgs = await bot.newsletter.fetchMessages('id@newsletter', 50, 0, 0);
   */
  fetchMessages(jid, count, since, after) {
    return this.sock.newsletterFetchMessages(jid, count, since, after);
  }

  getAdminCount(jid) {
    return this.sock.newsletterAdminCount(jid);
  }

  changeOwner(jid, newOwnerJid) {
    return this.sock.newsletterChangeOwner(jid, newOwnerJid);
  }

  demote(jid, userJid) {
    return this.sock.newsletterDemote(jid, userJid);
  }

  delete(jid) {
    return this.sock.newsletterDelete(jid);
  }
}
