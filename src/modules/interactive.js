/**
 * InteractiveModule
 * ---------------------------------------------------------
 * Simplifica la construcción de `interactiveMessage` (botones de flujo
 * nativo, menús de lista) y `productMessage`, que en la librería original
 * requieren armar manualmente arrays de `buttons` con `buttonParamsJson`
 * en formato string JSON.
 */
export class InteractiveModule {
  constructor(sock) {
    this.sock = sock;
  }

  /**
   * Envía botones de flujo nativo (quick_reply, cta_url, cta_copy, etc.).
   * Acepta los botones ya "listos para usar" (sin tener que stringificar tú mismo
   * el buttonParamsJson en los casos más comunes).
   *
   * @param {string} jid
   * @param {Object} config
   * @param {string} [config.title]
   * @param {string} [config.footer]
   * @param {string} [config.header]
   * @param {{url?:string}} [config.image]
   * @param {Array<Object>} config.buttons Botones en formato nativo
   *        ({ name, buttonParamsJson } con buttonParamsJson YA como string)
   *        o usa los helpers `quickReplyButton`, `urlButton`, `copyButton` de abajo.
   *
   * @example
   * await bot.interactive.sendButtons(jid, {
   *   title: 'Bienvenido!', footer: 'Powered by Ourin', header: 'Elige una opción',
   *   buttons: [
   *     bot.interactive.quickReplyButton('Menu', 'menu'),
   *     bot.interactive.urlButton('Sitio web', 'https://example.com'),
   *     bot.interactive.copyButton('Copiar código', 'OURIN2024'),
   *   ],
   * });
   */
  sendButtons(jid, config, options = {}) {
    const { title, footer, header, image, buttons } = config;
    return this.sock.sendMessage(
      jid,
      { interactiveMessage: { title, footer, header, image, buttons } },
      options,
    );
  }

  /** Helper: construye un botón de respuesta rápida (quick_reply) ya serializado. */
  quickReplyButton(displayText, id) {
    return { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: displayText, id }) };
  }

  /** Helper: construye un botón de enlace externo (cta_url) ya serializado. */
  urlButton(displayText, url) {
    return { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: displayText, url }) };
  }

  /** Helper: construye un botón de copiar código (cta_copy) ya serializado. */
  copyButton(displayText, copyCode) {
    return { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: displayText, copy_code: copyCode }) };
  }

  /**
   * Envía un menú de lista (single_select) con secciones y filas.
   * @param {string} jid
   * @param {Object} config
   * @param {string} [config.title]
   * @param {string} [config.footer]
   * @param {string} [config.header]
   * @param {string} config.menuTitle Título que aparece al abrir la lista
   * @param {Array<{title:string, rows:Array<{title:string, id:string, description?:string}>}>} config.sections
   *
   * @example
   * await bot.interactive.sendListMenu(jid, {
   *   title: 'Selecciona Categoría', footer: 'Powered by Ourin', header: 'Menú del Bot',
   *   menuTitle: 'Menu',
   *   sections: [
   *     { title: 'Juegos', rows: [{ title: 'Quiz', id: '.quiz' }] },
   *     { title: 'Herramientas', rows: [{ title: 'Sticker', id: '.sticker' }] },
   *   ],
   * });
   */
  sendListMenu(jid, config, options = {}) {
    const { title, footer, header, menuTitle, sections } = config;
    return this.sock.sendMessage(
      jid,
      {
        interactiveMessage: {
          title,
          footer,
          header,
          buttons: [
            {
              name: 'single_select',
              buttonParamsJson: JSON.stringify({ title: menuTitle, sections }),
            },
          ],
        },
      },
      options,
    );
  }

  /**
   * Envía un mensaje de producto de catálogo con botones opcionales.
   * @example
   * await bot.interactive.sendProduct(jid, {
   *   title: 'Audífonos Inalámbricos', description: 'Bluetooth de alta calidad',
   *   productId: 'WH-001', retailerId: 'ourin-shop', url: 'https://example.com/product',
   *   priceAmount1000: 299000, currencyCode: 'IDR',
   *   thumbnail: { url: 'https://example.com/product.jpg' },
   *   body: 'Mira este producto!', footer: 'Ourin Shop',
   *   buttons: [bot.interactive.quickReplyButton('Comprar', 'buy_wh001')],
   * });
   */
  sendProduct(jid, productConfig, options = {}) {
    return this.sock.sendMessage(jid, { productMessage: productConfig }, options);
  }
}
