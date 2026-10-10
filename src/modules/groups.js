/**
 * GroupsModule
 * ---------------------------------------------------------
 * Envoltorio de todos los métodos `sock.group*` documentados en el README.
 */
export class GroupsModule {
  constructor(sock) {
    this.sock = sock;
  }

  /** Obtiene la metadata de un grupo (nombre, participantes, descripción, etc.). */
  getMetadata(groupJid) {
    return this.sock.groupMetadata(groupJid);
  }

  /**
   * Crea un grupo nuevo.
   * @example
   * const group = await bot.groups.create('Mi Grupo', ['628xxx@s.whatsapp.net']);
   */
  create(subject, participantJids) {
    return this.sock.groupCreate(subject, participantJids);
  }

  leave(groupJid) {
    return this.sock.groupLeave(groupJid);
  }

  updateSubject(groupJid, newSubject) {
    return this.sock.groupUpdateSubject(groupJid, newSubject);
  }

  updateDescription(groupJid, newDescription) {
    return this.sock.groupUpdateDescription(groupJid, newDescription);
  }

  /**
   * Agrega, elimina, promueve o degrada participantes.
   * @param {'add'|'remove'|'promote'|'demote'} action
   * @example
   * await bot.groups.updateParticipants('id@g.us', ['628xxx@s.whatsapp.net'], 'add');
   */
  updateParticipants(groupJid, participantJids, action) {
    return this.sock.groupParticipantsUpdate(groupJid, participantJids, action);
  }

  getJoinRequests(groupJid) {
    return this.sock.groupRequestParticipantsList(groupJid);
  }

  /**
   * Aprueba o rechaza solicitudes de unión.
   * @param {'approve'|'reject'} action
   */
  updateJoinRequests(groupJid, participantJids, action) {
    return this.sock.groupRequestParticipantsUpdate(groupJid, participantJids, action);
  }

  getInviteCode(groupJid) {
    return this.sock.groupInviteCode(groupJid);
  }

  revokeInvite(groupJid) {
    return this.sock.groupRevokeInvite(groupJid);
  }

  acceptInvite(inviteCode) {
    return this.sock.groupAcceptInvite(inviteCode);
  }

  getInviteInfo(inviteCode) {
    return this.sock.groupGetInviteInfo(inviteCode);
  }

  /**
   * Cambia configuración del grupo.
   * @param {'announcement'|'not_announcement'|'locked'|'unlocked'} setting
   */
  updateSetting(groupJid, setting) {
    return this.sock.groupSettingUpdate(groupJid, setting);
  }

  /** @param {'admin_add'|'all_member_add'} mode */
  setMemberAddMode(groupJid, mode) {
    return this.sock.groupMemberAddMode(groupJid, mode);
  }

  /** @param {'on'|'off'} mode */
  setJoinApprovalMode(groupJid, mode) {
    return this.sock.groupJoinApprovalMode(groupJid, mode);
  }

  /**
   * Activa/desactiva mensajes temporales.
   * @param {number} durationSeconds ej. 86400 = 24h, 0 = desactivar
   */
  toggleEphemeral(groupJid, durationSeconds) {
    return this.sock.groupToggleEphemeral(groupJid, durationSeconds);
  }

  fetchAllParticipating() {
    return this.sock.groupFetchAllParticipating();
  }

  updateMemberLabel(groupJid, label) {
    return this.sock.updateMemberLabel(groupJid, label);
  }
}
