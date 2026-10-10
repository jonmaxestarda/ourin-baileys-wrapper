/**
 * VoipModule
 * ---------------------------------------------------------
 * Envoltorio ligero del motor VoIP nativo (VoipClient). La instancia real
 * se crea en `OurinBot.enableVoip()` (requiere conexión 'open' primero);
 * este módulo queda disponible por consistencia de API pero delega todo
 * a `bot.voip` (la instancia VoipClient real) una vez activada.
 *
 * Recomendado: usa directamente `bot.enableVoip()` y luego `bot.voip.call(...)`.
 * Este módulo expone wrappers equivalentes por si prefieres bot.voipModule.*
 */
export class VoipModule {
  constructor(sock) {
    this.sock = sock;
  }

  /**
   * Realiza una llamada de voz saliente. Requiere haber llamado antes a
   * `bot.enableVoip()` (una sola vez, tras el evento 'open').
   *
   * @param {import('ourin-baileys').VoipClient} voipClient instancia activa (bot.voip)
   * @param {string} phoneNumber Número en formato internacional sin '+'
   * @param {{durationMs?:number, audioSource?:'silence'|'mic'|'file'}} [options]
   * @returns {Promise<Object>} objeto `call` con eventos .on('ringing'|'connected'|'ended') y .waitForEnd()
   *
   * @example
   * const voip = await bot.enableVoip();
   * const call = await bot.voipModule.call(voip, '6281234567890', { durationMs: 60000 });
   * call.on('connected', () => console.log('Conectado!'));
   * await call.waitForEnd();
   */
  async call(voipClient, phoneNumber, options = {}) {
    return voipClient.call(phoneNumber, options);
  }
}
