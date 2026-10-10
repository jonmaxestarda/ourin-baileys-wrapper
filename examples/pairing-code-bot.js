/**
 * Ejemplo 2: Autenticación por código de emparejamiento (pairing code)
 * ---------------------------------------------------------
 * Útil cuando no se puede escanear un QR (ej. servidor sin pantalla).
 *
 * Ejecutar: node examples/pairing-code-bot.js
 */
import { OurinBot, Browsers } from '../src/index.js';

const PHONE_NUMBER = '6281234567890'; // <-- reemplaza con tu número, formato internacional sin '+'

const bot = new OurinBot({
  sessionPath: './session-pairing',
  browser: Browsers.windows('Chrome'), // recomendado para pairing code
});

bot.on('connecting', async () => {
  // Pide el código justo cuando el socket entra en estado 'connecting'
  const code = await bot.requestPairingCode(PHONE_NUMBER);
  console.log('Tu código de emparejamiento es:', code);

  // También puedes pedir un código personalizado de 8 caracteres:
  // const code = await bot.requestPairingCode(PHONE_NUMBER, 'A1B2C3D4');
});

bot.on('open', () => console.log('✅ Conectado!'));

await bot.start();
