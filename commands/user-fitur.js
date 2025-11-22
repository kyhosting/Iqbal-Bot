export default function (bot, db, saveDB) {
  bot.onText(/^\/fitur$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    const role = bot.getRole(userId);
    
    let features = `🎌 *FITUR BOT IQBAL CV*\n`;
    features += `${'='.repeat(30)}\n\n`;
    features += `📄 *KONVERSI FILE*\n`;
    features += `• ⛓️ TXT TO VCF - Ubah file TXT menjadi format VCF\n`;
    features += `• ⛓️ VCF TO TXT - Ubah file VCF menjadi format TXT\n`;
    features += `• ⛓️ XLS TO VCF - Ubah file Excel/XLSX menjadi VCF\n`;
    features += `• ⛓️ MSG TO TXT - Ekstrak nomor dari pesan Telegram\n\n`;
    features += `${'='.repeat(30)}\n\n`;
    features += `📞 *EKSTRAK & NOMOR*\n`;
    features += `• ⛓️ EKSTRAK NOMOR - Ambil semua nomor dari file VCF/TXT/XLSX/CSV\n\n`;
    features += `${'='.repeat(30)}\n\n`;
    features += `📦 *GABUNG FILE*\n`;
    features += `• ⛓️ GABUNGKAN - Gabung multiple file TXT atau VCF jadi satu\n\n`;
    features += `${'='.repeat(30)}\n\n`;
    features += `🔧 *UTILITAS FILE*\n`;
    features += `• ⛓️ RAPIKAN TXT - Hapus duplikat & sort nomor\n`;
    features += `• ⛓️ HITUNG FILE - Hitung total kontak di file\n`;
    features += `• ⛓️ RENAME FILE - Ganti nama file\n`;
    features += `• ⛓️ RENAME KONTAK - Ganti nama semua kontak dalam file\n`;
    features += `• ⛓️ CEK KONTAK - Lihat detail kontak dari file\n\n`;
    features += `${'='.repeat(30)}\n\n`;
    features += `🎮 *COMMAND LAINNYA*\n`;
    features += `• /start → Mulai & lihat profil\n`;
    features += `• /me → Lihat profil user\n`;
    features += `• /fitur → Lihat semua fitur (saat ini)\n`;
    features += `• /cekid → Cek ID grup/channel/user\n`;
    features += `• /bantuan → Hubungi owner\n`;
    features += `• /clear → Bersihkan chat\n\n`;
    features += `${'='.repeat(30)}\n\n`;
    features += `💎 *SISTEM VIP*\n`;
    features += `Semua fitur premium butuh akses VIP.\n`;
    features += `Gunakan kode redeem untuk VIP access! 🎁\n\n`;
    features += `_Selamat menggunakan bot! 😊_`;

    await bot.sendMessage(chatId, features, { parse_mode: "Markdown" });
  });
}
