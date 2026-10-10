/**
 * CommunitiesModule
 * ---------------------------------------------------------
 * Envoltorio de todos los métodos `sock.community*` documentados en el README.
 */
export class CommunitiesModule {
  constructor(sock) {
    this.sock = sock;
  }

  getMetadata(communityJid) {
    return this.sock.communityMetadata(communityJid);
  }

  /**
   * @example
   * const community = await bot.communities.create('Nuestra Comunidad', 'Descripción');
   */
  create(subject, description) {
    return this.sock.communityCreate(subject, description);
  }

  /**
   * Crea un subgrupo dentro de una comunidad.
   * @example
   * const sub = await bot.communities.createSubgroup('Anuncios', ['628xxx@s.whatsapp.net'], 'communityid@g.us');
   */
  createSubgroup(subject, participantJids, communityJid) {
    return this.sock.communityCreateGroup(subject, participantJids, communityJid);
  }

  linkGroup(groupJid, communityJid) {
    return this.sock.communityLinkGroup(groupJid, communityJid);
  }

  unlinkGroup(groupJid, communityJid) {
    return this.sock.communityUnlinkGroup(groupJid, communityJid);
  }

  fetchLinkedGroups(communityJid) {
    return this.sock.communityFetchLinkedGroups(communityJid);
  }

  getInviteCode(communityJid) {
    return this.sock.communityInviteCode(communityJid);
  }

  revokeInvite(communityJid) {
    return this.sock.communityRevokeInvite(communityJid);
  }

  acceptInvite(inviteCode) {
    return this.sock.communityAcceptInvite(inviteCode);
  }

  getInviteInfo(inviteCode) {
    return this.sock.communityGetInviteInfo(inviteCode);
  }

  getJoinRequests(communityJid) {
    return this.sock.communityRequestParticipantsList(communityJid);
  }

  /** @param {'approve'|'reject'} action */
  updateJoinRequests(communityJid, participantJids, action) {
    return this.sock.communityRequestParticipantsUpdate(communityJid, participantJids, action);
  }

  /** @param {'add'|'remove'|'promote'|'demote'} action */
  updateParticipants(communityJid, participantJids, action) {
    return this.sock.communityParticipantsUpdate(communityJid, participantJids, action);
  }

  updateSubject(communityJid, subject) {
    return this.sock.communityUpdateSubject(communityJid, subject);
  }

  updateDescription(communityJid, description) {
    return this.sock.communityUpdateDescription(communityJid, description);
  }

  toggleEphemeral(communityJid, durationSeconds) {
    return this.sock.communityToggleEphemeral(communityJid, durationSeconds);
  }

  /** @param {'announcement'|'not_announcement'|'locked'|'unlocked'} setting */
  updateSetting(communityJid, setting) {
    return this.sock.communitySettingUpdate(communityJid, setting);
  }

  /** @param {'admin_add'|'all_member_add'} mode */
  setMemberAddMode(communityJid, mode) {
    return this.sock.communityMemberAddMode(communityJid, mode);
  }

  /** @param {'on'|'off'} mode */
  setJoinApprovalMode(communityJid, mode) {
    return this.sock.communityJoinApprovalMode(communityJid, mode);
  }

  leave(communityJid) {
    return this.sock.communityLeave(communityJid);
  }

  fetchAllParticipating() {
    return this.sock.communityFetchAllParticipating();
  }
}
