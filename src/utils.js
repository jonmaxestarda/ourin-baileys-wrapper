/**
 * utils.js
 * ---------------------------------------------------------
 * Re-exporta y agrupa, sin modificar su comportamiento, las utilidades
 * "sueltas" de ourin-baileys que no pertenecen a ningún método del socket:
 * manejo de JIDs, criptografía, tokenización de código, generadores de
 * contenido rich, sticker packs y constantes de palabras clave por lenguaje.
 *
 * Uso:
 *   import { jid, crypto, codeTools, richGenerators } from './src/utils.js';
 *   jid.isGroup('id@g.us'); // true
 */
import {
  // JID
  jidEncode,
  jidDecode,
  jidNormalizedUser,
  areJidsSameUser,
  isJidGroup,
  isJidNewsletter,
  isLidUser,
  isPnUser,
  isJidBot,
  isJidMetaAI,
  isJidBroadcast,
  isJidStatusBroadcast,

  // Crypto
  Curve,
  signedKeyPair,
  aesEncryptGCM,
  aesDecryptGCM,

  // Tokenización de código
  tokenizeCode,
  tokenizeCodeV2,
  CodeHighlightType,
  RichSubMessageType,

  // Generadores de contenido rich (de más bajo nivel que sock.sendX)
  generateTableContent,
  generateTableContentV2,
  toTableMetadataV2,
  generateListContent,
  generateCodeBlockContent,
  generateCodeBlockContentV2,
  generateLinkContent,
  generateLinkContentV2,
  generateRichMessageContent,
  generateLatexContent,
  generateLatexImageContent,
  generateLatexInlineImageContent,
  generateUnifiedResponseContent,
  captureUnifiedResponse,
  buildRichContextInfo,
  buildBotForwardedMessage,

  // Sticker pack
  makeStickerPack,

  // Palabras clave por lenguaje (usadas por los tokenizadores)
  JS_KEYWORDS,
  PYTHON_KEYWORDS,
  GO_KEYWORDS,
  LUA_KEYWORDS,
  BASH_KEYWORDS,
  LANGUAGE_KEYWORDS,
} from 'ourin-baileys';

/**
 * Utilidades de JID: codificar/decodificar, normalizar, comparar y
 * detectar el tipo de JID (grupo, newsletter, lid, bot, meta ai, broadcast...).
 *
 * @example
 * jid.isGroup('123-456@g.us'); // true
 * jid.normalize('628xxx:1@s.whatsapp.net'); // '628xxx@s.whatsapp.net'
 */
export const jid = {
  encode: jidEncode,
  decode: jidDecode,
  normalize: jidNormalizedUser,
  isSameUser: areJidsSameUser,
  isGroup: isJidGroup,
  isNewsletter: isJidNewsletter,
  isLid: isLidUser,
  isPn: isPnUser,
  isBot: isJidBot,
  isMetaAI: isJidMetaAI,
  isBroadcast: isJidBroadcast,
  isStatusBroadcast: isJidStatusBroadcast,
};

/**
 * Primitivas criptográficas usadas internamente por el protocolo Signal
 * (Curve25519, firma de pre-keys, AES-256-GCM). Úsalas solo si necesitas
 * implementar tu propio almacén de claves o depurar el protocolo.
 */
export const crypto = {
  Curve,
  signedKeyPair,
  aesEncryptGCM,
  aesDecryptGCM,
};

/**
 * Tokenizadores de código fuente (los mismos que usan sendCodeBlock /
 * sendCodeBlockV2 internamente) y sus constantes de tipo de resaltado.
 *
 * @example
 * const tokens = codeTools.tokenizeCodeV2('const x = 1', 'javascript');
 */
export const codeTools = {
  tokenizeCode,
  tokenizeCodeV2,
  CodeHighlightType,
  RichSubMessageType,
  keywords: {
    js: JS_KEYWORDS,
    python: PYTHON_KEYWORDS,
    go: GO_KEYWORDS,
    lua: LUA_KEYWORDS,
    bash: BASH_KEYWORDS,
    byLanguage: LANGUAGE_KEYWORDS,
  },
};

/**
 * Generadores de contenido "crudo" para respuestas rich (nivel más bajo que
 * bot.rich.*). Útiles si necesitas el objeto de contenido sin enviarlo,
 * por ejemplo para componerlo dentro de un `sendRichMessage` personalizado.
 */
export const richGenerators = {
  table: generateTableContent,
  tableV2: generateTableContentV2,
  toTableMetadataV2,
  list: generateListContent,
  codeBlock: generateCodeBlockContent,
  codeBlockV2: generateCodeBlockContentV2,
  link: generateLinkContent,
  linkV2: generateLinkContentV2,
  richMessage: generateRichMessageContent,
  latex: generateLatexContent,
  latexImage: generateLatexImageContent,
  latexInlineImage: generateLatexInlineImageContent,
  unifiedResponse: generateUnifiedResponseContent,
  captureUnifiedResponse,
  buildContextInfo: buildRichContextInfo,
  buildBotForwardedMessage,
};

/** Crea un pack de stickers en el formato esperado por sock.sendMessage(). */
export const stickers = { makePack: makeStickerPack };
