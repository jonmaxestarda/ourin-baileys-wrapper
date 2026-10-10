# Referencia exhaustiva de funciones — `ourin-baileys-wrapper`

Este documento complementa al `README.md`. Mientras el README explica la arquitectura y da ejemplos por módulo, **aquí se documenta cada función individual del wrapper, una por una**, con tres partes fijas:

- **Para qué sirve** — explicación en texto simple.
- **Firma** — nombre y parámetros.
- **Ejemplo** — un fragmento de código mínimo y ejecutable.

Nada de lo descrito aquí es funcionalidad nueva: cada función llama directamente al método equivalente, ya existente, de `ourin-baileys`. Este documento es solo el mapa completo de "qué hay y para qué sirve".

> Convención usada en los ejemplos: se asume que ya existe `const bot = new OurinBot({...})` y que, salvo que se indique lo contrario, `await bot.start()` ya se ejecutó y la conexión está abierta (`bot.on('open', ...)`). También se asume `const jid = '628xxx@s.whatsapp.net'` como destinatario de ejemplo.

---

## Índice

1. [Núcleo: `OurinBot`](#1-núcleo-ourinbot)
2. [Eventos de conexión y datos](#2-eventos-de-conexión-y-datos)
3. [`bot.messages` — mensajes básicos](#3-botmessages--mensajes-básicos)
4. [`bot.interactive` — botones, listas y producto](#4-botinteractive--botones-listas-y-producto)
5. [`bot.rich` — respuestas enriquecidas tipo IA](#5-botrich--respuestas-enriquecidas-tipo-ia)
6. [`bot.groups` — grupos](#6-botgroups--grupos)
7. [`bot.communities` — comunidades](#7-botcommunities--comunidades)
8. [`bot.newsletter` — canales](#8-botnewsletter--canales)
9. [`bot.business` — negocio y catálogo](#9-botbusiness--negocio-y-catálogo)
10. [`bot.chatProfile` — chat y perfil](#10-botchatprofile--chat-y-perfil)
11. [`bot.privacy` — privacidad](#11-botprivacy--privacidad)
12. [VoIP — `bot.enableVoip()` / `bot.voipModule`](#12-voip--botenablevoip--botvoipmodule)
13. [`utils.jid` — utilidades de JID](#13-utilsjid--utilidades-de-jid)
14. [`utils.crypto` — primitivas criptográficas](#14-utilscrypto--primitivas-criptográficas)
15. [`utils.codeTools` — tokenización de código](#15-utilscodetools--tokenización-de-código)
16. [`utils.richGenerators` — generadores de contenido crudo](#16-utilsrichgenerators--generadores-de-contenido-crudo)
17. [`utils.stickers` — creación de packs](#17-utilsstickers--creación-de-packs)
18. [Exports sueltos de `OurinBot.js`](#18-exports-sueltos-de-ourinbotjs)

---

## 1. Núcleo: `OurinBot`

### `new OurinBot(options)`
**Para qué sirve:** crea la instancia principal del bot. Configura dónde se guarda la sesión, el nivel de logs, la identidad del navegador que se reporta a WhatsApp y cualquier opción nativa adicional de `makeWASocket`. No conecta nada todavía; solo prepara la configuración.
**Firma:** `new OurinBot({ sessionPath?, logLevel?, browser?, syncFullHistory?, socketOptions?, authState? })`
**Ejemplo:**
```js
import { OurinBot } from './src/index.js';

const bot = new OurinBot({
  sessionPath: './session',
  logLevel: 'silent',
});
```

### `await bot.start()`
**Para qué sirve:** abre la conexión con WhatsApp (WebSocket + protocolo Noise), carga o crea las credenciales, y empieza a emitir eventos. Si la conexión se cae por un motivo distinto a "cierre de sesión", se reconecta sola. Debe llamarse una sola vez al arrancar el bot.
**Firma:** `await bot.start()` → devuelve el socket crudo (`bot.sock`)
**Ejemplo:**
```js
await bot.start();
console.log('Bot iniciado');
```

### `await bot.requestPairingCode(phoneNumber, customCode?)`
**Para qué sirve:** en vez de escanear un código QR, genera un código de 8 caracteres que se introduce manualmente en la app de WhatsApp del teléfono para vincular la sesión. Útil en servidores sin pantalla. Se debe llamar justo cuando la conexión entra en estado `connecting`.
**Firma:** `await bot.requestPairingCode('6281234567890', 'A1B2C3D4'?)`
**Ejemplo:**
```js
bot.on('connecting', async () => {
  const code = await bot.requestPairingCode('6281234567890');
  console.log('Código de emparejamiento:', code);
});
```

### `await bot.enableVoip()`
**Para qué sirve:** activa el motor de llamadas de voz (VoIP) nativo, reutilizando la misma conexión del bot (no requiere un segundo emparejamiento). Debe llamarse una sola vez, después de que la conexión esté abierta.
**Firma:** `await bot.enableVoip()` → devuelve la instancia `VoipClient`
**Ejemplo:**
```js
bot.on('open', async () => {
  const voip = await bot.enableVoip();
  console.log('VoIP listo para usarse');
});
```

### `OurinBot.utils` (estático)
**Para qué sirve:** acceso directo, sin crear instancia, al módulo de utilidades puras (`utils.js`) descrito en las secciones 13 a 17. Es un atajo equivalente a `import { utils } from './src/index.js'`.
**Firma:** `OurinBot.utils` (promesa de módulo)
**Ejemplo:**
```js
const utilsModule = await OurinBot.utils;
console.log(utilsModule.jid.isGroup('123-456@g.us'));
```

---

## 2. Eventos de conexión y datos

`OurinBot` extiende `EventEmitter`, así que se escuchan con `bot.on('evento', callback)`.

### Evento `'qr'`
**Para qué sirve:** se dispara cada vez que hay un código QR nuevo para escanear y vincular la sesión.
**Payload:** `qr: string`
**Ejemplo:**
```js
import qrcode from 'qrcode-terminal';
bot.on('qr', (qr) => qrcode.generate(qr, { small: true }));
```

### Evento `'connecting'`
**Para qué sirve:** avisa que el socket empezó a intentar conectar. Es el momento correcto para pedir un pairing code si no se quiere usar QR.
**Payload:** ninguno
**Ejemplo:**
```js
bot.on('connecting', () => console.log('Conectando...'));
```

### Evento `'open'`
**Para qué sirve:** indica que la conexión quedó establecida y el bot ya puede enviar/recibir mensajes.
**Payload:** `{ isNewLogin, isOnline }`
**Ejemplo:**
```js
bot.on('open', ({ isNewLogin }) => {
  console.log('Conectado. ¿Es un login nuevo?', isNewLogin);
});
```

### Evento `'close'`
**Para qué sirve:** indica que la conexión se cerró, junto con el código de estado y si el wrapper va a reintentar conectar automáticamente.
**Payload:** `{ statusCode, shouldReconnect, error }`
**Ejemplo:**
```js
bot.on('close', ({ statusCode, shouldReconnect }) => {
  console.log('Cerrado. Código:', statusCode, 'Reconectará:', shouldReconnect);
});
```

### Evento `'reconnecting'`
**Para qué sirve:** se emite justo antes de que el wrapper vuelva a llamar internamente a `start()` tras una caída de conexión recuperable.
**Payload:** ninguno
**Ejemplo:**
```js
bot.on('reconnecting', () => console.log('Reintentando conexión...'));
```

### Evento `'loggedOut'`
**Para qué sirve:** indica que la sesión fue cerrada de forma definitiva (ej. el usuario cerró sesión desde el teléfono) y el bot NO va a reconectar solo; hay que volver a vincular (QR o pairing code).
**Payload:** ninguno
**Ejemplo:**
```js
bot.on('loggedOut', () => console.log('Sesión cerrada, vuelve a vincular el bot.'));
```

### Evento `'synced'`
**Para qué sirve:** avisa que ya se recibieron y procesaron todas las notificaciones pendientes que había mientras el bot estaba desconectado.
**Payload:** ninguno
**Ejemplo:**
```js
bot.on('synced', () => console.log('Historial pendiente sincronizado.'));
```

### Evento `'connection.update'`
**Para qué sirve:** evento crudo nativo de Baileys con el detalle completo de cada cambio de estado de conexión, por si los eventos simplificados de arriba no cubren un caso puntual.
**Payload:** objeto completo `update` de Baileys
**Ejemplo:**
```js
bot.on('connection.update', (update) => console.log(update));
```

### Evento `'messages.upsert'`
**Para qué sirve:** se dispara cuando llegan mensajes nuevos (o se insertan mensajes de historial). Es el evento principal para programar comandos de un bot.
**Payload:** `{ messages: Array, type }`
**Ejemplo:**
```js
bot.on('messages.upsert', ({ messages }) => {
  const msg = messages[0];
  if (!msg?.message || msg.key.fromMe) return;
  console.log('Mensaje recibido de', msg.key.remoteJid);
});
```

### Evento `'messages.update'`
**Para qué sirve:** notifica cambios sobre mensajes ya existentes (ej. cuando cambia su estado: enviado, entregado, leído).
**Payload:** array de actualizaciones
**Ejemplo:**
```js
bot.on('messages.update', (updates) => console.log('Actualización de mensajes:', updates));
```

### Evento `'messages.delete'`
**Para qué sirve:** notifica que uno o varios mensajes fueron eliminados.
**Payload:** `keys` (array de claves de mensaje eliminadas)
**Ejemplo:**
```js
bot.on('messages.delete', (keys) => console.log('Mensajes eliminados:', keys));
```

### Evento `'messages.reaction'`
**Para qué sirve:** notifica cuando alguien reacciona (emoji) a un mensaje.
**Payload:** array de reacciones
**Ejemplo:**
```js
bot.on('messages.reaction', (reactions) => console.log('Nueva reacción:', reactions));
```

### Evento `'message-receipt.update'`
**Para qué sirve:** notifica cambios en los recibos de entrega/lectura de mensajes.
**Ejemplo:**
```js
bot.on('message-receipt.update', (updates) => console.log(updates));
```

### Evento `'chats.upsert'` / `'chats.update'` / `'chats.delete'`
**Para qué sirve:** notifican, respectivamente, chats nuevos, cambios en chats existentes (ej. archivado, silenciado) y chats eliminados.
**Ejemplo:**
```js
bot.on('chats.upsert', (chats) => console.log('Chats nuevos:', chats));
bot.on('chats.update', (updates) => console.log('Chats actualizados:', updates));
bot.on('chats.delete', (jids) => console.log('Chats eliminados:', jids));
```

### Evento `'contacts.upsert'` / `'contacts.update'`
**Para qué sirve:** notifican contactos nuevos o cambios en contactos existentes (nombre, foto, etc.).
**Ejemplo:**
```js
bot.on('contacts.upsert', (contacts) => console.log(contacts));
bot.on('contacts.update', (updates) => console.log(updates));
```

### Evento `'messaging-history.set'`
**Para qué sirve:** entrega el historial completo (chats, contactos, mensajes) cuando el bot sincroniza por primera vez o tras un `syncFullHistory`.
**Ejemplo:**
```js
bot.on('messaging-history.set', ({ chats, contacts, messages, isLatest }) => {
  console.log(`Historial: ${chats.length} chats, ${messages.length} mensajes`);
});
```

### Evento `'groups.update'` / `'group-participants.update'` / `'group.join-request'`
**Para qué sirve:** notifican, respectivamente: cambios en la configuración del grupo, cambios de participantes (entra/sale/promovido), y solicitudes de ingreso pendientes de aprobación.
**Ejemplo:**
```js
bot.on('groups.update', (updates) => console.log(updates));
bot.on('group-participants.update', (update) => console.log(update.action, update.participants));
bot.on('group.join-request', (req) => console.log('Solicitud de:', req.participant));
```

### Evento `'call'`
**Para qué sirve:** notifica llamadas entrantes (de voz o video) recibidas en la cuenta.
**Ejemplo:**
```js
bot.on('call', (calls) => console.log('Llamada entrante:', calls));
```

### Evento `'labels.edit'` / `'labels.associations'`
**Para qué sirve:** notifican, respectivamente, cambios en las etiquetas disponibles (crear/editar/borrar etiqueta) y cuándo una etiqueta se asocia o desasocia de un chat/mensaje.
**Ejemplo:**
```js
bot.on('labels.edit', (label) => console.log('Etiqueta editada:', label));
bot.on('labels.associations', (assoc) => console.log(assoc));
```

### Evento `'newsletter.update'` / `'newsletter.follow'` / `'newsletter.unfollow'`
**Para qué sirve:** notifican cambios en canales/newsletters: actualización de metadata, y cuándo el bot empieza o deja de seguir un canal.
**Ejemplo:**
```js
bot.on('newsletter.follow', (jid) => console.log('Siguiendo canal:', jid));
bot.on('newsletter.unfollow', (jid) => console.log('Dejó de seguir:', jid));
```

### Evento `'settings.update'`
**Para qué sirve:** notifica cambios en la configuración general de la cuenta (ej. emoji automático, recibos de lectura).
**Ejemplo:**
```js
bot.on('settings.update', (settings) => console.log(settings));
```

---

## 3. `bot.messages` — mensajes básicos

### `sendText(jid, text, mentions?, options?)`
**Para qué sirve:** envía un mensaje de texto simple, con la opción de mencionar a uno o varios usuarios dentro del texto.
**Ejemplo:**
```js
await bot.messages.sendText(jid, 'Hola mundo!');
await bot.messages.sendText(jid, 'Hola @628xxx!', ['628xxx@s.whatsapp.net']);
```

### `sendImage(jid, urlOrPath, caption?, options?)`
**Para qué sirve:** envía una imagen (desde archivo local o URL) con un pie de foto opcional.
**Ejemplo:**
```js
await bot.messages.sendImage(jid, './photo.jpg', 'Una foto bonita');
```

### `sendVideo(jid, urlOrPath, caption?, gifPlayback?, options?)`
**Para qué sirve:** envía un video; si `gifPlayback` es `true`, WhatsApp lo reproduce en bucle como si fuera un GIF.
**Ejemplo:**
```js
await bot.messages.sendVideo(jid, './video.mp4', 'Mi video', false);
```

### `sendAudio(jid, urlOrPath, ptt?, mimetype?, options?)`
**Para qué sirve:** envía un archivo de audio; con `ptt: true` se envía como nota de voz (con la forma de onda típica de WhatsApp) en vez de un archivo de audio normal.
**Ejemplo:**
```js
await bot.messages.sendAudio(jid, './audio.ogg', true); // nota de voz
```

### `sendSticker(jid, urlOrPath, options?)`
**Para qué sirve:** envía un sticker individual en formato `.webp`.
**Ejemplo:**
```js
await bot.messages.sendSticker(jid, './sticker.webp');
```

### `sendStickerPack(jid, packConfig, options?)`
**Para qué sirve:** crea y envía un pack de stickers completo (varios stickers agrupados, con metadata de nombre/editor), usando el helper nativo `makeStickerPack`.
**Ejemplo:**
```js
await bot.messages.sendStickerPack(jid, {
  name: 'Mi Pack',
  publisher: 'Yo',
  stickers: [{ url: './1.webp', emojis: ['🔥'] }],
});
```

### `sendDocument(jid, urlOrPath, fileName, mimetype?, options?)`
**Para qué sirve:** envía cualquier archivo (PDF, Word, ZIP, etc.) como documento adjunto.
**Ejemplo:**
```js
await bot.messages.sendDocument(jid, './file.pdf', 'informe.pdf', 'application/pdf');
```

### `react(key, emoji, options?)`
**Para qué sirve:** reacciona con un emoji a un mensaje ya recibido. Pasar `''` como emoji quita la reacción.
**Ejemplo:**
```js
bot.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  await bot.messages.react(msg.key, '👍');
});
```

### `sendLocation(jid, degreesLatitude, degreesLongitude, name?, options?)`
**Para qué sirve:** envía una ubicación geográfica con coordenadas y un nombre descriptivo.
**Ejemplo:**
```js
await bot.messages.sendLocation(jid, -6.2, 106.8, 'Jakarta');
```

### `sendContact(jid, displayName, vcards, options?)`
**Para qué sirve:** envía una o varias tarjetas de contacto en formato vCard.
**Ejemplo:**
```js
await bot.messages.sendContact(jid, 'Contactos', [
  'BEGIN:VCARD\nVERSION:3.0\nFN:John\nTEL:+628xxx\nEND:VCARD',
]);
```

### `sendPoll(jid, name, values, selectableCount?, options?)`
**Para qué sirve:** crea una encuesta con varias opciones; `selectableCount` define cuántas opciones puede marcar cada votante.
**Ejemplo:**
```js
await bot.messages.sendPoll(jid, '¿Cuál prefieres?', ['Opción A', 'Opción B'], 1);
```

### `forward(jid, message, forwardingScore?, options?)`
**Para qué sirve:** reenvía un mensaje ya recibido a otro chat, marcándolo como "reenviado".
**Ejemplo:**
```js
bot.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  await bot.messages.forward(jid, msg, 1);
});
```

### `delete(key)`
**Para qué sirve:** elimina (borra para todos) un mensaje previamente enviado, usando su clave (`key`).
**Ejemplo:**
```js
const sent = await bot.messages.sendText(jid, 'Mensaje temporal');
await bot.messages.delete(sent.key);
```

### `edit(key, newText)`
**Para qué sirve:** edita el texto de un mensaje ya enviado.
**Ejemplo:**
```js
const sent = await bot.messages.sendText(jid, 'Texto original');
await bot.messages.edit(sent.key, 'Texto editado');
```

### `sendAlbum(jid, items, options?)`
**Para qué sirve:** envía varias imágenes y/o videos agrupados como un álbum, en vez de mensajes sueltos.
**Ejemplo:**
```js
await bot.messages.sendAlbum(jid, [
  { image: { url: './foto1.jpg' }, caption: 'Primera' },
  { video: { url: './clip.mp4' }, caption: 'Video' },
]);
```

### `requestPayment(jid, amount, currency, note, from, options?)`
**Para qué sirve:** envía un mensaje de solicitud de pago con monto, moneda y una nota descriptiva.
**Ejemplo:**
```js
await bot.messages.requestPayment(jid, 50000, 'IDR', 'Pago del pedido #123', jid);
```

### `sendEvent(jid, eventConfig, options?)`
**Para qué sirve:** envía un mensaje de evento (nombre, descripción, fecha de inicio/fin y ubicación opcional).
**Ejemplo:**
```js
await bot.messages.sendEvent(jid, {
  name: 'Encuentro mensual',
  description: 'Reunión de la comunidad',
  startTime: Date.now() + 86400000,
  endTime: Date.now() + 90000000,
});
```

### `sendPollResult(jid, name, pollVotes, options?)`
**Para qué sirve:** envía un "resumen" de resultados de una encuesta (no la encuesta en sí, sino su resultado final ya contado).
**Ejemplo:**
```js
await bot.messages.sendPollResult(jid, '¿Color favorito?', [
  { optionName: 'Rojo', optionVoteCount: 42 },
  { optionName: 'Azul', optionVoteCount: 38 },
]);
```

---

## 4. `bot.interactive` — botones, listas y producto

### `sendButtons(jid, config, options?)`
**Para qué sirve:** envía un mensaje con botones de flujo nativo de WhatsApp (respuesta rápida, enlace externo, copiar código), con título, encabezado, imagen y pie de página opcionales.
**Ejemplo:**
```js
await bot.interactive.sendButtons(jid, {
  title: 'Bienvenido!',
  header: 'Elige una opción',
  footer: 'Powered by Ourin',
  buttons: [
    bot.interactive.quickReplyButton('Menú', 'menu'),
    bot.interactive.urlButton('Sitio web', 'https://example.com'),
  ],
});
```

### `quickReplyButton(displayText, id)`
**Para qué sirve:** helper que arma un botón de "respuesta rápida" (al tocarlo, se envía un texto/id de vuelta al bot) sin tener que escribir el `JSON.stringify` manualmente.
**Ejemplo:**
```js
const boton = bot.interactive.quickReplyButton('Ver menú', 'menu');
```

### `urlButton(displayText, url)`
**Para qué sirve:** helper que arma un botón que abre un enlace externo al tocarlo.
**Ejemplo:**
```js
const boton = bot.interactive.urlButton('Visitar sitio', 'https://example.com');
```

### `copyButton(displayText, copyCode)`
**Para qué sirve:** helper que arma un botón que copia un código/texto al portapapeles del usuario al tocarlo.
**Ejemplo:**
```js
const boton = bot.interactive.copyButton('Copiar cupón', 'OURIN2024');
```

### `sendListMenu(jid, config, options?)`
**Para qué sirve:** envía un menú desplegable (lista de selección única) organizado en secciones, ideal para menús de comandos de un bot.
**Ejemplo:**
```js
await bot.interactive.sendListMenu(jid, {
  title: 'Selecciona categoría',
  menuTitle: 'Ver opciones',
  sections: [
    { title: 'Juegos', rows: [{ title: 'Quiz', id: '.quiz' }] },
  ],
});
```

### `sendProduct(jid, productConfig, options?)`
**Para qué sirve:** envía una tarjeta de producto de catálogo (nombre, precio, imagen, botón de compra) dentro del chat.
**Ejemplo:**
```js
await bot.interactive.sendProduct(jid, {
  title: 'Audífonos Inalámbricos',
  priceAmount1000: 299000,
  currencyCode: 'IDR',
  thumbnail: { url: 'https://example.com/foto.jpg' },
});
```

---

## 5. `bot.rich` — respuestas enriquecidas tipo IA

### `sendTable(jid, title, headers, rows, quoted, opts?)`
**Para qué sirve:** envía una tabla simple con encabezados y filas de datos, con estilo similar a las respuestas de un asistente de IA (versión 1, básica).
**Ejemplo:**
```js
await bot.rich.sendTable(jid, 'Comparación', ['Feature', 'A', 'B'],
  [['Velocidad', 'Rápido', 'Lento']], quotedMsg, { footer: 'Listo!' });
```

### `sendList(jid, title, rows, quoted, opts?)`
**Para qué sirve:** envía una lista de pares clave-valor (sin encabezados de columna), útil para mostrar datos tipo "ficha técnica".
**Ejemplo:**
```js
await bot.rich.sendList(jid, 'Info del Bot',
  [['Nombre', 'Ourin AI'], ['Versión', '2.4.0']], quotedMsg);
```

### `sendCodeBlock(jid, code, quoted, opts?)`
**Para qué sirve:** envía un bloque de código con resaltado de sintaxis básico (solo javascript, typescript o python).
**Ejemplo:**
```js
await bot.rich.sendCodeBlock(jid, 'console.log("Hola")', quotedMsg, { language: 'javascript' });
```

### `sendTableV2(jid, table, quoted, opts?)`
**Para qué sirve:** igual que `sendTable`, pero con el formato "unificado" más moderno (estilo Meta AI), aceptando el contenido como un array de strings con delimitadores (`|` para columnas, `;;` para filas).
**Ejemplo:**
```js
await bot.rich.sendTableV2(jid, [
  'Comparación',
  'Feature | A | B',
  'Velocidad | Rápido | Lento',
], quotedMsg);
```

### `sendCodeBlockV2(jid, code, quoted, opts?)`
**Para qué sirve:** igual que `sendCodeBlock`, pero soporta 6 familias de lenguajes (javascript/typescript, python, go, lua, bash) con resaltado más completo.
**Ejemplo:**
```js
await bot.rich.sendCodeBlockV2(jid, 'fmt.Println("Hola")', quotedMsg, { language: 'go' });
```

### `sendLink(jid, text, urls, quoted, opts?)`
**Para qué sirve:** envía texto con enlaces incrustados en puntos específicos (usando placeholders `{{IE_0}}texto{{/IE_0}}`), con posibilidad de añadir citas y pruebas de verificación.
**Ejemplo:**
```js
await bot.rich.sendLink(jid,
  'Resultado: {{IE_0}}clic aquí{{/IE_0}}',
  ['https://example.com'], quotedMsg);
```

### `sendLinkV2(jid, text, links, quoted, opts?)`
**Para qué sirve:** variante de `sendLink` con estilo "resultado de búsqueda", donde cada enlace lleva metadata adicional (nombre de la fuente, subtítulo).
**Ejemplo:**
```js
await bot.rich.sendLinkV2(jid, 'Más info: {{IE_0}}Docs{{/IE_0}}',
  [{ url: 'https://npmjs.com', displayName: 'Docs', sourceDisplayName: 'npm' }], quotedMsg);
```

### `sendRichMessage(jid, subMessages, quoted, opts?)`
**Para qué sirve:** arma un solo mensaje que combina varios bloques distintos (texto + tabla + código, por ejemplo), cada uno definido como un "submensaje" con su propio tipo.
**Ejemplo:**
```js
await bot.rich.sendRichMessage(jid, [
  { messageType: 2, messageText: 'Información:' },
  { messageType: 4, tableMetadata: { title: 'Stats', rows: [{ items: ['A', 'B'] }] } },
], quotedMsg);
```

### `builder()`
**Para qué sirve:** devuelve una instancia encadenable (`ORich`) para construir una respuesta tipo IA paso a paso (texto, sugerencias, etc.) antes de enviarla.
**Ejemplo:**
```js
const respuesta = bot.rich.builder()
  .addText('Hola desde ORich!')
  .addSuggest(['Cuéntame más', 'Siguiente']);
await respuesta.send(jid);
```

---

## 6. `bot.groups` — grupos

### `getMetadata(groupJid)`
**Para qué sirve:** obtiene toda la información de un grupo: nombre, descripción, lista de participantes, configuración, etc.
**Ejemplo:**
```js
const info = await bot.groups.getMetadata('id@g.us');
console.log(info.subject, info.participants.length);
```

### `create(subject, participantJids)`
**Para qué sirve:** crea un grupo nuevo con un nombre y una lista inicial de participantes.
**Ejemplo:**
```js
const grupo = await bot.groups.create('Mi Grupo', ['628xxx@s.whatsapp.net']);
```

### `leave(groupJid)`
**Para qué sirve:** hace que el bot abandone un grupo.
**Ejemplo:**
```js
await bot.groups.leave('id@g.us');
```

### `updateSubject(groupJid, newSubject)`
**Para qué sirve:** cambia el nombre (asunto) de un grupo.
**Ejemplo:**
```js
await bot.groups.updateSubject('id@g.us', 'Nuevo nombre del grupo');
```

### `updateDescription(groupJid, newDescription)`
**Para qué sirve:** cambia la descripción de un grupo.
**Ejemplo:**
```js
await bot.groups.updateDescription('id@g.us', 'Nueva descripción del grupo');
```

### `updateParticipants(groupJid, participantJids, action)`
**Para qué sirve:** agrega, elimina, promueve a admin o degrada a participantes de un grupo, según la acción indicada (`'add'`, `'remove'`, `'promote'`, `'demote'`).
**Ejemplo:**
```js
await bot.groups.updateParticipants('id@g.us', ['628xxx@s.whatsapp.net'], 'promote');
```

### `getJoinRequests(groupJid)`
**Para qué sirve:** obtiene la lista de solicitudes de ingreso pendientes de aprobación (cuando el grupo tiene activada la aprobación manual).
**Ejemplo:**
```js
const solicitudes = await bot.groups.getJoinRequests('id@g.us');
```

### `updateJoinRequests(groupJid, participantJids, action)`
**Para qué sirve:** aprueba o rechaza solicitudes de ingreso pendientes (`'approve'` o `'reject'`).
**Ejemplo:**
```js
await bot.groups.updateJoinRequests('id@g.us', ['628xxx@s.whatsapp.net'], 'approve');
```

### `getInviteCode(groupJid)`
**Para qué sirve:** obtiene el código de invitación actual del grupo (el que se usa en el enlace `chat.whatsapp.com/XXXX`).
**Ejemplo:**
```js
const code = await bot.groups.getInviteCode('id@g.us');
```

### `revokeInvite(groupJid)`
**Para qué sirve:** invalida el código de invitación actual y genera uno nuevo (útil si el enlace se filtró).
**Ejemplo:**
```js
await bot.groups.revokeInvite('id@g.us');
```

### `acceptInvite(inviteCode)`
**Para qué sirve:** hace que el bot se una a un grupo usando un código de invitación.
**Ejemplo:**
```js
await bot.groups.acceptInvite('ABCDE12345');
```

### `getInviteInfo(inviteCode)`
**Para qué sirve:** consulta información de un grupo a partir de su código de invitación, sin necesidad de unirse.
**Ejemplo:**
```js
const info = await bot.groups.getInviteInfo('ABCDE12345');
```

### `updateSetting(groupJid, setting)`
**Para qué sirve:** cambia quién puede escribir o editar la info del grupo (`'announcement'` = solo admins escriben, `'not_announcement'` = todos escriben, `'locked'`/`'unlocked'` = quién edita nombre/foto/descripción).
**Ejemplo:**
```js
await bot.groups.updateSetting('id@g.us', 'announcement');
```

### `setMemberAddMode(groupJid, mode)`
**Para qué sirve:** controla quién puede agregar nuevos miembros directamente (`'admin_add'` o `'all_member_add'`).
**Ejemplo:**
```js
await bot.groups.setMemberAddMode('id@g.us', 'admin_add');
```

### `setJoinApprovalMode(groupJid, mode)`
**Para qué sirve:** activa o desactiva (`'on'`/`'off'`) que las nuevas solicitudes de ingreso necesiten aprobación manual de un admin.
**Ejemplo:**
```js
await bot.groups.setJoinApprovalMode('id@g.us', 'on');
```

### `toggleEphemeral(groupJid, durationSeconds)`
**Para qué sirve:** activa mensajes temporales (que se autodestruyen) con una duración en segundos, o los desactiva pasando `0`.
**Ejemplo:**
```js
await bot.groups.toggleEphemeral('id@g.us', 86400); // 24 horas
```

### `fetchAllParticipating()`
**Para qué sirve:** obtiene la lista de todos los grupos en los que el bot participa actualmente.
**Ejemplo:**
```js
const grupos = await bot.groups.fetchAllParticipating();
console.log('Total de grupos:', Object.keys(grupos).length);
```

### `updateMemberLabel(groupJid, label)`
**Para qué sirve:** actualiza la etiqueta visual de un miembro dentro del grupo.
**Ejemplo:**
```js
await bot.groups.updateMemberLabel('id@g.us', 'VIP');
```

---

## 7. `bot.communities` — comunidades

### `getMetadata(communityJid)`
**Para qué sirve:** obtiene la información completa de una comunidad (nombre, descripción, grupos vinculados, etc.).
**Ejemplo:**
```js
const info = await bot.communities.getMetadata('communityid@g.us');
```

### `create(subject, description)`
**Para qué sirve:** crea una comunidad nueva (un contenedor que agrupa varios grupos).
**Ejemplo:**
```js
const comunidad = await bot.communities.create('Nuestra Comunidad', 'Descripción');
```

### `createSubgroup(subject, participantJids, communityJid)`
**Para qué sirve:** crea un grupo nuevo directamente dentro de una comunidad existente.
**Ejemplo:**
```js
const subgrupo = await bot.communities.createSubgroup('Anuncios', ['628xxx@s.whatsapp.net'], 'communityid@g.us');
```

### `linkGroup(groupJid, communityJid)`
**Para qué sirve:** vincula un grupo ya existente a una comunidad.
**Ejemplo:**
```js
await bot.communities.linkGroup('id@g.us', 'communityid@g.us');
```

### `unlinkGroup(groupJid, communityJid)`
**Para qué sirve:** desvincula un grupo de una comunidad (el grupo sigue existiendo, pero deja de pertenecer a la comunidad).
**Ejemplo:**
```js
await bot.communities.unlinkGroup('id@g.us', 'communityid@g.us');
```

### `fetchLinkedGroups(communityJid)`
**Para qué sirve:** obtiene la lista de todos los grupos vinculados a una comunidad.
**Ejemplo:**
```js
const vinculados = await bot.communities.fetchLinkedGroups('communityid@g.us');
```

### `getInviteCode(communityJid)` / `revokeInvite(communityJid)` / `acceptInvite(inviteCode)` / `getInviteInfo(inviteCode)`
**Para qué sirve:** gestionan la invitación de la comunidad: obtener el código actual, invalidarlo, unirse con un código, o consultar info sin unirse (mismo comportamiento que en grupos, pero a nivel comunidad).
**Ejemplo:**
```js
const code = await bot.communities.getInviteCode('communityid@g.us');
await bot.communities.acceptInvite(code);
```

### `getJoinRequests(communityJid)` / `updateJoinRequests(communityJid, jids, action)`
**Para qué sirve:** consultan y aprueban/rechazan solicitudes de ingreso a la comunidad.
**Ejemplo:**
```js
const solicitudes = await bot.communities.getJoinRequests('communityid@g.us');
await bot.communities.updateJoinRequests('communityid@g.us', ['628xxx@s.whatsapp.net'], 'approve');
```

### `updateParticipants(communityJid, participantJids, action)`
**Para qué sirve:** agrega, elimina, promueve o degrada participantes directamente a nivel de comunidad.
**Ejemplo:**
```js
await bot.communities.updateParticipants('communityid@g.us', ['628xxx@s.whatsapp.net'], 'add');
```

### `updateSubject(communityJid, subject)` / `updateDescription(communityJid, description)`
**Para qué sirve:** cambian el nombre o la descripción de la comunidad.
**Ejemplo:**
```js
await bot.communities.updateSubject('communityid@g.us', 'Nuevo nombre');
```

### `toggleEphemeral(communityJid, durationSeconds)`
**Para qué sirve:** activa/desactiva mensajes temporales a nivel de comunidad.
**Ejemplo:**
```js
await bot.communities.toggleEphemeral('communityid@g.us', 86400);
```

### `updateSetting(communityJid, setting)`
**Para qué sirve:** igual que en grupos, pero para la comunidad (`'announcement'`, `'not_announcement'`, `'locked'`, `'unlocked'`).
**Ejemplo:**
```js
await bot.communities.updateSetting('communityid@g.us', 'announcement');
```

### `setMemberAddMode(communityJid, mode)` / `setJoinApprovalMode(communityJid, mode)`
**Para qué sirve:** controlan quién puede agregar miembros y si se requiere aprobación manual, a nivel comunidad.
**Ejemplo:**
```js
await bot.communities.setMemberAddMode('communityid@g.us', 'admin_add');
await bot.communities.setJoinApprovalMode('communityid@g.us', 'on');
```

### `leave(communityJid)`
**Para qué sirve:** hace que el bot abandone la comunidad.
**Ejemplo:**
```js
await bot.communities.leave('communityid@g.us');
```

### `fetchAllParticipating()`
**Para qué sirve:** obtiene todas las comunidades en las que el bot participa actualmente.
**Ejemplo:**
```js
const comunidades = await bot.communities.fetchAllParticipating();
```

---

## 8. `bot.newsletter` — canales

### `resolveUrl(channelUrl)`
**Para qué sirve:** convierte un enlace de canal (`https://whatsapp.com/channel/xxxxx`) en su metadata completa (nombre, suscriptores, id, etc.).
**Ejemplo:**
```js
const info = await bot.newsletter.resolveUrl('https://whatsapp.com/channel/xxxxx');
console.log(info.name, info.subscribers);
```

### `followMultiple(spaceSeparatedJids)`
**Para qué sirve:** sigue varios canales a la vez, pasando sus JIDs separados por espacio en un solo string.
**Ejemplo:**
```js
await bot.newsletter.followMultiple('id1@newsletter id2@newsletter');
```

### `fetchAllSubscribed()`
**Para qué sirve:** obtiene la lista completa de canales a los que el bot está suscrito.
**Ejemplo:**
```js
const canales = await bot.newsletter.fetchAllSubscribed();
```

### `action(jid, actionType)`
**Para qué sirve:** ejecuta una acción genérica sobre un canal: `'follow'`, `'unfollow'`, `'mute'` o `'unmute'`.
**Ejemplo:**
```js
await bot.newsletter.action('id@newsletter', 'mute');
```

### `create(name, description)`
**Para qué sirve:** crea un canal (newsletter) nuevo.
**Ejemplo:**
```js
const canal = await bot.newsletter.create('Mi Canal', 'Descripción del canal');
```

### `update(jid, updates)`
**Para qué sirve:** actualiza varios campos del canal a la vez (ej. nombre y descripción juntos).
**Ejemplo:**
```js
await bot.newsletter.update('id@newsletter', { name: 'Nuevo Nombre' });
```

### `getSubscriberCount(jid)`
**Para qué sirve:** obtiene el número actual de suscriptores de un canal.
**Ejemplo:**
```js
const { subscribers } = await bot.newsletter.getSubscriberCount('id@newsletter');
```

### `getMetadata(jid, newsletterJid)`
**Para qué sirve:** obtiene la metadata completa de un canal visto desde la perspectiva de un JID concreto.
**Ejemplo:**
```js
const meta = await bot.newsletter.getMetadata(jid, 'id@newsletter');
```

### `follow(jid)` / `unfollow(jid)`
**Para qué sirve:** empieza o deja de seguir un canal específico.
**Ejemplo:**
```js
await bot.newsletter.follow('id@newsletter');
await bot.newsletter.unfollow('id@newsletter');
```

### `mute(jid)` / `unmute(jid)`
**Para qué sirve:** silencia o reactiva las notificaciones de un canal sin dejar de seguirlo.
**Ejemplo:**
```js
await bot.newsletter.mute('id@newsletter');
```

### `updateName(jid, name)` / `updateDescription(jid, description)`
**Para qué sirve:** cambia el nombre o la descripción de un canal por separado.
**Ejemplo:**
```js
await bot.newsletter.updateName('id@newsletter', 'Canal Renovado');
```

### `updatePicture(jid, mediaUpload)` / `removePicture(jid)`
**Para qué sirve:** cambia o elimina la foto de perfil del canal.
**Ejemplo:**
```js
await bot.newsletter.updatePicture('id@newsletter', mediaUpload);
```

### `reactToMessage(jid, serverId, emoji)`
**Para qué sirve:** reacciona con un emoji a una publicación concreta del canal.
**Ejemplo:**
```js
await bot.newsletter.reactToMessage('id@newsletter', serverId, '👍');
```

### `fetchMessages(jid, count, since, after)`
**Para qué sirve:** obtiene el historial de publicaciones de un canal.
**Ejemplo:**
```js
const posts = await bot.newsletter.fetchMessages('id@newsletter', 50, 0, 0);
```

### `getAdminCount(jid)`
**Para qué sirve:** obtiene el número de administradores de un canal.
**Ejemplo:**
```js
const count = await bot.newsletter.getAdminCount('id@newsletter');
```

### `changeOwner(jid, newOwnerJid)`
**Para qué sirve:** transfiere la propiedad del canal a otro usuario.
**Ejemplo:**
```js
await bot.newsletter.changeOwner('id@newsletter', '628xxx@s.whatsapp.net');
```

### `demote(jid, userJid)`
**Para qué sirve:** quita el rol de administrador a un usuario del canal.
**Ejemplo:**
```js
await bot.newsletter.demote('id@newsletter', '628xxx@s.whatsapp.net');
```

### `delete(jid)`
**Para qué sirve:** elimina un canal de forma permanente.
**Ejemplo:**
```js
await bot.newsletter.delete('id@newsletter');
```

---

## 9. `bot.business` — negocio y catálogo

### `getCatalog(opts)`
**Para qué sirve:** obtiene la lista de productos del catálogo de una cuenta de negocio, con paginación.
**Ejemplo:**
```js
const { products, nextPageCursor } = await bot.business.getCatalog({ jid: '628xxx@s.whatsapp.net', limit: 10 });
```

### `getCollections(jid, limit)`
**Para qué sirve:** obtiene las colecciones (categorías) de productos de una cuenta de negocio.
**Ejemplo:**
```js
const { collections } = await bot.business.getCollections('628xxx@s.whatsapp.net', 10);
```

### `getOrderDetails(orderId, tokenBase64)`
**Para qué sirve:** obtiene el detalle de un pedido realizado a través del catálogo.
**Ejemplo:**
```js
const pedido = await bot.business.getOrderDetails(orderId, tokenBase64);
```

### `createProduct(productData)`
**Para qué sirve:** crea un producto nuevo en el catálogo del negocio.
**Ejemplo:**
```js
const producto = await bot.business.createProduct({
  name: 'Paquete Premium', price: 150000, currency: 'IDR', originCountryCode: 'ID',
});
```

### `updateProduct(productId, updates)`
**Para qué sirve:** actualiza los datos de un producto ya existente.
**Ejemplo:**
```js
await bot.business.updateProduct(producto.id, { price: 175000 });
```

### `deleteProducts(productIds)`
**Para qué sirve:** elimina uno o varios productos del catálogo a la vez.
**Ejemplo:**
```js
await bot.business.deleteProducts([producto.id]);
```

### `updateProfile(profileData)`
**Para qué sirve:** actualiza los datos del perfil de negocio: dirección, descripción, sitios web, correo, horarios de atención.
**Ejemplo:**
```js
await bot.business.updateProfile({ address: 'Jakarta, Indonesia', email: 'hola@example.com' });
```

### `updateCoverPhoto(mediaUpload)` / `removeCoverPhoto(coverId)`
**Para qué sirve:** cambia o elimina la foto de portada mostrada en el catálogo.
**Ejemplo:**
```js
await bot.business.updateCoverPhoto(mediaUpload);
```

### `addOrEditQuickReply(quickReplyData)`
**Para qué sirve:** crea o edita una "respuesta rápida" (atajo de texto, ej. escribir `/hola` envía un mensaje predefinido).
**Ejemplo:**
```js
await bot.business.addOrEditQuickReply({ shortcut: 'hola', message: 'Hola desde la cuenta de negocio' });
```

### `removeQuickReply(timestamp)`
**Para qué sirve:** elimina una respuesta rápida existente, identificada por su timestamp.
**Ejemplo:**
```js
await bot.business.removeQuickReply(timestamp);
```

### `getBusinessProfile(jid)`
**Para qué sirve:** obtiene el perfil de negocio público de un contacto (si tiene cuenta de WhatsApp Business).
**Ejemplo:**
```js
const perfil = await bot.business.getBusinessProfile('628xxx@s.whatsapp.net');
```

---

## 10. `bot.chatProfile` — chat y perfil

### `getProfilePictureUrl(jid, type?)`
**Para qué sirve:** obtiene la URL de la foto de perfil de un contacto o grupo. `type` puede ser `'image'` (completa) o `'preview'` (miniatura).
**Ejemplo:**
```js
const url = await bot.chatProfile.getProfilePictureUrl(jid, 'image');
```

### `updateProfilePicture(jid, mediaUpload)` / `removeProfilePicture(jid)`
**Para qué sirve:** cambia o elimina la foto de perfil propia o de un grupo.
**Ejemplo:**
```js
await bot.chatProfile.updateProfilePicture(jid, mediaUpload);
```

### `updateProfileName(name)`
**Para qué sirve:** cambia el nombre de perfil visible del propio bot.
**Ejemplo:**
```js
await bot.chatProfile.updateProfileName('Mi Bot');
```

### `updateProfileStatus(status)`
**Para qué sirve:** cambia el mensaje de estado ("about") del propio bot.
**Ejemplo:**
```js
await bot.chatProfile.updateProfileStatus('Disponible 24/7');
```

### `sendPresenceUpdate(presence, jid)`
**Para qué sirve:** indica a un chat que el bot está "escribiendo", "grabando audio", "en línea", etc.
**Ejemplo:**
```js
await bot.chatProfile.sendPresenceUpdate('composing', jid);
```

### `presenceSubscribe(jid)`
**Para qué sirve:** se suscribe para recibir actualizaciones de presencia (en línea / última vez) de un contacto.
**Ejemplo:**
```js
await bot.chatProfile.presenceSubscribe(jid);
```

### `readMessages(keys)`
**Para qué sirve:** marca uno o varios mensajes como leídos (doble check azul).
**Ejemplo:**
```js
await bot.chatProfile.readMessages([msg.key]);
```

### `sendReceipt(jid, participant, msgIds, type?)`
**Para qué sirve:** envía manualmente un recibo de lectura/entrega para mensajes específicos.
**Ejemplo:**
```js
await bot.chatProfile.sendReceipt(jid, participant, [msgId], 'read');
```

### `updateBlockStatus(jid, action)`
**Para qué sirve:** bloquea o desbloquea a un contacto (`'block'` / `'unblock'`).
**Ejemplo:**
```js
await bot.chatProfile.updateBlockStatus(jid, 'block');
```

### `fetchBlocklist()`
**Para qué sirve:** obtiene la lista completa de contactos bloqueados.
**Ejemplo:**
```js
const bloqueados = await bot.chatProfile.fetchBlocklist();
```

### `modifyChat(jid, modification)`
**Para qué sirve:** aplica modificaciones a un chat: archivar, fijar, silenciar, marcar como leído, etc.
**Ejemplo:**
```js
await bot.chatProfile.modifyChat(jid, { archive: true, lastMessageOrig: msg, lastMessage: msg });
```

### `star(jid, messageRefs, starValue?)`
**Para qué sirve:** marca o desmarca mensajes como "destacados" (con estrella).
**Ejemplo:**
```js
await bot.chatProfile.star(jid, [{ id: msgId, fromMe: true }], true);
```

### `addOrEditContact(jid, contactData)` / `removeContact(jid)`
**Para qué sirve:** agrega/edita un contacto en la agenda del bot, o lo elimina.
**Ejemplo:**
```js
await bot.chatProfile.addOrEditContact(jid, { displayName: 'Juan Pérez' });
```

### `addChatLabel(jid, labelId)` / `removeChatLabel(jid, labelId)`
**Para qué sirve:** asigna o quita una etiqueta a un chat completo (requiere cuenta Business con etiquetas).
**Ejemplo:**
```js
await bot.chatProfile.addChatLabel(jid, labelId);
```

### `addMessageLabel(jid, messageId, labelId)`
**Para qué sirve:** asigna una etiqueta a un mensaje específico (en vez de al chat completo).
**Ejemplo:**
```js
await bot.chatProfile.addMessageLabel(jid, messageId, labelId);
```

### `resyncAppState(collections, fromScratch?)`
**Para qué sirve:** fuerza una resincronización del estado interno de la app (útil tras errores de desincronización de contactos o configuración).
**Ejemplo:**
```js
await bot.chatProfile.resyncAppState(['regular', 'critical_block'], true);
```

---

## 11. `bot.privacy` — privacidad

### `setLastSeen(value)`
**Para qué sirve:** controla quién puede ver la última vez en línea (`'all'`, `'contacts'`, `'contact_blacklist'`, `'nobody'`).
**Ejemplo:**
```js
await bot.privacy.setLastSeen('contacts');
```

### `setOnline(value)`
**Para qué sirve:** controla quién puede ver cuándo la cuenta está en línea en tiempo real (`'all'` o `'match_last_seen'`).
**Ejemplo:**
```js
await bot.privacy.setOnline('match_last_seen');
```

### `setProfilePicture(value)`
**Para qué sirve:** controla quién puede ver la foto de perfil (`'all'`, `'contacts'`, `'contact_blacklist'`, `'nobody'`).
**Ejemplo:**
```js
await bot.privacy.setProfilePicture('contacts');
```

### `setStatus(value)`
**Para qué sirve:** controla quién puede ver el estado/"about" del perfil.
**Ejemplo:**
```js
await bot.privacy.setStatus('contacts');
```

### `setReadReceipts(value)`
**Para qué sirve:** activa o desactiva el envío de confirmaciones de lectura (doble check azul) a nivel global (`'all'` o `'none'`).
**Ejemplo:**
```js
await bot.privacy.setReadReceipts('all');
```

### `setGroupsAdd(value)`
**Para qué sirve:** controla quién puede agregar la cuenta a grupos sin pedir permiso (`'all'` o `'contacts'`).
**Ejemplo:**
```js
await bot.privacy.setGroupsAdd('contacts');
```

### `setMessages(value)`
**Para qué sirve:** controla quién puede enviar mensajes directos a la cuenta (`'all'`, `'contacts'`, `'nobody'`).
**Ejemplo:**
```js
await bot.privacy.setMessages('contacts');
```

### `setCalls(value)`
**Para qué sirve:** controla quién puede llamar a la cuenta (`'all'`, `'known'`, `'nobody'`).
**Ejemplo:**
```js
await bot.privacy.setCalls('known');
```

### `setDefaultDisappearingMode(seconds)`
**Para qué sirve:** define la duración por defecto de los mensajes temporales para chats nuevos (en segundos; `0` para desactivar).
**Ejemplo:**
```js
await bot.privacy.setDefaultDisappearingMode(86400); // 24 horas
```

### `setDisableLinkPreviews(disabled)`
**Para qué sirve:** activa o desactiva globalmente la generación de vistas previas de enlaces compartidos.
**Ejemplo:**
```js
await bot.privacy.setDisableLinkPreviews(true);
```

---

## 12. VoIP — `bot.enableVoip()` / `bot.voipModule`

### `bot.enableVoip()` (método de `OurinBot`, ver sección 1)
**Para qué sirve:** activa el motor de llamadas de voz nativo, compartiendo el mismo socket del bot (no requiere un segundo emparejamiento). Devuelve la instancia `VoipClient` real (`bot.voip`).
**Ejemplo:**
```js
bot.on('open', async () => {
  const voip = await bot.enableVoip();
});
```

### `voip.call(phoneNumber, options?)` (método nativo de `VoipClient`, usado directamente tras `enableVoip()`)
**Para qué sirve:** realiza una llamada de voz saliente a un número. Devuelve un objeto `call` con eventos (`'ringing'`, `'connected'`, `'ended'`) y un método `waitForEnd()`.
**Ejemplo:**
```js
const voip = await bot.enableVoip();
const call = await voip.call('6281234567890', { durationMs: 60000, audioSource: 'silence' });
call.on('connected', () => console.log('¡Conectado!'));
await call.waitForEnd();
```

### `bot.voipModule.call(voipClient, phoneNumber, options?)`
**Para qué sirve:** wrapper equivalente a `voip.call(...)` de arriba, por si se prefiere acceder a través de `bot.voipModule` en vez de la instancia `voip` directamente. Hace exactamente lo mismo.
**Ejemplo:**
```js
const voip = await bot.enableVoip();
const call = await bot.voipModule.call(voip, '6281234567890');
```

---

## 13. `utils.jid` — utilidades de JID

Un **JID** (Jabber ID) es el identificador único de un chat, grupo, canal o usuario en WhatsApp (ej. `628xxx@s.whatsapp.net`, `id@g.us`, `id@newsletter`). Estas funciones son puras: no requieren conexión activa.

### `jid.encode(user, server, device?, agent?)`
**Para qué sirve:** construye un JID completo a partir de sus partes (usuario, servidor, dispositivo).
**Ejemplo:**
```js
const miJid = utils.jid.encode('628xxx', 's.whatsapp.net');
```

### `jid.decode(jidString)`
**Para qué sirve:** descompone un JID en sus partes (`user`, `server`, `device`, etc.).
**Ejemplo:**
```js
const partes = utils.jid.decode('628xxx@s.whatsapp.net');
console.log(partes.user); // '628xxx'
```

### `jid.normalize(jidString)`
**Para qué sirve:** limpia un JID (quita el sufijo de dispositivo `:n`) para comparar usuarios de forma consistente.
**Ejemplo:**
```js
utils.jid.normalize('628xxx:1@s.whatsapp.net'); // '628xxx@s.whatsapp.net'
```

### `jid.isSameUser(jidA, jidB)`
**Para qué sirve:** compara si dos JIDs pertenecen al mismo usuario, ignorando el dispositivo.
**Ejemplo:**
```js
utils.jid.isSameUser('a:1@s.whatsapp.net', 'a:2@s.whatsapp.net'); // true
```

### `jid.isGroup(jidString)`
**Para qué sirve:** indica si un JID corresponde a un grupo.
**Ejemplo:**
```js
utils.jid.isGroup('123-456@g.us'); // true
```

### `jid.isNewsletter(jidString)`
**Para qué sirve:** indica si un JID corresponde a un canal/newsletter.
**Ejemplo:**
```js
utils.jid.isNewsletter('abc@newsletter'); // true
```

### `jid.isLid(jidString)`
**Para qué sirve:** indica si un JID usa el formato "LID" (identificador alternativo que WhatsApp usa internamente en vez del número de teléfono).
**Ejemplo:**
```js
utils.jid.isLid('123456@lid'); // true
```

### `jid.isPn(jidString)`
**Para qué sirve:** indica si un JID usa el formato tradicional basado en número de teléfono (Phone Number).
**Ejemplo:**
```js
utils.jid.isPn('628xxx@s.whatsapp.net'); // true
```

### `jid.isBot(jidString)`
**Para qué sirve:** indica si un JID corresponde a un bot oficial de WhatsApp/Meta.
**Ejemplo:**
```js
utils.jid.isBot('867051314767696@bot'); // true
```

### `jid.isMetaAI(jidString)`
**Para qué sirve:** indica si un JID corresponde específicamente al asistente Meta AI.
**Ejemplo:**
```js
utils.jid.isMetaAI(algunJid);
```

### `jid.isBroadcast(jidString)`
**Para qué sirve:** indica si un JID es una lista de difusión (broadcast).
**Ejemplo:**
```js
utils.jid.isBroadcast(algunJid);
```

### `jid.isStatusBroadcast(jidString)`
**Para qué sirve:** indica si un JID corresponde específicamente a la difusión de "Estados" (Stories) de WhatsApp.
**Ejemplo:**
```js
utils.jid.isStatusBroadcast('status@broadcast'); // true
```

---

## 14. `utils.crypto` — primitivas criptográficas

Funciones de bajo nivel usadas internamente por el protocolo Signal. Solo son necesarias si se implementa un almacén de claves personalizado o se depura el protocolo de cifrado.

### `crypto.Curve`
**Para qué sirve:** objeto con operaciones de la curva elíptica Curve25519 (generación de claves, cálculo de secretos compartidos), base del cifrado de extremo a extremo.
**Ejemplo:**
```js
const keyPair = utils.crypto.Curve.generateKeyPair();
```

### `crypto.signedKeyPair(identityKeyPair, keyId)`
**Para qué sirve:** genera un par de claves firmado (pre-key firmada), parte del protocolo de intercambio de claves de Signal.
**Ejemplo:**
```js
const signedPreKey = utils.crypto.signedKeyPair(identityKeyPair, 1);
```

### `crypto.aesEncryptGCM(plaintext, key, iv, aad)`
**Para qué sirve:** cifra datos usando AES-256-GCM (el cifrado simétrico usado para proteger mensajes y medios).
**Ejemplo:**
```js
const cifrado = utils.crypto.aesEncryptGCM(buffer, key, iv, aad);
```

### `crypto.aesDecryptGCM(ciphertext, key, iv, aad)`
**Para qué sirve:** descifra datos previamente cifrados con `aesEncryptGCM`.
**Ejemplo:**
```js
const original = utils.crypto.aesDecryptGCM(cifrado, key, iv, aad);
```

---

## 15. `utils.codeTools` — tokenización de código

Son las mismas funciones que usan internamente `bot.rich.sendCodeBlock` y `sendCodeBlockV2` para colorear el código. Útiles si se quiere generar el resaltado manualmente sin enviar el mensaje.

### `codeTools.tokenizeCode(code, language)`
**Para qué sirve:** divide un string de código en tokens clasificados (palabra clave, string, número, comentario...) usando el motor V1 (javascript, typescript, python).
**Ejemplo:**
```js
const tokens = utils.codeTools.tokenizeCode('const x = 1', 'javascript');
```

### `codeTools.tokenizeCodeV2(code, language)`
**Para qué sirve:** igual que `tokenizeCode`, pero con el motor V2 (6 lenguajes: js/ts, python, go, lua, bash) y tipos de token más detallados.
**Ejemplo:**
```js
const tokens = utils.codeTools.tokenizeCodeV2('func main() {}', 'go');
```

### `codeTools.CodeHighlightType`
**Para qué sirve:** objeto/enum con las constantes numéricas de cada tipo de resaltado (`DEFAULT`, `KEYWORD`, `METHOD`, `STRING`, `NUMBER`, `COMMENT`).
**Ejemplo:**
```js
console.log(utils.codeTools.CodeHighlightType.KEYWORD);
```

### `codeTools.RichSubMessageType`
**Para qué sirve:** objeto/enum con los tipos de submensaje usados en `sendRichMessage` (`TEXT`, `TABLE`, `CODE`, `MAP`, `LATEX`, etc.).
**Ejemplo:**
```js
console.log(utils.codeTools.RichSubMessageType.TABLE);
```

### `codeTools.keywords.js` / `.python` / `.go` / `.lua` / `.bash`
**Para qué sirve:** listas de palabras clave reservadas de cada lenguaje, usadas por los tokenizadores para detectar qué resaltar como "keyword".
**Ejemplo:**
```js
console.log(utils.codeTools.keywords.python.includes('def')); // true
```

### `codeTools.keywords.byLanguage`
**Para qué sirve:** mapa que asocia cada nombre/alias de lenguaje (`'js'`, `'ts'`, `'py'`, etc.) con su lista de palabras clave correspondiente.
**Ejemplo:**
```js
const keywords = utils.codeTools.keywords.byLanguage['python'];
```

---

## 16. `utils.richGenerators` — generadores de contenido crudo

Son los generadores de **contenido** (el objeto de datos) usados internamente por `bot.rich.*`, pero sin enviarlo. Útiles si se quiere componer manualmente un `sendRichMessage` personalizado con piezas generadas por separado.

### `richGenerators.table(title, headers, rows, opts)`
**Para qué sirve:** genera el objeto de contenido de una tabla V1, sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.table('Título', ['A', 'B'], [['1', '2']], {});
```

### `richGenerators.tableV2(table, opts)`
**Para qué sirve:** genera el contenido de una tabla V2 (formato unificado), sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.tableV2(['Título', 'A | B', '1 | 2'], {});
```

### `richGenerators.toTableMetadataV2(rawTable)`
**Para qué sirve:** convierte una tabla en formato de strings (título/encabezado/filas) a la estructura de metadata interna que usa la V2.
**Ejemplo:**
```js
const meta = utils.richGenerators.toTableMetadataV2(['Título', 'A | B', '1 | 2']);
```

### `richGenerators.list(title, rows, opts)`
**Para qué sirve:** genera el contenido de una lista clave-valor, sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.list('Info', [['Nombre', 'Bot']], {});
```

### `richGenerators.codeBlock(code, opts)`
**Para qué sirve:** genera el contenido de un bloque de código V1, sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.codeBlock('console.log(1)', { language: 'javascript' });
```

### `richGenerators.codeBlockV2(code, opts)`
**Para qué sirve:** genera el contenido de un bloque de código V2, sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.codeBlockV2('fmt.Println(1)', { language: 'go' });
```

### `richGenerators.link(text, urls, opts)`
**Para qué sirve:** genera el contenido de un mensaje de enlace embebido V1, sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.link('Ver {{IE_0}}aquí{{/IE_0}}', ['https://x.com'], {});
```

### `richGenerators.linkV2(text, links, opts)`
**Para qué sirve:** genera el contenido de un mensaje de enlace V2 (estilo resultado de búsqueda), sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.linkV2('{{IE_0}}Docs{{/IE_0}}', [{ url: 'https://x.com', displayName: 'Docs' }], {});
```

### `richGenerators.richMessage(subMessages, opts)`
**Para qué sirve:** genera el contenido combinado de un mensaje mixto (texto+tabla+código), sin enviarlo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.richMessage([{ messageType: 2, messageText: 'Hola' }], {});
```

### `richGenerators.latex(expression, opts)`
**Para qué sirve:** genera el contenido de un mensaje con una expresión LaTeX renderizada como texto/fórmula.
**Ejemplo:**
```js
const contenido = utils.richGenerators.latex('E = mc^2', {});
```

### `richGenerators.latexImage(expression, opts)`
**Para qué sirve:** genera el contenido de un mensaje LaTeX renderizado como imagen.
**Ejemplo:**
```js
const contenido = utils.richGenerators.latexImage('\\int_0^1 x dx', {});
```

### `richGenerators.latexInlineImage(expression, opts)`
**Para qué sirve:** genera el contenido de una expresión LaTeX renderizada como imagen incrustada dentro del flujo de texto.
**Ejemplo:**
```js
const contenido = utils.richGenerators.latexInlineImage('x^2', {});
```

### `richGenerators.unifiedResponse(sections, opts)`
**Para qué sirve:** genera manualmente una respuesta en el formato "unificado" (el mismo que usan las V2), combinando varias secciones de distinto tipo.
**Ejemplo:**
```js
const contenido = utils.richGenerators.unifiedResponse([{ type: 'text', text: 'Hola' }], {});
```

### `richGenerators.captureUnifiedResponse(...)`
**Para qué sirve:** utilidad interna para capturar/serializar una respuesta unificada ya generada (usada por los helpers V2 internamente).
**Ejemplo:**
```js
const capturado = utils.richGenerators.captureUnifiedResponse(respuestaGenerada);
```

### `richGenerators.buildContextInfo(opts)`
**Para qué sirve:** construye el objeto `contextInfo` enriquecido (score de reenvío, info de bot, etc.) que acompaña a los mensajes rich.
**Ejemplo:**
```js
const contextInfo = utils.richGenerators.buildContextInfo({ forwardingScore: 3 });
```

### `richGenerators.buildBotForwardedMessage(content, opts)`
**Para qué sirve:** envuelve un contenido dentro de la estructura `botForwardedMessage`, necesaria para que WhatsApp reconozca el mensaje como una respuesta de bot/IA.
**Ejemplo:**
```js
const mensaje = utils.richGenerators.buildBotForwardedMessage(contenido, {});
```

---

## 17. `utils.stickers` — creación de packs

### `stickers.makePack(packConfig)`
**Para qué sirve:** construye el objeto de contenido de un pack de stickers completo (nombre, editor, lista de stickers con emojis asociados, portada), listo para pasarlo a `sendMessage`. Es la misma función que usa `bot.messages.sendStickerPack` por dentro.
**Ejemplo:**
```js
const pack = utils.stickers.makePack({
  name: 'Mi Pack',
  publisher: 'Yo',
  stickers: [{ url: './1.webp', emojis: ['🔥'] }],
});
await bot.sock.sendMessage(jid, pack);
```

---

## 18. Exports sueltos de `OurinBot.js`

Estas constantes y funciones se re-exportan directamente desde `src/index.js`, sin pasar por ningún módulo, porque son utilidades de configuración/conexión más que acciones del bot.

### `Browsers`
**Para qué sirve:** objeto con funciones que generan la "identidad de navegador" que el bot reporta a WhatsApp al conectar (`Browsers.ubuntu('Chrome')`, `Browsers.windows('Chrome')`, `Browsers.macOS('Safari')`). Afecta cómo aparece la sesión vinculada en la lista de dispositivos del teléfono.
**Ejemplo:**
```js
import { Browsers } from './src/index.js';
const bot = new OurinBot({ browser: Browsers.windows('Chrome') });
```

### `DisconnectReason`
**Para qué sirve:** objeto con las constantes de los distintos motivos de desconexión (`loggedOut`, `connectionClosed`, `connectionLost`, `badSession`, etc.), útil para inspeccionar `error.output.statusCode` en el evento `'close'`.
**Ejemplo:**
```js
import { DisconnectReason } from './src/index.js';
bot.on('close', ({ statusCode }) => {
  if (statusCode === DisconnectReason.loggedOut) console.log('Cierre de sesión definitivo');
});
```

### `fetchLatestBaileysVersion()`
**Para qué sirve:** consulta cuál es la última versión del protocolo de WhatsApp Web compatible, útil para mantener el bot actualizado y evitar baneos por usar una versión obsoleta.
**Ejemplo:**
```js
import { fetchLatestBaileysVersion } from './src/index.js';
const { version, isLatest } = await fetchLatestBaileysVersion();
console.log(version, isLatest);
```

### `makeCacheableSignalKeyStore(store)`
**Para qué sirve:** envuelve un almacén de claves personalizado (ej. respaldado por Redis o SQL) añadiéndole una capa de caché en memoria, para acelerar el acceso repetido a las mismas claves durante una sesión.
**Ejemplo:**
```js
import { makeCacheableSignalKeyStore } from './src/index.js';
const keys = makeCacheableSignalKeyStore(miAlmacenPersonalizado);
```

### `initAuthCreds()`
**Para qué sirve:** genera un conjunto de credenciales nuevas desde cero (claves de identidad, claves de ruido, etc.), necesario al implementar un almacén de autenticación propio en vez de `useMultiFileAuthState`.
**Ejemplo:**
```js
import { initAuthCreds } from './src/index.js';
const creds = initAuthCreds();
```

### `BufferJSON`
**Para qué sirve:** par de funciones (`replacer`/`reviver`) para serializar y deserializar correctamente objetos `Buffer` dentro de JSON, necesario al guardar/leer credenciales en una base de datos propia.
**Ejemplo:**
```js
import { BufferJSON } from './src/index.js';
const texto = JSON.stringify(credenciales, BufferJSON.replacer);
const credencialesRestauradas = JSON.parse(texto, BufferJSON.reviver);
```

---

## Resumen de cobertura

Este documento cubre **todas** las funciones expuestas por el wrapper:

- 4 métodos del núcleo (`OurinBot`)
- 23 eventos
- 18 métodos de mensajes
- 6 métodos de interactivos
- 9 métodos de rich responses
- 17 métodos de grupos
- 15 métodos de comunidades
- 17 métodos de newsletter
- 11 métodos de negocio
- 17 métodos de chat/perfil
- 10 métodos de privacidad
- 2 métodos de VoIP
- 11 utilidades de JID
- 4 utilidades de criptografía
- 6 utilidades de tokenización de código
- 14 generadores de contenido rich
- 1 utilidad de stickers
- 6 exports sueltos de configuración/conexión

**Total: ~191 puntos de función documentados**, cada uno con su explicación y ejemplo — equivalente 1 a 1 a todo lo descrito en el README original de `ourin-baileys`.
