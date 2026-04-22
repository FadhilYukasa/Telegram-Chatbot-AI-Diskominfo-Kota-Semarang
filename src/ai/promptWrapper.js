export function buildPrompt({
  userMessage,
  recentHistory,
  retrievedItems,
  userProfile
}) {
  const historyText = recentHistory.length
    ? recentHistory.map((m) => `${m.role}: ${m.message}`).join("\n")
    : "-";

  const contextText = retrievedItems.length
    ? retrievedItems.map((x, i) => `[${i + 1}] (${x.source}) ${x.text}`).join("\n")
    : "-";

  const userProfileText = userProfile ? JSON.stringify(userProfile, null, 2) : "-";

  return `
Kamu adalah asisten toko pakaian di Telegram.

Aturan:
- Jawab dalam Bahasa Indonesia.
- Jawab singkat, jelas, dan membantu.
- Jangan mengarang harga, stok, atau kebijakan.
- Gunakan context yang tersedia.
- Jika budget user tidak cukup, beri alternatif.
- Jika user meminta rekomendasi, sesuaikan dengan profile user bila tersedia.

Profil user:
${userProfileText}

Riwayat chat terakhir:
${historyText}

Context hasil retrieval:
${contextText}

Pertanyaan user:
${userMessage}

Buat jawaban final yang natural dan relevan.
`.trim();
}
