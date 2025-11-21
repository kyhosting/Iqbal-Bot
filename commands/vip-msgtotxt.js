import fs from "fs";
import path from "path";

export default function (bot) {
  // Simpan sesi percakapan user
  const sessions = {};

  bot.onText(/^\/msgtotxt$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Batasi akses
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        "❌ Kamu tidak punya akses untuk menggunakan fitur ini.\n\nHubungi @oktodev untuk upgrade ke VIP.",
        { parse_mode: "HTML" }
      );
    }

    // Mulai sesi
    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      "📨 <b>Masukkan teks atau nomor yang ingin diubah menjadi file .txt</b>\n\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
    );
  });

  // Handler untuk semua pesan user selama sesi aktif
  bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return; // Tidak sedang dalam sesi

    const session = sessions[userId];

    // Step 1: Input teks untuk isi file
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      session.content = text;
      session.step = 2;
      return bot.sendMessage(
        chatId,
        "📝 <b>Masukkan nama file baru (tanpa .txt)</b>:\n\nKetik <code>batal</code> untuk membatalkan.",
        { parse_mode: "HTML" }
      );
    }

    // Step 2: Input nama file
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const filename = text.replace(/[^a-zA-Z0-9-_]/g, "_") + ".txt";
      const filepath = path.join(process.cwd(), filename);

      try {
        fs.writeFileSync(filepath, session.content);

        bot
          .sendDocument(chatId, filepath, {}, { filename })
          .then(() => {
            bot.sendMessage(
              chatId,
              "✅ <b>Selesai!</b> Pesan berhasil diubah menjadi file TXT.",
              { parse_mode: "HTML" }
            );
            fs.unlinkSync(filepath); // hapus file setelah dikirim
          })
          .catch((err) => {
            console.error("Gagal kirim file:", err);
            bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mengirim file.");
            try {
              fs.unlinkSync(filepath);
            } catch {}
          });
      } catch (err) {
        console.error("Gagal membuat file:", err);
        bot.sendMessage(chatId, "⚠️ Gagal membuat file TXT.");
      }

      delete sessions[userId];
    }
  });
}