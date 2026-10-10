/**
 * Ejemplo 5: Gestión de grupos y comunidades
 * ---------------------------------------------------------
 */
import { OurinBot } from '../src/index.js';

const bot = new OurinBot({ sessionPath: './session' });

bot.on('open', async () => {
  const groupJid = 'id@g.us';
  const communityJid = 'communityid@g.us';
  const userJid = '628xxx@s.whatsapp.net';

  // --- GRUPOS ---
  const groupMeta = await bot.groups.getMetadata(groupJid);
  console.log('Grupo:', groupMeta.subject, 'participantes:', groupMeta.participants.length);

  const newGroup = await bot.groups.create('Mi Nuevo Grupo', [userJid]);
  console.log('Grupo creado:', newGroup);

  await bot.groups.updateSubject(groupJid, 'Nuevo nombre del grupo');
  await bot.groups.updateDescription(groupJid, 'Nueva descripción');

  // Agregar / quitar / promover / degradar participantes
  await bot.groups.updateParticipants(groupJid, [userJid], 'add');
  await bot.groups.updateParticipants(groupJid, [userJid], 'promote');

  // Solicitudes de ingreso (si el grupo requiere aprobación)
  const requests = await bot.groups.getJoinRequests(groupJid);
  if (requests.length) {
    await bot.groups.updateJoinRequests(groupJid, [requests[0].jid], 'approve');
  }

  // Invitaciones
  const inviteCode = await bot.groups.getInviteCode(groupJid);
  console.log('Código de invitación:', inviteCode);

  // Configuración del grupo
  await bot.groups.updateSetting(groupJid, 'announcement'); // solo admins escriben
  await bot.groups.setMemberAddMode(groupJid, 'admin_add');
  await bot.groups.setJoinApprovalMode(groupJid, 'on');

  // Mensajes temporales (24 horas)
  await bot.groups.toggleEphemeral(groupJid, 86400);

  // Listar todos los grupos donde participa el bot
  const allGroups = await bot.groups.fetchAllParticipating();
  console.log('Total de grupos:', Object.keys(allGroups).length);

  // --- COMUNIDADES ---
  const community = await bot.communities.create('Nuestra Comunidad', 'Descripción de la comunidad');
  console.log('Comunidad creada:', community);

  const subgroup = await bot.communities.createSubgroup('Anuncios', [userJid], communityJid);
  console.log('Subgrupo creado:', subgroup);

  await bot.communities.linkGroup(groupJid, communityJid);

  const linkedGroups = await bot.communities.fetchLinkedGroups(communityJid);
  console.log('Grupos vinculados:', linkedGroups.length);

  const communityInvite = await bot.communities.getInviteCode(communityJid);
  console.log('Invitación de comunidad:', communityInvite);
});

await bot.start();
