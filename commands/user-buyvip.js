import config from "../config.js";

export default function (bot, db, saveDB) {
  const OWNER_USERNAME = config.ownerUsername;

  bot.onText(/^\/buyvip$|^💎 BELI VIP$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    // Create deep-link URLs dengan pesan pre-filled untuk setiap paket
    const vip7Message = `Halo Owner, saya ingin membeli VIP.\n\n• Harga yang saya pilih: VIP 7 Hari (15K)\n• User ID saya: ${userId}\n\nMohon diproses ya 🙏`;
    const vip30Message = `Halo Owner, saya ingin membeli VIP.\n\n• Harga yang saya pilih: VIP 30 Hari (35K)\n• User ID saya: ${userId}\n\nMohon diproses ya 🙏`;
    const vip1yMessage = `Halo Owner, saya ingin membeli VIP.\n\n• Harga yang saya pilih: VIP 1 Tahun (100K)\n• User ID saya: ${userId}\n\nMohon diproses ya 🙏`;

    const vip7Url = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(vip7Message)}`;
    const vip30Url = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(vip30Message)}`;
    const vip1yUrl = `https://t.me/${OWNER_USERNAME}?text=${encodeURIComponent(vip1yMessage)}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "💎 VIP 7 Hari — 15K", url: vip7Url }
        ],
        [
          { text: "💎 VIP 30 Hari — 35K", url: vip30Url }
        ],
        [
          { text: "💎 VIP 1 Tahun — 100K", url: vip1yUrl }
        ]
      ]
    };

    let message = `💎 *DAFTAR PAKET VIP*\n\n`;
    message += `${'═'.repeat(35)}\n\n`;
    message += `✨ *PAKET VIP TERSEDIA:*\n\n`;
    
    message += `📌 *PAKET 7 HARI*\n`;
    message += `├─ Harga: Rp 15.000\n`;
    message += `└─ Akses: Semua fitur selama 7 hari\n\n`;

    message += `📌 *PAKET 30 HARI* ⭐ PALING POPULER\n`;
    message += `├─ Harga: Rp 35.000\n`;
    message += `└─ Akses: Semua fitur selama 30 hari\n\n`;

    message += `📌 *PAKET 1 TAHUN*\n`;
    message += `├─ Harga: Rp 100.000\n`;
    message += `└─ Akses: Semua fitur selama 1 tahun\n\n`;

    message += `${'═'.repeat(35)}\n\n`;
    message += `🎯 *FITUR VIP YANG DIDAPATKAN:*\n`;
    message += `✓ Konversi file tanpa batas\n`;
    message += `✓ Ekstrak nomor (unlimited)\n`;
    message += `✓ Gabung & split file\n`;
    message += `✓ Rapikan & clean data\n`;
    message += `✓ Rename & manage file\n`;
    message += `✓ Dan fitur premium lainnya!\n\n`;

    message += `💳 *CARA PEMBAYARAN:*\n`;
    message += `Transfer ke rekening owner\n`;
    message += `Hubungi owner untuk info detail\n\n`;

    message += `_Klik tombol di bawah untuk membeli! 😊_`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
  });
}
