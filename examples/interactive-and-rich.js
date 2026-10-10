/**
 * Ejemplo 4: Mensajes interactivos (botones/listas) y Rich Responses (tipo IA)
 * ---------------------------------------------------------
 */
import { OurinBot } from '../src/index.js';

const bot = new OurinBot({ sessionPath: './session' });

bot.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  if (!msg?.message || msg.key.fromMe) return;
  const jid = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

  // --- Botones de flujo nativo ---
  if (text === '.botones') {
    await bot.interactive.sendButtons(jid, {
      title: 'Bienvenido!',
      header: 'Elige una opción',
      footer: 'Powered by Ourin',
      image: { url: 'https://example.com/banner.jpg' },
      buttons: [
        bot.interactive.quickReplyButton('Menú', 'menu'),
        bot.interactive.urlButton('Sitio web', 'https://example.com'),
        bot.interactive.copyButton('Copiar código', 'OURIN2024'),
      ],
    });
  }

  // --- Menú de lista (single_select) ---
  if (text === '.lista') {
    await bot.interactive.sendListMenu(jid, {
      title: 'Selecciona categoría',
      header: 'Menú del Bot',
      footer: 'Powered by Ourin',
      menuTitle: 'Menu',
      sections: [
        { title: 'Juegos', rows: [{ title: 'Quiz', id: '.quiz' }, { title: 'Tebak Gambar', id: '.tebakgambar' }] },
        { title: 'Herramientas', rows: [{ title: 'Sticker', id: '.sticker' }, { title: 'TTS', id: '.tts' }] },
      ],
    });
  }

  // --- Tabla V1 (simple) ---
  if (text === '.tabla') {
    await bot.rich.sendTable(
      jid,
      'Java vs JavaScript',
      ['Feature', 'Java', 'JavaScript'],
      [
        ['Type', 'Compiled', 'Interpreted'],
        ['Typing', 'Static', 'Dynamic'],
      ],
      msg,
      { headerText: 'Comparación:', footer: 'Espero que ayude!' },
    );
  }

  // --- Lista clave-valor (sin encabezado de tabla) ---
  if (text === '.info') {
    await bot.rich.sendList(
      jid,
      'Info del Bot',
      [
        ['Nombre', 'Ourin AI'],
        ['Versión', '2.4.0'],
        ['Desarrollador', 'Zann'],
      ],
      msg,
      { footer: '© Ourin AI' },
    );
  }

  // --- Bloque de código V1 ---
  if (text === '.codigo') {
    await bot.rich.sendCodeBlock(
      jid,
      'const saludo = "Hola Mundo"\nfunction decirHola(nombre) {\n  return saludo + " " + nombre\n}',
      msg,
      { language: 'javascript', title: 'Código de ejemplo', footer: 'Powered by Ourin' },
    );
  }

  // --- Tabla V2 (formato unificado tipo Meta AI) ---
  if (text === '.tablav2') {
    await bot.rich.sendTableV2(
      jid,
      [
        'Java vs JavaScript',
        'Feature | Java | JavaScript',
        'Type | Compiled | Interpreted;;Typing | Static | Dynamic',
      ],
      msg,
      { headerText: 'Comparación:', text: 'Aquí tienes una tabla comparativa:', footer: 'Espero que ayude!' },
    );
  }

  // --- Bloque de código V2 (6 lenguajes) ---
  if (text === '.codigov2') {
    await bot.rich.sendCodeBlockV2(
      jid,
      'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hola, Mundo!")\n}',
      msg,
      { language: 'go', title: 'Ejemplo en Go', text: 'Aquí tienes un snippet en Go:', footer: 'Powered by Ourin' },
    );
  }

  // --- Enlace embebido con citas ---
  if (text === '.link') {
    await bot.rich.sendLink(
      jid,
      'Resultados de subida:\n✅ Freeimage\n🔗 Clic: {{IE_0}}enlace aquí{{/IE_0}}',
      ['https://example.com/upload1'],
      msg,
      {
        headerText: '📁 Subidor de medios V3',
        footer: '✨ Listo!',
        citations: [{ sourceTitle: 'Freeimage', citationNumber: 1 }],
      },
    );
  }

  // --- Enlace V2 estilo resultados de búsqueda ---
  if (text === '.buscar') {
    await bot.rich.sendLinkV2(
      jid,
      'Resultados de búsqueda:\n- {{IE_0}}Documentación oficial{{/IE_0}}\n- {{IE_1}}Repositorio GitHub{{/IE_1}}',
      [
        { url: 'https://www.npmjs.com/package/ourin-baileys', displayName: 'Documentación oficial', sourceDisplayName: 'npm' },
        { url: 'https://github.com/LuckyArch/ourin-baileys', displayName: 'Repositorio GitHub', sourceDisplayName: 'github' },
      ],
      msg,
      { headerText: 'ourin-baileys', footer: 'Enlaces de referencia' },
    );
  }

  // --- Mensaje mixto (texto + tabla + código en un solo mensaje) ---
  if (text === '.mixto') {
    await bot.rich.sendRichMessage(
      jid,
      [
        { messageType: 2, messageText: 'Aquí tienes información:' },
        {
          messageType: 4,
          tableMetadata: {
            title: 'Estadísticas',
            rows: [
              { items: ['Métrica', 'Valor'], isHeading: true },
              { items: ['Usuarios', '1000'] },
              { items: ['Uptime', '99.9%'] },
            ],
          },
        },
        { messageType: 2, messageText: 'Y algo de código:' },
        {
          messageType: 5,
          codeMetadata: {
            codeLanguage: 'javascript',
            codeBlocks: [{ highlightType: 0, codeContent: 'console.log("OK")' }],
          },
        },
      ],
      msg,
    );
  }

  // --- Constructor encadenable ORich ---
  if (text === '.orich') {
    const respuesta = bot.rich.builder()
      .addText('Hola desde ORich AI!')
      .addSuggest(['Cuéntame más', 'Siguiente']);
    await respuesta.send(jid);
  }
});

await bot.start();
