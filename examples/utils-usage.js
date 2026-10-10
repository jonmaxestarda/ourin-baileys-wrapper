/**
 * Ejemplo 9: Utilidades de bajo nivel (bot.js utils.js)
 * ---------------------------------------------------------
 * No requieren conexión activa — son funciones puras.
 */
import { utils } from '../src/index.js';

const { jid, codeTools } = utils;

// --- JID ---
console.log(jid.isGroup('123-456@g.us'));          // true
console.log(jid.isNewsletter('abc@newsletter'));    // true
console.log(jid.normalize('628xxx:1@s.whatsapp.net')); // '628xxx@s.whatsapp.net'
console.log(jid.isSameUser('a@s.whatsapp.net', 'a@s.whatsapp.net')); // true

const decoded = jid.decode('628xxx@s.whatsapp.net');
console.log(decoded); // { user: '628xxx', server: 's.whatsapp.net', ... }

// --- Tokenización de código (lo que usa sendCodeBlockV2 internamente) ---
const tokens = codeTools.tokenizeCodeV2('const x = 1; // comentario', 'javascript');
console.log(tokens);
