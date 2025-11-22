import fs from "fs";
import path from "path";

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/bagivcf$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Hanya bisa digunakan oleh owner, admin, vip
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        "❌ Kamu tidak punya akses ke fitur ini.\n\nHubungi @oktodev untuk upgrade ke VIP.",
        { parse_mode: "HTML" }
      );
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      "📤 <b>Kirim file .vcf yang ingin kamu bagi</b>\n\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // Step 1 → Kirim file
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ Kirim file dengan ekstensi .vcf!");
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".vcf", "");
      session.step = 2;

      return bot.sendMessage(
        chatId,
        "📎 <b>Masukkan nama file baru (tanpa .vcf)</b>\nKetik <code>skip</code> untuk pakai nama lama.",
        { parse_mode: "HTML" }
      );
    }

    // Step 2 → Input nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      session.newFileName = /^skip$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return bot.sendMessage(chatId, "🔢 <b>Masukkan berapa jumlah file hasil potongan</b>:", {
        parse_mode: "HTML",
      });
    }

    // Step 3 → Input jumlah file hasil
    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const jumlahFile = parseInt(text);
      if (isNaN(jumlahFile) || jumlahFile <= 0) {
        return bot.sendMessage(chatId, "⚠️ Masukkan angka yang valid!");
      }

      try {
        const hasil = splitCutVcf(session.file, session.newFileName, jumlahFile);

        for (const f of hasil) {
          await bot.sendDocument(chatId, f);
          fs.unlinkSync(f);
        }

        fs.unlinkSync(session.file);

        bot.sendMessage(
          chatId,
          `✅ <b>File berhasil dibagi menjadi ${hasil.length} bagian.</b>`,
          { parse_mode: "HTML" }
        );
      } catch (err) {
        console.error("Gagal membagi file:", err);
        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat membagi file.");
      }

      delete sessions[userId];
    }
  });
}

// ===== Fungsi Pendukung =====

// Membaca isi VCF dan pisahkan menjadi array kontak
function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const contacts = data
    .split(/END:VCARD\s*/i)
    .filter(Boolean)
    .map((x) => x.trim() + "\nEND:VCARD");
  return contacts;
}

// Tulis ulang VCF dengan array kontak
function writeVcf(contacts, filePath) {
  fs.writeFileSync(filePath, contacts.join("\n"));
}

// Membagi VCF berdasarkan jumlah file yang diinginkan
function splitCutVcf(inputFile, baseName, totalFiles = 2) {
  const contacts = readVcf(inputFile);
  const totalContacts = contacts.length;
  const perFile = Math.ceil(totalContacts / totalFiles);
  const files = [];

  for (let i = 0; i < totalFiles; i++) {
    const start = i * perFile;
    const end = Math.min(start + perFile, totalContacts);
    const chunk = contacts.slice(start, end);
    const fileName = `${baseName}-${i + 1}.vcf`;
    writeVcf(chunk, fileName);
    files.push(path.join(process.cwd(), fileName));
  }

  return files;
}