import fs from "fs";
import path from "path";

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/gabungtxt$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Hanya untuk owner, admin, vip
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        "❌ Kamu tidak punya akses ke fitur ini.\n\nHubungi @oktodev untuk upgrade ke VIP.",
        { parse_mode: "HTML" }
      );
    }

    sessions[userId] = { step: 1, files: [] };

    bot.sendMessage(
      chatId,
      "📥 <b>Kirim file .txt yang ingin kamu gabung</b>\n\nKetik <code>done</code> setelah minimal 2 file dikirim.\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // Step 1 → Kirim file satu per satu
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      if (/^done$/i.test(text)) {
        if (session.files.length < 2) {
          return bot.sendMessage(chatId, "⚠️ Minimal 2 file untuk digabung!");
        }
        session.step = 2;
        return bot.sendMessage(
          chatId,
          "📎 <b>Masukkan nama file output (tanpa .txt):</b>",
          { parse_mode: "HTML" }
        );
      }

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(chatId, "⚠️ Kirim file dengan ekstensi .txt!");
      }

      // Download file
      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.files.push(localPath);
      return bot.sendMessage(chatId, `✅ File <b>${msg.document.file_name}</b> disimpan.`, {
        parse_mode: "HTML",
      });
    }

    // Step 2 → Input nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const outputName = text.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "gabungan";
      const outputFile = path.join(process.cwd(), `${outputName}.txt`);

      try {
        mergeTxtFiles(session.files, outputFile);
        await bot.sendDocument(chatId, outputFile);
        bot.sendMessage(
          chatId,
          `✅ <b>Berhasil digabung!</b>\n\nTotal file: ${session.files.length}\nOutput: <code>${outputName}.txt</code>`,
          { parse_mode: "HTML" }
        );
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ Gagal menggabungkan file!");
      }

      // Bersihkan file sementara
      for (const f of [...session.files, outputFile]) {
        try { fs.unlinkSync(f); } catch {}
      }

      delete sessions[userId];
    }
  });
}

// ===== Fungsi Pendukung =====

function mergeTxtFiles(inputFiles, outputFile) {
  let result = "";
  for (const file of inputFiles) {
    result += fs.readFileSync(file, "utf8") + "\n";
  }
  fs.writeFileSync(outputFile, result);
}