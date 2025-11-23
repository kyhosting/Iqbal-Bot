/**
 * 🎌 IQBAL CV BOT - OFFICIAL MODULE 🎌
 * 
 * 🔐 BY: KIFZL & IQBAL DEV
 * 📝 DO NOT RENAME, MODIFY OR REDISTRIBUTE
 * 
 * GitHub: https://github.com/kyhosting/Iqbal-Bot
 * License: MIT (Keep Credits Intact)
 * 
 * ⚠️  Unauthorized modification may result in legal action
 */

export default function (bot) {
  const userMessages = {};

  async function trackMessage(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  bot.onText(/^\/fitur$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk VIP users kak!
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    const message = `◆◆  FITUR BOT IQBAL CV  ◆◆

┌─❖
│  📄 KONVERSI FILE
│
│  ⛓️ TXT TO VCF
│  Ubah TXT jadi VCF
│
│  ⛓️ VCF TO TXT
│  Ubah VCF jadi TXT
│
│  ⛓️ XLS TO VCF
│  Ubah Excel jadi VCF
│
│  ⛓️ MSG TO TXT
│  Ekstrak nomor dari pesan
└─❖

┌─❖
│  📞 EKSTRAK & NOMOR
│
│  ⛓️ EKSTRAK NOMOR
│  Ambil semua nomor dari file
└─❖

┌─❖
│  📦 GABUNG FILE
│
│  ⛓️ GABUNG FILE
│  Gabung multiple file
└─❖

┌─❖
│  🔧 UTILITAS FILE
│
│  ⛓️ RAPIKAN TXT
│  Hapus duplikat & sort
│
│  ⛓️ HITUNG FILE
│  Hitung total kontak
│
│  ⛓️ RENAME FILE
│  Ganti nama file
│
│  ⛓️ RENAME KONTAK
│  Ganti nama semua kontak
│
│  ⛓️ CEK KONTAK
│  Lihat detail kontak
└─❖

┌─❖
│  👑 ADMIN COMMANDS
│
│  ⛓️ CREATE ADMIN
│  Buat admin baru (owner only)
│
│  ⛓️ MENU OWNER
│  Panel management
└─❖

┌─❖
│  🎮 COMMAND LAINNYA
│
│  /start → Mulai & profil
│  /me → Lihat profil
│  /fitur → Semua fitur
│  /cekid → Cek ID
│  /bantuan → Hubungi owner
│  /clear → Bersihkan chat
└─❖

┌─❖
│  💎 SISTEM VIP
│
│  Semua fitur premium butuh VIP
│  Gunakan redeem code untuk akses!
│
│  Selamat menggunakan! 😊
│
│  Ketik 'fitur' untuk list fitur
│  Ketik 'start' untuk mulai
└─❖`;

    await trackMessage(userId, chatId, message, { parse_mode: "HTML" });
  });
}
