# ourin-baileys-wrapper

Wrapper de alto nivel sobre **[`ourin-baileys`](https://www.npmjs.com/package/ourin-baileys)** (fork modificado de Baileys para WhatsApp).

> 📖 **¿Buscas cada función documentada una por una, con su "para qué sirve" y un ejemplo?**
> Ve directo a [`FUNCTIONS.md`](./FUNCTIONS.md) — cubre las ~195 funciones y eventos del wrapper, método por método, sin omitir ninguno.

> **Importante — Alcance de este proyecto**
> Este wrapper **no añade funcionalidades nuevas** ni **modifica el comportamiento** de `ourin-baileys`.
> Cada método aquí llama, internamente, al método equivalente ya existente en la librería original.
> El único objetivo es **organizar y simplificar el acceso** a todo lo que ya está documentado en el README de `ourin-baileys`, agrupándolo en una clase principal (`OurinBot`) con submódulos claros por dominio.
>
> Si en algún momento necesitas la API cruda, siempre tienes `bot.sock` disponible, que es exactamente el socket que devuelve `makeWASocket()`.

---

## Índice

1. [Instalación](#instalación)
2. [Inicio rápido](#inicio-rápido)
3. [Arquitectura del wrapper](#arquitectura-del-wrapper)
4. [`OurinBot` — núcleo y eventos](#ourinbot--núcleo-y-eventos)
5. [`bot.messages` — mensajes básicos](#botmessages--mensajes-básicos)
6. [`bot.interactive` — botones y listas](#botinteractive--botones-y-listas)
7. [`bot.rich` — respuestas enriquecidas tipo IA](#botrich--respuestas-enriquecidas-tipo-ia)
8. [`bot.groups` — grupos](#botgroups--grupos)
9. [`bot.communities` — comunidades](#botcommunities--comunidades)
10. [`bot.newsletter` — canales](#botnewsletter--canales)
11. [`bot.business` — catálogo y perfil de negocio](#botbusiness--catálogo-y-perfil-de-negocio)
12. [`bot.chatProfile` — chat y perfil](#botchatprofile--chat-y-perfil)
13. [`bot.privacy` — privacidad](#botprivacy--privacidad)
14. [VoIP (llamadas de voz)](#voip-llamadas-de-voz)
15. [`utils` — utilidades de bajo nivel](#utils--utilidades-de-bajo-nivel)
16. [Auth state personalizado (producción)](#auth-state-personalizado-producción)
17. [Tabla de equivalencias (wrapper ↔ API original)](#tabla-de-equivalencias-wrapper--api-original)
18. [Ejemplos incluidos](#ejemplos-incluidos)

---

## Instalación

```bash
npm install
```

Requisitos (heredados de `ourin-baileys`):

- Node.js `>= 20.0.0`
- Proyecto ESM (`"type": "module"` en tu `package.json`, ya configurado aquí)

---

## Inicio rápido

```js
import { OurinBot } from './src/index.js';
import qrcode from 'qrcode-terminal';

const bot = new OurinBot({ sessionPath: './session' });

bot.on('qr', (qr) => qrcode.generate(qr, { small: true }));
bot.on('open', () => console.log('✅ Conectado!'));

bot.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  if (!msg?.message || msg.key.fromMe) return;

  const jid = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

  if (text === '.ping') {
    await bot.messages.sendText(jid, 'Pong!');
  }
});

await bot.start();
```

Ejecuta con:

```bash
node examples/basic-bot.js
```

---

## Arquitectura del wrapper

```
src/
├── OurinBot.js         # Clase principal: conexión, eventos, ciclo de vida
├── utils.js            # Utilidades puras re-exportadas (JID, crypto, tokenizer...)
├── index.js            # Punto de entrada (exports)
└── modules/
    ├── messages.js      → bot.messages      (texto, media, reacciones, polls...)
    ├── interactive.js   → bot.interactive   (botones, listas, producto)
    ├── rich.js          → bot.rich          (tablas, código, enlaces, ORich)
    ├── groups.js        → bot.groups        (CRUD de grupos)
    ├── communities.js   → bot.communities   (CRUD de comunidades)
    ├── newsletter.js     → bot.newsletter    (canales / newsletters)
    ├── business.js       → bot.business      (catálogo, productos, perfil negocio)
    ├── chatProfile.js    → bot.chatProfile    (perfil, presencia, bloqueos, chats)
    ├── privacy.js        → bot.privacy        (ajustes de privacidad)
    └── voip.js           → bot.voipModule     (llamadas de voz)
```

Cada módulo recibe el **socket real** (`sock`) en su constructor y expone métodos con nombres descriptivos que simplemente llaman al método original de `ourin-baileys` con los argumentos en el orden correcto. **No hay lógica de negocio añadida.**

---

## `OurinBot` — núcleo y eventos

### Constructor

```js
new OurinBot(options)
```

| Opción | Tipo | Default | Descripción |
|---|---|---|---|
| `sessionPath` | `string` | `'./session'` | Carpeta para `useMultiFileAuthState` |
| `logLevel` | `string` | `'silent'` | Nivel del logger `pino` |
| `browser` | función | `Browsers.ubuntu('Chrome')` | Identidad de navegador reportada a WhatsApp |
| `syncFullHistory` | `boolean` | `false` | Igual que la opción nativa |
| `socketOptions` | `object` | `{}` | Se mezcla directamente dentro de `makeWASocket()` (acceso a *cualquier* opción nativa no cubierta explícitamente) |
| `authState` | `{state, saveCreds}` | `null` | Si lo pasas, el wrapper NO usa `useMultiFileAuthState` (ver sección de [auth personalizado](#auth-state-personalizado-producción)) |

### `await bot.start()`

Inicia la conexión. Reconecta automáticamente salvo `loggedOut`. Devuelve el socket crudo.

### `await bot.requestPairingCode(numero, [codigoPersonalizado])`

Pide un código de emparejamiento en vez de QR. El `codigoPersonalizado` debe tener exactamente 8 caracteres (igual que en la API original).

### `await bot.enableVoip()`

Activa el motor VoIP nativo (ver [sección VoIP](#voip-llamadas-de-voz)).

### Eventos del `EventEmitter`

`OurinBot` extiende `EventEmitter`. Eventos propios (derivados de `connection.update`):

| Evento | Payload | Cuándo |
|---|---|---|
| `qr` | `qr: string` | Hay un QR nuevo que escanear |
| `connecting` | — | El socket empezó a conectar (momento de pedir pairing code) |
| `open` | `{isNewLogin, isOnline}` | Conexión establecida |
| `close` | `{statusCode, shouldReconnect, error}` | Conexión cerrada |
| `reconnecting` | — | Se va a reintentar la conexión |
| `loggedOut` | — | Cierre de sesión definitivo (no reconecta) |
| `synced` | — | Notificaciones pendientes recibidas (`receivedPendingNotifications`) |

Además, **todos los eventos nativos del socket se reenvían tal cual** (mismo nombre, mismo payload) para quien prefiera escucharlos directamente:

```
'connection.update', 'messaging-history.set', 'chats.upsert', 'chats.update',
'chats.delete', 'contacts.upsert', 'contacts.update', 'messages.upsert',
'messages.update', 'messages.delete', 'messages.reaction',
'message-receipt.update', 'groups.update', 'group-participants.update',
'group.join-request', 'call', 'labels.edit', 'labels.associations',
'newsletter.update', 'newsletter.follow', 'newsletter.unfollow', 'settings.update'
```

> Ver ejemplo completo en [`examples/basic-bot.js`](./examples/basic-bot.js) y [`examples/pairing-code-bot.js`](./examples/pairing-code-bot.js).

---

## `bot.messages` — mensajes básicos

Envoltorio de `sock.sendMessage()` para los tipos de contenido más comunes.

| Método | Equivale a |
|---|---|
| `sendText(jid, text, mentions?, options?)` | `sendMessage(jid, { text, mentions })` |
| `sendImage(jid, urlOrPath, caption?, options?)` | `sendMessage(jid, { image: {url}, caption })` |
| `sendVideo(jid, urlOrPath, caption?, gifPlayback?, options?)` | `sendMessage(jid, { video: {url}, caption, gifPlayback })` |
| `sendAudio(jid, urlOrPath, ptt?, mimetype?, options?)` | `sendMessage(jid, { audio: {url}, mimetype, ptt })` |
| `sendSticker(jid, urlOrPath, options?)` | `sendMessage(jid, { sticker: {url} })` |
| `sendStickerPack(jid, packConfig, options?)` | `sendMessage(jid, makeStickerPack(packConfig))` |
| `sendDocument(jid, urlOrPath, fileName, mimetype?, options?)` | `sendMessage(jid, { document: {url}, fileName, mimetype })` |
| `react(key, emoji, options?)` | `sendMessage(jid, { react: {key, text: emoji} })` |
| `sendLocation(jid, lat, lng, name?, options?)` | `sendMessage(jid, { location: {...} })` |
| `sendContact(jid, displayName, vcards[], options?)` | `sendMessage(jid, { contacts: {...} })` |
| `sendPoll(jid, name, values[], selectableCount?, options?)` | `sendMessage(jid, { poll: {...} })` |
| `forward(jid, message, forwardingScore?, options?)` | `sendMessage(jid, { forward, forwardingScore, isForwarded:true })` |
| `delete(key)` | `sendMessage(jid, { delete: key })` |
| `edit(key, newText)` | `sendMessage(jid, { text, edit: key })` |
| `sendAlbum(jid, items[], options?)` | `sendMessage(jid, { albumMessage: items })` |
| `requestPayment(jid, amount, currency, note, from, options?)` | `sendMessage(jid, { requestPaymentMessage: {...} })` |
| `sendEvent(jid, eventConfig, options?)` | `sendMessage(jid, { eventMessage: {...} })` |
| `sendPollResult(jid, name, pollVotes[], options?)` | `sendMessage(jid, { pollResultMessage: {...} })` |

### Ejemplo real: comando con texto + reacción + edición

```js
bot.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  if (!msg?.message || msg.key.fromMe) return;
  const jid = msg.key.remoteJid;

  await bot.messages.react(msg.key, '⏳');

  const sent = await bot.messages.sendText(jid, 'Procesando...');
  // ... haces algo ...
  await bot.messages.edit(sent.key, 'Listo ✅');
  await bot.messages.react(msg.key, '✅');
});
```

> Ver [`examples/basic-messages.js`](./examples/basic-messages.js) para los 15+ tipos de mensaje con ejemplos ejecutables.

---

## `bot.interactive` — botones y listas

Simplifica construir `interactiveMessage`, que en la API original requiere `JSON.stringify` manual para cada botón.

| Método | Para qué sirve |
|---|---|
| `sendButtons(jid, config)` | Envía botones de flujo nativo (quick_reply, cta_url, cta_copy) |
| `quickReplyButton(texto, id)` | Helper: arma un botón de respuesta rápida ya serializado |
| `urlButton(texto, url)` | Helper: arma un botón de enlace externo |
| `copyButton(texto, codigo)` | Helper: arma un botón de "copiar código" |
| `sendListMenu(jid, config)` | Envía un menú de lista (`single_select`) con secciones/filas |
| `sendProduct(jid, productConfig)` | Envía un mensaje de producto de catálogo |

### Ejemplo: menú de botones

```js
await bot.interactive.sendButtons(jid, {
  title: 'Bienvenido!',
  header: 'Elige una opción',
  footer: 'Powered by Ourin',
  buttons: [
    bot.interactive.quickReplyButton('Menú', 'menu'),
    bot.interactive.urlButton('Sitio web', 'https://example.com'),
    bot.interactive.copyButton('Copiar código', 'OURIN2024'),
  ],
});
```

### Ejemplo: menú de lista con secciones

```js
await bot.interactive.sendListMenu(jid, {
  title: 'Selecciona categoría',
  header: 'Menú del Bot',
  footer: 'Powered by Ourin',
  menuTitle: 'Menu',
  sections: [
    { title: 'Juegos', rows: [{ title: 'Quiz', id: '.quiz' }] },
    { title: 'Herramientas', rows: [{ title: 'Sticker', id: '.sticker' }] },
  ],
});
```

> Ver [`examples/interactive-and-rich.js`](./examples/interactive-and-rich.js).

---

## `bot.rich` — respuestas enriquecidas tipo IA

Son los helpers `sendTable`, `sendList`, `sendCodeBlock`, `sendTableV2`, `sendCodeBlockV2`, `sendLink`, `sendLinkV2`, `sendRichMessage` y la clase `ORich`, que **ya existen directamente en `sock`** — este módulo solo evita tener que recordar el orden exacto de los argumentos.

| Método | Descripción |
|---|---|
| `sendTable(jid, title, headers[], rows[][], quoted, opts?)` | Tabla V1 básica con encabezados |
| `sendList(jid, title, rows[][], quoted, opts?)` | Lista clave-valor sin encabezado de tabla |
| `sendCodeBlock(jid, code, quoted, opts?)` | Código V1 (js/ts/python) |
| `sendTableV2(jid, [title, header, ...rows], quoted, opts?)` | Tabla V2 formato unificado (estilo Meta AI) |
| `sendCodeBlockV2(jid, code, quoted, opts?)` | Código V2 (6 lenguajes, formato unificado) |
| `sendLink(jid, text, urls[], quoted, opts?)` | Enlaces embebidos con placeholders `{{IE_N}}` |
| `sendLinkV2(jid, text, links[], quoted, opts?)` | Enlaces estilo "resultado de búsqueda" |
| `sendRichMessage(jid, subMessages[], quoted, opts?)` | Mensaje mixto con submensajes personalizados |
| `builder()` | Devuelve un `ORich` encadenable: `.addText().addSuggest().send(jid)` |

### Ejemplo: tabla V2 (formato Meta AI)

```js
await bot.rich.sendTableV2(
  jid,
  [
    'Java vs JavaScript',                 // título
    'Feature | Java | JavaScript',        // encabezado
    'Type | Compiled | Interpreted;;Typing | Static | Dynamic', // filas (;; separa filas)
  ],
  quotedMsg,
  { headerText: 'Comparación:', footer: 'Espero que ayude!' },
);
```

### Ejemplo: código con ORich (estilo IA conversacional)

```js
const respuesta = bot.rich.builder()
  .addText('Aquí tienes la respuesta')
  .addSuggest(['Explícame más', 'Dame un ejemplo']);
await respuesta.send(jid);
```

> Ver [`examples/interactive-and-rich.js`](./examples/interactive-and-rich.js) con los 9 tipos de respuesta rich.

---

## `bot.groups` — grupos

CRUD completo de grupos, invitaciones, configuración y participantes.

| Método | Descripción |
|---|---|
| `getMetadata(groupJid)` | Info completa del grupo |
| `create(subject, participantJids[])` | Crea un grupo |
| `leave(groupJid)` | Sale del grupo |
| `updateSubject(groupJid, nuevo)` / `updateDescription(...)` | Renombrar/redescribir |
| `updateParticipants(groupJid, jids[], 'add'\|'remove'\|'promote'\|'demote')` | Gestión de miembros |
| `getJoinRequests(groupJid)` / `updateJoinRequests(groupJid, jids[], 'approve'\|'reject')` | Solicitudes de ingreso |
| `getInviteCode(groupJid)` / `revokeInvite` / `acceptInvite` / `getInviteInfo` | Invitaciones |
| `updateSetting(groupJid, 'announcement'\|'not_announcement'\|'locked'\|'unlocked')` | Permisos de escritura/edición |
| `setMemberAddMode(groupJid, 'admin_add'\|'all_member_add')` | Quién puede agregar miembros |
| `setJoinApprovalMode(groupJid, 'on'\|'off')` | Aprobación manual de ingresos |
| `toggleEphemeral(groupJid, segundos)` | Mensajes temporales |
| `fetchAllParticipating()` | Todos los grupos del bot |
| `updateMemberLabel(groupJid, label)` | Etiqueta de miembro |

### Ejemplo: aprobar automáticamente solicitudes de ingreso

```js
bot.on('group.join-request', async (update) => {
  await bot.groups.updateJoinRequests(update.id, [update.participant], 'approve');
});
```

> Ver [`examples/groups-and-communities.js`](./examples/groups-and-communities.js).

---

## `bot.communities` — comunidades

Misma lógica que grupos, pero para comunidades (que agrupan varios grupos).

| Método | Descripción |
|---|---|
| `getMetadata` / `create` / `leave` | Básicos |
| `createSubgroup(subject, jids[], communityJid)` | Crea un grupo dentro de la comunidad |
| `linkGroup` / `unlinkGroup` / `fetchLinkedGroups` | Vincular grupos existentes |
| `getInviteCode` / `revokeInvite` / `acceptInvite` / `getInviteInfo` | Invitaciones |
| `getJoinRequests` / `updateJoinRequests` | Solicitudes |
| `updateParticipants` | Gestión de miembros |
| `updateSubject` / `updateDescription` / `toggleEphemeral` | Configuración |
| `updateSetting` / `setMemberAddMode` / `setJoinApprovalMode` | Permisos |
| `fetchAllParticipating` | Todas las comunidades del bot |

> Ver [`examples/groups-and-communities.js`](./examples/groups-and-communities.js).

---

## `bot.newsletter` — canales

| Método | Descripción |
|---|---|
| `resolveUrl(channelUrl)` | Resuelve `https://whatsapp.com/channel/xxxxx` a metadata |
| `followMultiple(jidsConEspacios)` | Sigue varios canales a la vez |
| `fetchAllSubscribed()` | Canales suscritos |
| `action(jid, 'follow'\|'unfollow'\|'mute'\|'unmute')` | Acción genérica |
| `create(name, description)` / `update(jid, cambios)` | CRUD del canal |
| `getSubscriberCount(jid)` / `getMetadata(jid, nlJid)` | Información |
| `follow` / `unfollow` / `mute` / `unmute` | Acciones directas |
| `updateName` / `updateDescription` / `updatePicture` / `removePicture` | Edición |
| `reactToMessage(jid, serverId, emoji)` | Reaccionar a un post del canal |
| `fetchMessages(jid, count, since, after)` | Historial del canal |
| `getAdminCount` / `changeOwner` / `demote` / `delete` | Administración |

### Ejemplo: seguir un canal y leer su metadata

```js
const info = await bot.newsletter.resolveUrl('https://whatsapp.com/channel/xxxxx');
await bot.newsletter.follow(info.id);
console.log(`Siguiendo: ${info.name} (${info.subscribers} suscriptores)`);
```

> Ver [`examples/newsletter-business-privacy.js`](./examples/newsletter-business-privacy.js).

---

## `bot.business` — catálogo y perfil de negocio

| Método | Descripción |
|---|---|
| `getCatalog({jid, limit})` | Lista productos del catálogo |
| `getCollections(jid, limit)` | Colecciones de productos |
| `getOrderDetails(orderId, token)` | Detalle de un pedido |
| `createProduct(data)` / `updateProduct(id, data)` / `deleteProducts(ids[])` | CRUD de productos |
| `updateProfile(data)` | Perfil de negocio (dirección, horarios, etc.) |
| `updateCoverPhoto` / `removeCoverPhoto` | Foto de portada del catálogo |
| `addOrEditQuickReply` / `removeQuickReply` | Respuestas rápidas |
| `getBusinessProfile(jid)` | Perfil de negocio de un contacto |

> Ver [`examples/newsletter-business-privacy.js`](./examples/newsletter-business-privacy.js).

---

## `bot.chatProfile` — chat y perfil

| Método | Descripción |
|---|---|
| `getProfilePictureUrl(jid, 'image'\|'preview')` | Foto de perfil |
| `updateProfilePicture` / `removeProfilePicture` | Editar foto propia o de un grupo |
| `updateProfileName(nombre)` / `updateProfileStatus(estado)` | Nombre/estado del bot |
| `sendPresenceUpdate(presencia, jid)` / `presenceSubscribe(jid)` | Presencia (escribiendo, en línea...) |
| `readMessages(keys[])` / `sendReceipt(jid, participant, ids[], tipo)` | Recibos de lectura |
| `updateBlockStatus(jid, 'block'\|'unblock')` / `fetchBlocklist()` | Bloqueos |
| `modifyChat(jid, modificacion)` | Archivar/fijar/silenciar/marcar como leído |
| `star(jid, refs[], valor)` | Destacar mensajes |
| `addOrEditContact` / `removeContact` | Agenda de contactos |
| `addChatLabel` / `removeChatLabel` / `addMessageLabel` | Etiquetas |
| `resyncAppState(colecciones[], desdeCero?)` | Resincronizar estado de la app |

> Ver [`examples/newsletter-business-privacy.js`](./examples/newsletter-business-privacy.js).

---

## `bot.privacy` — privacidad

| Método | Valores aceptados |
|---|---|
| `setLastSeen(v)` | `'all' \| 'contacts' \| 'contact_blacklist' \| 'nobody'` |
| `setOnline(v)` | `'all' \| 'match_last_seen'` |
| `setProfilePicture(v)` | `'all' \| 'contacts' \| 'contact_blacklist' \| 'nobody'` |
| `setStatus(v)` | `'all' \| 'contacts' \| 'contact_blacklist' \| 'nobody'` |
| `setReadReceipts(v)` | `'all' \| 'none'` |
| `setGroupsAdd(v)` | `'all' \| 'contacts'` |
| `setMessages(v)` | `'all' \| 'contacts' \| 'nobody'` |
| `setCalls(v)` | `'all' \| 'known' \| 'nobody'` |
| `setDefaultDisappearingMode(segundos)` | número, ej. `86400` |
| `setDisableLinkPreviews(boolean)` | `true \| false` |

> Ver [`examples/newsletter-business-privacy.js`](./examples/newsletter-business-privacy.js).

---

## VoIP (llamadas de voz)

El motor VoIP comparte el mismo socket de WhatsApp (sin doble pairing). Se activa con `bot.enableVoip()` **después** del evento `open`.

```js
bot.on('open', async () => {
  const voip = await bot.enableVoip();

  const call = await voip.call('6281234567890', {
    durationMs: 60000,
    audioSource: 'silence', // o 'mic' / 'file' (requieren audio-feeder + ffmpeg)
  });

  call.on('ringing', () => console.log('Sonando...'));
  call.on('connected', () => console.log('Conectado!'));
  call.on('ended', (reason) => console.log('Terminada:', reason));

  await call.waitForEnd();
});
```

`bot.voipModule.call(voip, numero, opciones)` existe como wrapper equivalente, pero se recomienda usar `bot.voip` (la instancia real) directamente, como en el ejemplo anterior.

> Ver [`examples/voip-call.js`](./examples/voip-call.js).

---

## `utils` — utilidades de bajo nivel

Funciones puras, sin necesidad de conexión activa, re-exportadas desde `ourin-baileys`:

```js
import { utils } from './src/index.js';

utils.jid.isGroup('123-456@g.us');        // true
utils.jid.normalize('628xxx:1@s.whatsapp.net');
utils.jid.decode('628xxx@s.whatsapp.net');

utils.codeTools.tokenizeCodeV2('const x = 1', 'javascript');

utils.stickers.makePack({ name: 'Pack', publisher: 'Yo', stickers: [...] });

utils.richGenerators.tableV2(...); // genera el contenido sin enviarlo
```

Grupos disponibles: `jid`, `crypto`, `codeTools`, `richGenerators`, `stickers`.

> Ver [`examples/utils-usage.js`](./examples/utils-usage.js).

---

## Auth state personalizado (producción)

`useMultiFileAuthState()` es cómodo para desarrollo, pero la propia librería **recomienda no usarlo en producción**. Puedes pasar tu propio `{state, saveCreds}` (respaldado por Redis/SQL/Mongo) construido con las piezas nativas:

```js
import { OurinBot, initAuthCreds, makeCacheableSignalKeyStore, BufferJSON } from './src/index.js';

const authState = await construyeTuPropioAuthState(); // usa initAuthCreds + makeCacheableSignalKeyStore

const bot = new OurinBot({ authState });
await bot.start();
```

> Ver ejemplo completo en [`examples/custom-auth-store.js`](./examples/custom-auth-store.js).

---

## Tabla de equivalencias (wrapper ↔ API original)

Para quien ya conoce `ourin-baileys` y quiere ubicar rápido el equivalente:

| API original (`sock.*`) | Wrapper |
|---|---|
| `sock.sendMessage(jid, {text})` | `bot.messages.sendText(jid, text)` |
| `sock.sendMessage(jid, {image})` | `bot.messages.sendImage(jid, path)` |
| `sock.sendTable(...)` | `bot.rich.sendTable(...)` |
| `sock.sendTableV2(...)` | `bot.rich.sendTableV2(...)` |
| `sock.sendCodeBlock(...)` | `bot.rich.sendCodeBlock(...)` |
| `sock.sendCodeBlockV2(...)` | `bot.rich.sendCodeBlockV2(...)` |
| `sock.sendLink(...)` / `sendLinkV2(...)` | `bot.rich.sendLink(...)` / `sendLinkV2(...)` |
| `sock.sendRichMessage(...)` | `bot.rich.sendRichMessage(...)` |
| `new ORich(sock)` | `bot.rich.builder()` |
| `sock.groupCreate(...)` | `bot.groups.create(...)` |
| `sock.groupParticipantsUpdate(...)` | `bot.groups.updateParticipants(...)` |
| `sock.communityCreate(...)` | `bot.communities.create(...)` |
| `sock.newsletterFollow(...)` | `bot.newsletter.follow(...)` |
| `sock.productCreate(...)` | `bot.business.createProduct(...)` |
| `sock.updateBusinessProfile(...)` | `bot.business.updateProfile(...)` |
| `sock.profilePictureUrl(...)` | `bot.chatProfile.getProfilePictureUrl(...)` |
| `sock.chatModify(...)` | `bot.chatProfile.modifyChat(...)` |
| `sock.updateLastSeenPrivacy(...)` | `bot.privacy.setLastSeen(...)` |
| `new VoipClient()` + `.connectWithSocket(sock)` | `bot.enableVoip()` |
| `jidEncode/jidDecode/...` | `utils.jid.*` |
| `tokenizeCodeV2(...)` | `utils.codeTools.tokenizeCodeV2(...)` |
| `makeStickerPack(...)` | `utils.stickers.makePack(...)` |

En todos los casos, **cualquier método del socket original no cubierto explícitamente** sigue disponible directamente en `bot.sock.<metodo>(...)`, porque el wrapper nunca oculta ni reemplaza el socket real.

---

## Ejemplos incluidos

| Archivo | Qué muestra |
|---|---|
| `examples/basic-bot.js` | Ciclo de vida completo: QR, conexión, comando simple |
| `examples/pairing-code-bot.js` | Autenticación por código de 8 dígitos |
| `examples/basic-messages.js` | Los 15+ tipos de mensaje de `bot.messages.*` |
| `examples/interactive-and-rich.js` | Botones, listas, tablas, código, enlaces, ORich |
| `examples/groups-and-communities.js` | CRUD completo de grupos y comunidades |
| `examples/newsletter-business-privacy.js` | Canales, catálogo de negocio, perfil, privacidad |
| `examples/voip-call.js` | Llamadas de voz nativas |
| `examples/custom-auth-store.js` | Auth state propio para producción |
| `examples/utils-usage.js` | Utilidades puras (JID, tokenizer) |

---

## Licencia

MIT — igual que `ourin-baileys`. Este wrapper es solo una capa de organización sobre esa librería; todo el crédito funcional es de [LuckyArch/ourin-baileys](https://github.com/LuckyArch/ourin-baileys).

> [!CAUTION]
> Uso con fines educativos. Asegúrate de cumplir los Términos de Servicio de WhatsApp.
