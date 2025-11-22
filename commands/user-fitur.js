export default function (bot) {
  bot.onText(/^\/fitur$/, async (msg) => {
    const chatId = msg.chat.id;

    const message = `🎌 FITUR BOT IQBAL CV
==============================

📄 KONVERSI FILE
• ⛓️ TXT TO VCF
  Ubah file TXT menjadi format VCF

• ⛓️ VCF TO TXT
  Ubah file VCF menjadi format TXT

• ⛓️ XLS TO VCF
  Ubah file Excel/XLSX menjadi VCF

• ⛓️ MSG TO TXT
  Ekstrak nomor dari pesan Telegram

==============================

📞 EKSTRAK & NOMOR
• ⛓️ EKSTRAK NOMOR
  Ambil semua nomor dari file VCF/TXT/XLSX/CSV

==============================

📦 GABUNG FILE
• ⛓️ GABUNGKAN
  Gabung multiple file TXT atau VCF jadi satu

==============================

🔧 UTILITAS FILE
• ⛓️ RAPIKAN TXT
  Hapus duplikat & sort nomor

• ⛓️ HITUNG FILE
  Hitung total kontak di file

• ⛓️ RENAME FILE
  Ganti nama file

• ⛓️ RENAME KONTAK
  Ganti nama semua kontak dalam file

• ⛓️ CEK KONTAK
  Lihat detail kontak dari file

==============================

👑 ADMIN COMMANDS
• ⛓️ CREATE ADMIN
  Buat admin baru (owner only)

• ⛓️ MENU OWNER
  Panel management untuk owner

==============================

🎮 COMMAND LAINNYA
• /start → Mulai & lihat profil
• /me → Lihat profil user
• /fitur → Lihat semua fitur (saat ini)
• /cekid → Cek ID grup/channel/user
• /bantuan → Hubungi owner
• /clear → Bersihkan chat

==============================

💎 SISTEM VIP
Semua fitur premium butuh akses VIP.
Gunakan kode redeem untuk VIP access! 🎁

Selamat menggunakan bot! 😊`;

    await bot.sendMessage(chatId, message);
  });
}
