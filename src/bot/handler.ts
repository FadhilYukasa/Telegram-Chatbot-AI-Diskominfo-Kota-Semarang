import { env } from '../config/env';
import { sql } from '../db/config';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inisialisasi Google Gemini AI
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Fungsi bantuan untuk mengirim pesan kembali ke Telegram via API (tanpa library berat)
// Di dalam handler.ts
async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: text,
      disable_web_page_preview: true // Agar link tidak muncul preview besar
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error("❌ Telegram API Error:", errorData);
  }
}

// Fungsi utama yang dipanggil oleh webhook di index.ts
export async function handleTelegramUpdate(update: any, dataset: any) {
  // Pastikan update yang masuk benar-benar berupa pesan teks dari user
  if (!update.message || !update.message.text) return;

  const msg = update.message;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || '';
  const firstName = msg.from.first_name || '';
  const text = msg.text;

  try {
    // ==========================================
    // 1. SIMPAN/UPDATE DATA USER KE DATABASE
    // ==========================================
    await sql`
      INSERT INTO users (id, username, first_name)
      VALUES (${userId}, ${username}, ${firstName})
      ON CONFLICT (id) DO UPDATE 
      SET username = EXCLUDED.username, first_name = EXCLUDED.first_name;
    `;

    // ==========================================
    // 2. MANAJEMEN SESI (Mencari sesi aktif atau membuat baru)
    // ==========================================
    let session = await sql`
      SELECT id_session FROM sessions 
      WHERE user_id = ${userId} AND status = 'active' 
      ORDER BY created_at DESC LIMIT 1;
    `;
    
    let sessionId: string;
    if (session.length === 0) {
      // Jika tidak ada sesi aktif, buat sesi baru menggunakan UUID v7
      sessionId = uuidv4();
      await sql`
        INSERT INTO sessions (id_session, user_id, status)
        VALUES (${sessionId}, ${userId}, 'active');
      `;
    } else {
      sessionId = session[0].id_session;
    }

    // ==========================================
    // 3. SIMPAN PESAN USER KE DATABASE
    // ==========================================
    await sql`
      INSERT INTO messages (session_id, sender, content)
      VALUES (${sessionId}, 'user', ${text});
    `;

    // ==========================================
    // 4. LOGIKA AI & BALASAN BOT
    // ==========================================
    let replyText = "";

    if (text === '/start') {
      replyText = `Halo ${firstName}! 👋\nSaya adalah asisten bot cerdas. Ada yang bisa saya bantu terkait informasi yang saya ketahui?`;
    } else {
      // Panggil Gemini AI jika bukan command /start
      if (env.ENABLE_GEMINI) {
        const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
        
        // Membangun "otak" AI dengan dataset JSON yang diload ke RAM
        const systemInstruction = `
          Kamu adalah asisten bot Telegram yang ramah dan membantu. 
          Gunakan data berikut ini sebagai referensi utama untuk menjawab pertanyaan: 
          ${JSON.stringify(dataset)}
          
          Aturan:
          1. Jawablah dengan bahasa Indonesia yang natural dan mudah dipahami.
          2. Jika pertanyaan TIDAK ADA hubungannya dengan data di atas, jawab dengan sopan bahwa kamu tidak memiliki informasi tersebut.
        `;
        
        const prompt = `${systemInstruction}\n\nPertanyaan User: ${text}`;
        const result = await model.generateContent(prompt);
        replyText = result.response.text();
      } else {
        replyText = "Maaf, fitur kecerdasan buatan sedang dinonaktifkan oleh Admin saat ini.";
      }
    }

    // ==========================================
    // 5. KIRIM BALASAN KE TELEGRAM
    // ==========================================
    await sendTelegramMessage(chatId, replyText);

    // ==========================================
    // 6. SIMPAN PESAN BOT KE DATABASE
    // ==========================================
    await sql`
      INSERT INTO messages (session_id, sender, content)
      VALUES (${sessionId}, 'bot', ${replyText});
    `;

  } catch (error: any) {
    console.error("❌ Error di Bot Handler:", error.message);
    await sendTelegramMessage(chatId, "Mohon maaf, terjadi kesalahan pada sistem saya saat memproses pesan Anda. 🙏");
  }
}