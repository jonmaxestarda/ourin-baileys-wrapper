/**
 * RichModule
 * ---------------------------------------------------------
 * Envoltorio directo de los helpers "AI Rich Response" de ourin-baileys:
 * sendTable, sendList, sendCodeBlock, sendTableV2, sendCodeBlockV2,
 * sendLink, sendLinkV2, sendRichMessage y la clase ORich.
 *
 * Todos estos métodos EXISTEN YA en el `sock` devuelto por makeWASocket();
 * este módulo solo evita tener que recordar el orden exacto de argumentos.
 */
import { ORich } from 'ourin-baileys';

export class RichModule {
  constructor(sock) {
    this.sock = sock;
  }

  /**
   * Tabla V1 (básica, con encabezados). Usa sock.sendTable internamente.
   * @param {string} jid
   * @param {string} title
   * @param {string[]} headers Columnas, ej: ['Feature','Java','JavaScript']
   * @param {string[][]} rows Filas de datos
   * @param {Object} [quoted] Mensaje citado
   * @param {{headerText?:string, footer?:string}} [opts]
   *
   * @example
   * await bot.rich.sendTable(jid, 'Java vs JavaScript',
   *   ['Feature', 'Java', 'JavaScript'],
   *   [['Type', 'Compiled', 'Interpreted']],
   *   quotedMsg, { headerText: 'Comparación:', footer: 'Saludos!' });
   */
  sendTable(jid, title, headers, rows, quoted, opts = {}) {
    return this.sock.sendTable(jid, title, headers, rows, quoted, opts);
  }

  /**
   * Lista simple clave-valor (sin encabezado de tabla). Usa sock.sendList.
   * @param {string[][]} rows Pares [etiqueta, valor]
   * @example
   * await bot.rich.sendList(jid, 'Info del Bot',
   *   [['Nombre','Ourin AI'], ['Versión','2.4.0']], quotedMsg, { footer: '© Ourin AI' });
   */
  sendList(jid, title, rows, quoted, opts = {}) {
    return this.sock.sendList(jid, title, rows, quoted, opts);
  }

  /**
   * Bloque de código V1 con resaltado básico (javascript, typescript, python).
   * @example
   * await bot.rich.sendCodeBlock(jid, 'console.log("Hola")', quotedMsg, {
   *   language: 'javascript', title: 'Ejemplo', footer: 'Powered by Ourin',
   * });
   */
  sendCodeBlock(jid, code, quoted, opts = {}) {
    return this.sock.sendCodeBlock(jid, code, quoted, opts);
  }

  /**
   * Tabla V2 (formato unificado tipo Meta AI). El formato de `table` es:
   * [0]=título, [1]=encabezado "col1|col2|col3", [2+]="a|b|c;;d|e|f" (filas separadas por ;;)
   *
   * @param {[string,string,...string[]]} table
   * @example
   * await bot.rich.sendTableV2(jid, [
   *   'Java vs JavaScript',
   *   'Feature | Java | JavaScript',
   *   'Type | Compiled | Interpreted;;Typing | Static | Dynamic',
   * ], quotedMsg, { headerText: 'Comparación:', text: 'Tabla comparativa:', footer: 'Saludos!' });
   */
  sendTableV2(jid, table, quoted, opts = {}) {
    return this.sock.sendTableV2(jid, table, quoted, opts);
  }

  /**
   * Bloque de código V2 (formato unificado, 6 lenguajes: javascript/ts, python, go, lua, bash).
   * @example
   * await bot.rich.sendCodeBlockV2(jid, 'fmt.Println("Hola")', quotedMsg, {
   *   language: 'go', title: 'Ejemplo Go', text: 'Código en Go:', footer: 'Powered by Ourin',
   * });
   */
  sendCodeBlockV2(jid, code, quoted, opts = {}) {
    return this.sock.sendCodeBlockV2(jid, code, quoted, opts);
  }

  /**
   * Enlaces embebidos inline con placeholders {{IE_N}}texto{{/IE_N}}, citas y pruebas.
   * @param {string} text Texto con placeholders {{IE_0}}...{{/IE_0}}
   * @param {string[]} urls Array de URLs, el índice corresponde al N del placeholder
   * @example
   * await bot.rich.sendLink(jid,
   *   'Resultado: {{IE_0}}clic aquí{{/IE_0}}',
   *   ['https://example.com'],
   *   quotedMsg,
   *   { headerText: 'Resultados', footer: 'Listo!' });
   */
  sendLink(jid, text, urls, quoted, opts = {}) {
    return this.sock.sendLink(jid, text, urls, quoted, opts);
  }

  /**
   * Enlaces V2, estilo "resultado de búsqueda" con metadata por enlace.
   * @param {Array<{url:string, displayName:string, sourceDisplayName?:string, sourceSubtitle?:string}>} links
   * @example
   * await bot.rich.sendLinkV2(jid,
   *   'Enlaces: {{IE_0}}Docs{{/IE_0}}',
   *   [{ url: 'https://npmjs.com/package/x', displayName: 'Docs', sourceDisplayName: 'npm' }],
   *   quotedMsg, { headerText: 'Referencias' });
   */
  sendLinkV2(jid, text, links, quoted, opts = {}) {
    return this.sock.sendLinkV2(jid, text, links, quoted, opts);
  }

  /**
   * Mensaje mixto con submensajes personalizados (texto + tabla + código, etc.).
   * @param {Array<Object>} subMessages Cada uno con { messageType, ...metadata }
   * @example
   * await bot.rich.sendRichMessage(jid, [
   *   { messageType: 2, messageText: 'Información:' },
   *   { messageType: 4, tableMetadata: { title: 'Stats', rows: [
   *     { items: ['Métrica','Valor'], isHeading: true },
   *     { items: ['Usuarios','1000'] },
   *   ]}},
   * ], quotedMsg);
   */
  sendRichMessage(jid, subMessages, quoted, opts = {}) {
    return this.sock.sendRichMessage(jid, subMessages, quoted, opts);
  }

  /**
   * Devuelve un constructor encadenable `ORich` para armar respuestas tipo IA
   * paso a paso (texto + sugerencias, etc.) y enviarlas con `.send(jid)`.
   *
   * @example
   * const reply = bot.rich.builder()
   *   .addText('Hola desde ORich!')
   *   .addSuggest(['Cuéntame más', 'Siguiente']);
   * await reply.send(jid);
   */
  builder() {
    return new ORich(this.sock);
  }
}
