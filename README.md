# Telegram AI Bot (Bun.js + Polling + JSON RAG)

Versi ini memakai **Telegram polling**, jadi **tidak perlu webhook** dan **tidak perlu ngrok**. Cocok untuk jalan di laptop langsung.

## 1) Install Bun
### Windows (PowerShell)
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Tutup VS Code lalu buka lagi. Cek:
```powershell
bun --version
```

## 2) Masuk ke folder project
```powershell
cd telegram-ai-bot-bun-polling
```

## 3) Install dependency
```powershell
bun install
```

## 4) Buat file env
```powershell
copy .env.example .env
```

Isi minimal:
- `TELEGRAM_BOT_TOKEN=...`
- `GEMINI_API_KEY=...` (opsional untuk AI asli)
- `ENABLE_GEMINI=true` atau `false`

Kalau belum punya Gemini key, set:
```env
ENABLE_GEMINI=false
```
Bot tetap jalan dengan fallback lokal.

## 5) Jalankan bot
```powershell
bun run dev
```

## 6) Test
Buka Telegram, chat ke bot:
- `halo`
- `ada kaos casual?`
- `saya suka formal`
- `budget saya 100 ribu`
- `saya mahasiswa cari outfit casual`

## Output jika berhasil
Di terminal akan muncul:
```text
[INFO] Bot polling started
[INFO] Bot info: @nama_bot
[INFO] Update received message_id=...
[INFO] Retrieval hit count: 5
[INFO] Reply sent to chatId=...
```

## File yang berubah saat bot dipakai
- `src/db/data/chats.json` -> riwayat chat
- `src/db/data/users.json` -> preferensi user, budget, occupation
- `src/db/data/learned_knowledge.json` -> knowledge baru hasil obrolan

## Struktur ringkas
- `src/app.js` -> entry point
- `src/bot/poller.js` -> long polling Telegram
- `src/bot/handler.js` -> alur utama pesan
- `src/ai/gemini.js` -> Gemini + fallback lokal
- `src/ai/promptWrapper.js` -> prompt wrapper
- `src/rag/retriever.js` -> retrieval dari JSON
- `src/services/learningService.js` -> simpan memory/knowledge baru

## Catatan
- Tidak perlu webhook
- Tidak perlu ngrok
- JSON dipakai sebagai database awal
- Cocok untuk MVP/testing lokal
