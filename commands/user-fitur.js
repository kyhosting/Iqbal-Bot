export default function (bot, db, saveDB) {
  bot.onText(/^\/fitur$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ <b>Akses Ditolak</b>\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "HTML" }
      );
    }

    const role = bot.getRole(userId);
    
    let features = `🎌 <b>FITUR BOT IQBAL CV</b>\n`;
    features += `${'='.repeat(30)}\n\n`;

    features += `📄 <b>KONVERSI FILE</b>\n`;
    features += `• ⛓️ TXT TO VCF\n  Ubah file TXT menjadi format VCF\n\n`;
    features += `• ⛓️ VCF TO TXT\n  Ubah file VCF menjadi format TXT\n\n`;
    features += `• ⛓️ XLS TO VCF\n  Ubah file Excel/XLSX menjadi VCF\n\n`;
    features += `• ⛓️ MSG TO TXT\n  Ekstrak nomor dari pesan Telegram\n\n`;

    features += `${'='.repeat(30)}\n\n`;
    features += `📞 <b>EKSTRAK & NOMOR</b>\n`;
    features += `• ⛓️ EKSTRAK NOMOR\n  Ambil semua nomor dari file VCF/TXT/XLSX/CSV\n\n`;

    features += `${'='.repeat(30)}\n\n`;
    features += `📦 <b>GABUNG FILE</b>\n`;
    features += `• ⛓️ GABUNGKAN\n  Gabung multiple file TXT atau VCF jadi satu\n\n`;

    features += `${'='.repeat(30)}\n\n`;
    features += `🔧 <b>UTILITAS FILE</b>\n`;
    features += `• ⛓️ RAPIKAN TXT\n  Hapus duplikat & sort nomor\n\n`;
    features += `• ⛓️ HITUNG FILE\n  Hitung total kontak di file\n\n`;
    features += `• ⛓️ RENAME FILE\n  Ganti nama file\n\n`;
    features += `• ⛓️ RENAME KONTAK\n  Ganti nama semua kontak dalam file\n\n`;
    features += `• ⛓️ CEK KONTAK\n  Lihat detail kontak dari file\n\n`;

    if (["owner", "admin"].includes(role)) {
      features += `${'='.repeat(30)}\n\n`;
      features += `👑 <b>ADMIN COMMANDS</b>\n`;
      features += `• ⛓️ CREATE ADMIN\n  Buat admin baru (owner only)\n\n`;
      features += `• ⛓️ MENU OWNER\n  Panel management untuk owner\n\n`;
    }

    features += `${'='.repeat(30)}\n\n`;
    features += `🎮 <b>COMMAND LAINNYA</b>\n`;
    features += `• /start → Mulai & lihat profil\n`;
    features += `• /me → Lihat profil user\n`;
    features += `• /fitur → Lihat semua fitur (saat ini)\n`;
    features += `• /cekid → Cek ID grup/channel/user\n`;
    features += `• /bantuan → Hubungi owner\n`;
    features += `• /clear → Bersihkan chat\n\n`;

    features += `${'='.repeat(30)}\n\n`;
    features += `💎 <b>SISTEM VIP</b>\n`;
    features += `Semua fitur premium butuh akses VIP.\n`;
    features += `Gunakan kode redeem untuk VIP access! 🎁\n\n`;
    features += `_Selamat menggunakan bot! 😊_`;

    await bot.sendMessage(chatId, features, { parse_mode: "HTML" });
  });
}
