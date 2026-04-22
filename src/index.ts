import { Hono, Context } from 'hono';
import { env } from './config/env'; 
import { loadDataset, datasetMemori } from './services/datasetService';
import { initDatabase } from './db/config';
import { handleTelegramUpdate } from './bot/handler';

// 1. Inisialisasi Hono (Ganti Express/Polling)
const app = new Hono();

// 2. Validasi Token 
if (!env.TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN belum diisi di file .env");
  process.exit(1);
}

/**
 * BOOTSTRAP SYSTEM
 * Bagian ini dijalankan SEKALI saat server pertama kali menyala (bun run start)
 */
console.log('-------------------------------------------');
console.log("ℹ️ Server mode:", "Telegram Webhook (Hono + Bun)");
console.log("ℹ️ Gemini enabled:", String(env.ENABLE_GEMINI));

// A. Load Dataset ke RAM (Optimasi Performa)
loadDataset(); // Mengeksekusi fungsi baca file JSON
console.log("ℹ️ Dataset Status:", `Loaded [${env.DATASET_TARGET}] into memory`);

// B. Inisialisasi Database PostgreSQL
await initDatabase();
console.log("ℹ️ Database Status:", "PostgreSQL connected & Ready");
console.log('-------------------------------------------');

/**
 * 3. ENDPOINT WEBHOOK
 * Menggantikan poller.js. Telegram akan mengirim POST ke URL ini.
 */
app.post('/webhook', async (c: Context) => {
  try {
    const update = await c.req.json();
    
    // Kirim ke bot handler secara async
    // Kita mengambil datasetMemori yang sudah diload di awal tadi
    handleTelegramUpdate(update, datasetMemori);

    return c.json({ ok: true }, 200);
  } catch (err: any) {
    console.error("❌ Webhook Handler Error:", err.message);
    return c.json({ ok: false }, 500);
  }
});

// Root route untuk monitoring sederhana
app.get('/', (c: Context) => c.text('Bot Admin Diskominfo is Online! 🚀'));

// Export untuk Bun
export default {
  port: env.PORT || 3000,
  fetch: app.fetch,
};