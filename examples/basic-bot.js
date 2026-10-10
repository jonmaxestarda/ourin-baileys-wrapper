/**
 * Ejemplo 1: Bot básico con QR
 * ---------------------------------------------------------
 * Muestra el ciclo de vida completo: iniciar, mostrar QR, detectar
 * conexión abierta, reaccionar a un comando de texto simple.
 *
 * Ejecutar: node examples/basic-bot.js
 */
import qrcode from 'qrcode-terminal';
import { OurinBot } from '../src/index.js';

const bot = new OurinBot({ sessionPath: './session' });

bot.on('qr', (qr) => {
  console.log('Escanea este QR con WhatsApp:');
  qrcode.generate(qr, { small: true });
});

bot.on('open', () => {
  console.log('✅ Conectado a WhatsApp');
});

bot.on('close', ({ shouldReconnect, statusCode }) => {
  console.log('❌ Conexión cerrada. Código:', statusCode, '¿Reconectar?', shouldReconnect);
});

bot.on('loggedOut', () => {
  console.log('Sesión cerrada por el usuario. Borra la carpeta ./session para reautenticar.');
});

bot.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  if (!msg?.message || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

  if (text === '.ping') {
    await bot.messages.sendText(jid, 'Pong! 🏓');
  }

  if (text === '.menu') {
    // Ejemplo de menú interactivo (ver examples/interactive-and-rich.js para más)
    await bot.interactive.sendListMenu(jid, {
      title: 'Menú principal',
      header: 'Bot de ejemplo',
      footer: 'Elige una opción',
      menuTitle: 'Ver opciones',
      sections: [
        { title: 'General', rows: [{ title: 'Ping', id: '.ping' }] },
      ],
    });
  }
});

await bot.start();
