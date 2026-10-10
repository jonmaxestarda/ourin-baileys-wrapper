/**
 * BusinessModule
 * ---------------------------------------------------------
 * Envoltorio de catálogo, productos y perfil de negocio (sock.*).
 */
export class BusinessModule {
  constructor(sock) {
    this.sock = sock;
  }

  /**
   * Obtiene el catálogo de productos de una cuenta de negocio.
   * @example
   * const { products, nextPageCursor } = await bot.business.getCatalog({ jid: '628xxx@s.whatsapp.net', limit: 10 });
   */
  getCatalog(opts) {
    return this.sock.getCatalog(opts);
  }

  getCollections(jid, limit) {
    return this.sock.getCollections(jid, limit);
  }

  getOrderDetails(orderId, tokenBase64) {
    return this.sock.getOrderDetails(orderId, tokenBase64);
  }

  /**
   * Crea un producto nuevo en el catálogo.
   * @example
   * const product = await bot.business.createProduct({
   *   name: 'Paquete Premium', description: 'Plan premium oficial',
   *   price: 150000, currency: 'IDR', originCountryCode: 'ID', images: [mediaUpload],
   * });
   */
  createProduct(productData) {
    return this.sock.productCreate(productData);
  }

  updateProduct(productId, updates) {
    return this.sock.productUpdate(productId, updates);
  }

  /** @param {string[]} productIds */
  deleteProducts(productIds) {
    return this.sock.productDelete(productIds);
  }

  /**
   * Actualiza el perfil de negocio (dirección, descripción, horarios, etc.).
   * @example
   * await bot.business.updateProfile({
   *   address: 'Jakarta, Indonesia', description: 'Tienda oficial',
   *   websites: ['https://example.com'], email: 'hola@example.com',
   *   hours: { timezone: 'Asia/Jakarta', days: [{ day: 'mon', mode: 'open_24h' }] },
   * });
   */
  updateProfile(profileData) {
    return this.sock.updateBusinessProfile(profileData);
  }

  updateCoverPhoto(mediaUpload) {
    return this.sock.updateCoverPhoto(mediaUpload);
  }

  removeCoverPhoto(coverId) {
    return this.sock.removeCoverPhoto(coverId);
  }

  /**
   * Agrega o edita una respuesta rápida.
   * @example
   * await bot.business.addQuickReply({ shortcut: 'hola', message: 'Hola desde la cuenta de negocio' });
   */
  addOrEditQuickReply(quickReplyData) {
    return this.sock.addOrEditQuickReply(quickReplyData);
  }

  removeQuickReply(timestamp) {
    return this.sock.removeQuickReply(timestamp);
  }

  /** Obtiene el perfil de negocio de un contacto. */
  getBusinessProfile(jid) {
    return this.sock.getBusinessProfile(jid);
  }
}
