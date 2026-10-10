/**
 * OurinBot — Wrapper de alto nivel sobre `ourin-baileys`
 * ---------------------------------------------------------
 * NO añade funcionalidades nuevas ni cambia el comportamiento de
 * `ourin-baileys`. Únicamente organiza y expone de forma más simple
 * las funciones que YA existen en la librería original, agrupadas
 * por dominio (conexión, mensajes, interactivos, rich responses,
 * grupos, comunidades, newsletter, negocio, chat/perfil, privacidad, VoIP).
 *
 * Cada método de este wrapper llama internamente al método equivalente
 * documentado en el README de ourin-baileys. Si quieres usar la API
 * original directamente, `bot.sock` te da acceso al socket crudo.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  initAuthCreds,
  BufferJSON,
  VoipClient,
} from 'ourin-baileys';

import pino from 'pino';
import EventEmitter from 'node:events';

import { MessagesModule } from './modules/messages.js';
import { InteractiveModule } from './modules/interactive.js';
import { RichModule } from './modules/rich.js';
import { NewsletterModule } from './modules/newsletter.js';
import { GroupsModule } from './modules/groups.js';
import { CommunitiesModule } from './modules/communities.js';
import { BusinessModule } from './modules/business.js';
import { ChatProfileModule } from './modules/chatProfile.js';
import { PrivacyModule } from './modules/privacy.js';
import { VoipModule } from './modules/voip.js';

export class OurinBot extends EventEmitter {
  /**
   * @param {Object} options
   * @param {string} [options.sessionPath='./session'] Carpeta donde se guarda la sesión (useMultiFileAuthState)
   * @param {'silent'|'info'|'debug'|'warn'|'error'} [options.logLevel='silent'] Nivel del logger pino
   * @param {Function} [options.browser] Browsers.ubuntu | Browsers.windows | Browsers.macOS (por defecto Browsers.ubuntu('Chrome'))
   * @param {boolean} [options.syncFullHistory=false] Igual que la opción nativa syncFullHistory
   * @param {Object} [options.socketOptions={}] Opciones extra que se mezclan directamente dentro de makeWASocket()
   * @param {Object} [options.authState] Si ya tienes tu propio { state, saveCreds } (ej. store en BD), pásalo aquí
   *                                     y el wrapper NO llamará a useMultiFileAuthState.
   */
  constructor(options = {}) {
    super();

    this.options = {
      sessionPath: options.sessionPath || './session',
      logLevel: options.logLevel || 'silent',
      browser: options.browser || Browsers.ubuntu('Chrome'),
      syncFullHistory: options.syncFullHistory ?? false,
      socketOptions: options.socketOptions || {},
      authState: options.authState || null,
    };

    this.logger = pino({ level: this.options.logLevel });
    this.sock = null;
    this.saveCreds = null;
    this.voip = null; // instancia VoipClient, se crea bajo demanda (ver .enableVoip())

    // Submódulos (se inicializan en start(), cuando this.sock ya existe)
    this.messages = null;
    this.interactive = null;
    this.rich = null;
    this.newsletter = null;
    this.groups = null;
    this.communities = null;
    this.business = null;
    this.chatProfile = null;
    this.privacy = null;
    this.voipModule = null;
  }

  /**
   * Inicia la conexión con WhatsApp. Debe llamarse una sola vez.
   * Reconecta automáticamente salvo que el cierre sea por logout.
   *
   * @returns {Promise<import('ourin-baileys').WASocket>} el socket crudo, por si lo necesitas
   *
   * @example
   * const bot = new OurinBot({ sessionPath: './session' });
   * await bot.start();
   * bot.on('qr', (qr) => console.log(qr));
   * bot.on('open', () => console.log('Conectado!'));
   */
  async start() {
    const authState = this.options.authState
      ? this.options.authState
      : await useMultiFileAuthState(this.options.sessionPath);

    const { state, saveCreds } = authState;
    this.saveCreds = saveCreds;

    this.sock = makeWASocket({
      auth: state,
      logger: this.logger,
      browser: this.options.browser,
      syncFullHistory: this.options.syncFullHistory,
      ...this.options.socketOptions,
    });

    this._bindCoreEvents();
    this._initModules();

    return this.sock;
  }

  /** Conecta los eventos base del socket a este EventEmitter (qr, open, close, reconnecting...) */
  _bindCoreEvents() {
    const sock = this.sock;

    sock.ev.on('creds.update', this.saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, isOnline, receivedPendingNotifications } = update;

      if (qr) this.emit('qr', qr);

      if (connection === 'connecting') this.emit('connecting');

      if (connection === 'open') {
        this.emit('open', { isNewLogin, isOnline });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        this.emit('close', { statusCode, shouldReconnect, error: lastDisconnect?.error });

        if (shouldReconnect) {
          this.emit('reconnecting');
          this.start();
        } else {
          this.emit('loggedOut');
        }
      }

      if (receivedPendingNotifications) this.emit('synced');

      // Reenvía el evento crudo también, por si se necesita el detalle completo
      this.emit('connection.update', update);
    });

    // Reenvía eventos de mensajes/grupos tal cual, para quien quiera escuchar directo
    const passthroughEvents = [
      'messaging-history.set',
      'chats.upsert',
      'chats.update',
      'chats.delete',
      'contacts.upsert',
      'contacts.update',
      'messages.upsert',
      'messages.update',
      'messages.delete',
      'messages.reaction',
      'message-receipt.update',
      'groups.update',
      'group-participants.update',
      'group.join-request',
      'call',
      'labels.edit',
      'labels.associations',
      'newsletter.update',
      'newsletter.follow',
      'newsletter.unfollow',
      'settings.update',
    ];

    for (const evt of passthroughEvents) {
      sock.ev.on(evt, (payload) => this.emit(evt, payload));
    }
  }

  /** Crea las instancias de los módulos de alto nivel, pasándoles el socket real */
  _initModules() {
    this.messages = new MessagesModule(this.sock);
    this.interactive = new InteractiveModule(this.sock);
    this.rich = new RichModule(this.sock);
    this.newsletter = new NewsletterModule(this.sock);
    this.groups = new GroupsModule(this.sock);
    this.communities = new CommunitiesModule(this.sock);
    this.business = new BusinessModule(this.sock);
    this.chatProfile = new ChatProfileModule(this.sock);
    this.privacy = new PrivacyModule(this.sock);
    this.voipModule = new VoipModule(this.sock);
  }

  /**
   * Solicita un código de emparejamiento (pairing code) en vez de usar QR.
   * Debe llamarse después de que la conexión entre en estado 'connecting'.
   *
   * @param {string} phoneNumber Número en formato internacional sin '+', ej: '6281234567890'
   * @param {string} [customCode] Código personalizado de exactamente 8 caracteres
   * @returns {Promise<string>} el código de emparejamiento
   *
   * @example
   * bot.on('connecting', async () => {
   *   const code = await bot.requestPairingCode('6281234567890');
   *   console.log('Código:', code);
   * });
   */
  async requestPairingCode(phoneNumber, customCode) {
    if (customCode) return this.sock.requestPairingCode(phoneNumber, customCode);
    return this.sock.requestPairingCode(phoneNumber);
  }

  /**
   * Activa el motor VoIP nativo (voz) ligado a este mismo socket (sin doble pairing).
   * Llamar DESPUÉS de que la conexión esté 'open'.
   *
   * @returns {Promise<import('ourin-baileys').VoipClient>}
   *
   * @example
   * bot.on('open', async () => {
   *   const voip = await bot.enableVoip();
   *   const call = await voip.call('6281234567890');
   * });
   */
  async enableVoip() {
    if (this.voip) return this.voip;
    this.voip = new VoipClient();
    await this.voip.connectWithSocket(this.sock);
    return this.voip;
  }

  /** Acceso directo a utilidades estáticas de la librería (JID, crypto, versión, etc.), ver `utils.js` */
  static get utils() {
    return import('./utils.js');
  }
}

export { fetchLatestBaileysVersion, makeCacheableSignalKeyStore, initAuthCreds, BufferJSON, Browsers, DisconnectReason };
