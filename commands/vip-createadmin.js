import fs from "fs";
import path from "path";

// Fungsi pembuat format VCF
function createVcfEntry(phone, name) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `TEL;TYPE=CELL:+${phone.replace(/\D/g, "")}`,
    "END:VCARD",
  ].join("\n");
}

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/createadmin$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Hanya VIP, Admin, Owner yang boleh
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        "❌ Kamu tidak punya akses ke fitur ini.\n\nHubungi @oktodev untuk mendapatkan akses VIP.",
        { parse_mode: "HTML" }
      );
    }

    // Mulai sesi input nomor
    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      "📨 <b>Masukkan daftar nomor admin</b> (pisahkan dengan spasi jika lebih dari satu)\n\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
    );
  });

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return;
    const session = sessions[userId];

    // Step 1: Input nomor admin
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const numbers = text.split(/\s+/).filter(Boolean);
      if (numbers.length === 0) {
        return bot.sendMessage(chatId, "⚠️ Nomor tidak boleh kosong. Coba lagi.");
      }

      const filename = "ADMIN.vcf";
      const filepath = path.join(process.cwd(), filename);

      try {
        const content = numbers
          .map((num, i) => createVcfEntry(num, `ADMIN-${String(i + 1).padStart(4, "0")}`))
          .join("\n");
        fs.writeFileSync(filepath, content);

        bot
          .sendDocument(chatId, filepath)
          .then(() => {
            bot.sendMessage(
              chatId,
              `✅ <b>Hai ${msg.from.first_name}!</b>\n\nFile <b>ADMIN.vcf</b> berhasil dibuat.`,
              { parse_mode: "HTML" }
            );
            fs.unlinkSync(filepath); // hapus setelah dikirim
          })
          .catch((err) => {
            console.error("Gagal mengirim file:", err);
            bot.sendMessage(chatId, "⚠️ Gagal mengirim file.");
            try {
              fs.unlinkSync(filepath);
            } catch {}
          });
      } catch (err) {
        console.error("Gagal membuat file:", err);
        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat membuat file VCF.");
      }

      delete sessions[userId];
    }
  });
}