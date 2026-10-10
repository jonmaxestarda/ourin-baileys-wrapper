/**
 * Ejemplo 8: Auth state personalizado (producción)
 * ---------------------------------------------------------
 * useMultiFileAuthState() es cómodo para desarrollo local, pero la propia
 * librería recomienda NO usarlo como almacenamiento definitivo en producción.
 * Aquí se muestra cómo conectar tu propio store (Map en memoria a modo de
 * ejemplo; en producción sería Redis/SQL/Mongo) usando las piezas nativas
 * `initAuthCreds` + `makeCacheableSignalKeyStore` + `BufferJSON`.
 */
import { OurinBot, initAuthCreds, makeCacheableSignalKeyStore, BufferJSON } from '../src/index.js';

// --- Simulación de un almacén externo (reemplaza por tu BD real) ---
const credsStore = new Map();
const keyStoreData = new Map();

function buildAuthState() {
  const creds = credsStore.get('creds') || initAuthCreds();

  const keys = makeCacheableSignalKeyStore({
    get: async (type, ids) => {
      const data = {};
      for (const id of ids) data[id] = keyStoreData.get(`${type}:${id}`);
      return data;
    },
    set: async (data) => {
      for (const category in data) {
        for (const id in data[category]) {
          const value = data[category][id];
          const key = `${category}:${id}`;
          if (value == null) keyStoreData.delete(key);
          else keyStoreData.set(key, value);
        }
      }
    },
  });

  const state = { creds, keys };

  const saveCreds = async () => {
    credsStore.set(
      'creds',
      JSON.parse(JSON.stringify(state.creds, BufferJSON.replacer), BufferJSON.reviver),
    );
  };

  return { state, saveCreds };
}

const authState = await buildAuthState();

const bot = new OurinBot({ authState }); // sessionPath se ignora cuando pasas authState

bot.on('open', () => console.log('✅ Conectado usando store personalizado'));

await bot.start();
