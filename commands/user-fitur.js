export default function (bot, db, saveDB) {
  bot.onText(/^\/fitur$/, async (msg) => {
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

    const role = bot.getRole(userId);
    let features = `🎌 *FITUR BOT IQBAL CV*\n\n`;

    features += `*📄 KONVERSI FILE*\n`;
    features += `• ⛓️ TXT TO VCF - Ubah file TXT menjadi format VCF\n`;
    features += `• ⛓️ VCF TO TXT - Ubah file VCF menjadi format TXT\n`;
    features += `• ⛓️ XLS TO VCF - Ubah file Excel/XLSX menjadi VCF\n`;
    features += `• ⛓️ MSG TO TXT - Ekstrak nomor dari pesan\n\n`;

    features += `*📞 EKSTRAK & NOMOR*\n`;
    features += `• ⛓️ EKSTRAK NOMOR - Ambil semua nomor dari file VCF/TXT/XLSX/CSV\n\n`;

    features += `*📦 GABUNG FILE*\n`;
    features += `• ⛓️ GABUNGKAN - Gabung multiple file TXT atau VCF menjadi satu\n\n`;

    features += `*🔧 UTILITAS FILE*\n`;
    features += `• ⛓️ RAPIKAN TXT - Hapus duplikat & sort nomor\n`;
    features += `• ⛓️ HITUNG FILE - Hitung total kontak di file\n`;
    features += `• ⛓️ RENAME FILE - Ganti nama file\n`;
    features += `• ⛓️ RENAME KONTAK - Ganti nama semua kontak\n`;
    features += `• ⛓️ CEK KONTAK - Lihat detail kontak\n\n`;

    if (["owner", "admin"].includes(role)) {
      features += `*👑 ADMIN COMMANDS*\n`;
      features += `• ⛓️ CREATE ADMIN - Buat admin baru (owner only)\n`;
      features += `• ⛓️ MENU OWNER - Panel management owner\n\n`;
    }

    features += `*🎮 COMMAND LAINNYA*\n`;
    features += `• /start - Mulai & lihat profil\n`;
    features += `• /me - Lihat profil user\n`;
    features += `• /fitur - Lihat semua fitur (saat ini)\n`;
    features += `• /bantuan - Hubungi owner untuk bantuan\n\n`;

    features += `💎 *Sistem VIP*\n`;
    features += `Semua fitur premium membutuhkan akses VIP\n`;
    features += `Gunakan kode redeem untuk mendapatkan VIP access! 🎁`;

    await bot.sendMessage(chatId, features, { parse_mode: "Markdown" });
  });
}
