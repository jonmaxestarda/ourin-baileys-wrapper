/**
 * Ejemplo 6: Newsletter (canales), Negocio, Chat/Perfil y Privacidad
 * ---------------------------------------------------------
 */
import { OurinBot } from '../src/index.js';

const bot = new OurinBot({ sessionPath: './session' });

bot.on('open', async () => {
  const userJid = '628xxx@s.whatsapp.net';

  // --- NEWSLETTER (CANALES) ---
  const channelInfo = await bot.newsletter.resolveUrl('https://whatsapp.com/channel/xxxxx');
  console.log('Canal:', channelInfo.name, 'suscriptores:', channelInfo.subscribers);

  const newChannel = await bot.newsletter.create('Mi Canal', 'Descripción del canal');
  console.log('Canal creado:', newChannel);

  await bot.newsletter.follow('id@newsletter');
  await bot.newsletter.updateName('id@newsletter', 'Nuevo nombre');
  const { subscribers } = await bot.newsletter.getSubscriberCount('id@newsletter');
  console.log('Suscriptores:', subscribers);

  // --- NEGOCIO ---
  const { products } = await bot.business.getCatalog({ jid: userJid, limit: 10 });
  console.log('Productos en catálogo:', products.length);

  const product = await bot.business.createProduct({
    name: 'Paquete Premium',
    description: 'Plan premium oficial',
    price: 150000,
    currency: 'IDR',
    originCountryCode: 'ID',
    images: [],
  });
  console.log('Producto creado:', product);

  await bot.business.updateProfile({
    address: 'Jakarta, Indonesia',
    description: 'Tienda oficial',
    websites: ['https://example.com'],
    email: 'hola@example.com',
  });

  // --- CHAT / PERFIL ---
  await bot.chatProfile.updateProfileName('Mi Bot');
  await bot.chatProfile.updateProfileStatus('Disponible 24/7');

  const picUrl = await bot.chatProfile.getProfilePictureUrl(userJid, 'image');
  console.log('Foto de perfil:', picUrl);

  await bot.chatProfile.sendPresenceUpdate('available', userJid);

  // Archivar un chat
  // await bot.chatProfile.modifyChat(userJid, { archive: true, lastMessageOrig: msg, lastMessage: msg });

  // Bloquear / desbloquear
  await bot.chatProfile.updateBlockStatus(userJid, 'block');
  await bot.chatProfile.updateBlockStatus(userJid, 'unblock');

  // --- PRIVACIDAD ---
  await bot.privacy.setLastSeen('contacts');
  await bot.privacy.setOnline('match_last_seen');
  await bot.privacy.setProfilePicture('contacts');
  await bot.privacy.setStatus('contacts');
  await bot.privacy.setReadReceipts('all');
  await bot.privacy.setCalls('known');
});

await bot.start();
