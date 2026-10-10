/**
 * PrivacyModule
 * ---------------------------------------------------------
 * Envoltorio de todos los ajustes de privacidad `sock.update*Privacy`.
 */
export class PrivacyModule {
  constructor(sock) {
    this.sock = sock;
  }

  /** @param {'all'|'contacts'|'contact_blacklist'|'nobody'} value */
  setLastSeen(value) {
    return this.sock.updateLastSeenPrivacy(value);
  }

  /** @param {'all'|'match_last_seen'} value */
  setOnline(value) {
    return this.sock.updateOnlinePrivacy(value);
  }

  /** @param {'all'|'contacts'|'contact_blacklist'|'nobody'} value */
  setProfilePicture(value) {
    return this.sock.updateProfilePicturePrivacy(value);
  }

  /** @param {'all'|'contacts'|'contact_blacklist'|'nobody'} value */
  setStatus(value) {
    return this.sock.updateStatusPrivacy(value);
  }

  /** @param {'all'|'none'} value */
  setReadReceipts(value) {
    return this.sock.updateReadReceiptsPrivacy(value);
  }

  /** @param {'all'|'contacts'} value */
  setGroupsAdd(value) {
    return this.sock.updateGroupsAddPrivacy(value);
  }

  /** @param {'all'|'contacts'|'nobody'} value */
  setMessages(value) {
    return this.sock.updateMessagesPrivacy(value);
  }

  /** @param {'all'|'known'|'nobody'} value */
  setCalls(value) {
    return this.sock.updateCallPrivacy(value);
  }

  /** @param {number} seconds ej. 86400 (24h), 0 para desactivar */
  setDefaultDisappearingMode(seconds) {
    return this.sock.updateDefaultDisappearingMode(seconds);
  }

  setDisableLinkPreviews(disabled) {
    return this.sock.updateDisableLinkPreviewsPrivacy(disabled);
  }
}
