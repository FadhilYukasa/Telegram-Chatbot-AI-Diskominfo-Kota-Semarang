export function localReply({ userMessage, retrievedItems, userProfile }) {
  const text = String(userMessage || "").toLowerCase();

  const products = retrievedItems
    .filter((x) => x.source === "product")
    .map((x) => x.item);

  if (text.includes("budget")) {
    const match = text.match(/(\d+[\d\.]*)/);
    const budget = match ? Number(match[1].replace(/\./g, "")) : null;
    if (budget) {
      const affordable = products
        .filter((p) => Number(p.price) <= budget)
        .sort((a, b) => a.price - b.price)
        .slice(0, 3);
      if (affordable.length) {
        const lines = affordable.map((p) => `- ${p.name} (${p.size}) Rp${p.price}, stok ${p.stock}`);
        return `Budget kamu sekitar Rp${budget}. Produk yang masih masuk budget:\n${lines.join("\n")}`;
      }
      return `Budget kamu sekitar Rp${budget}, tapi saya belum menemukan produk yang cocok di data saat ini.`;
    }
  }

  if (text.includes("formal") || text.includes("casual") || text.includes("outfit")) {
    if (products.length) {
      const lines = products.slice(0, 3).map((p) => `- ${p.name} (${p.style}, size ${p.size}) Rp${p.price}`);
      const profileText = userProfile?.occupation ? ` untuk profile ${userProfile.occupation}` : "";
      return `Saya menemukan beberapa rekomendasi${profileText}:\n${lines.join("\n")}`;
    }
  }

  if (products.length) {
    const lines = products.slice(0, 3).map((p) => `- ${p.name} (${p.style}) Rp${p.price}, stok ${p.stock}`);
    return `Saya menemukan data yang relevan:\n${lines.join("\n")}`;
  }

  return "Saya belum menemukan data yang tepat. Coba tanyakan produk, style, atau budget kamu dengan lebih spesifik.";
}
