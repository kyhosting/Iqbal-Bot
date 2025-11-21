import fs from "fs";
import path from "path";

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/potongvcf$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Hanya untuk VIP, admin, owner
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        "❌ Kamu tidak punya akses ke fitur ini.\n\nHubungi @oktodev untuk upgrade ke VIP.",
        { parse_mode: "HTML" }
      );
    }

    sessions[userId] = { step: 1, splitCounter: 1, fileCounter: 1 };
    bot.sendMessage(chatId, "📤 <b>Kirim file .vcf yang ingin kamu potong</b>\n\nKetik <code>batal</code> untuk membatalkan.", {
      parse_mode: "HTML",
    });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // Step 1: Kirim file .vcf
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
      session.step = 2;

      return bot.sendMessage(chatId, "📎 <b>Masukkan nama file output (tanpa .vcf)</b>\nKetik <code>skip</code> untuk gunakan nama file asli.", {
        parse_mode: "HTML",
      });
    }

    // Step 2: Nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const originalName = path.basename(session.file, ".vcf");
      session.outputName = /^skip$/i.test(text)
        ? originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return bot.sendMessage(chatId, "🔢 <b>Masukkan jumlah kontak per file</b>:", { parse_mode: "HTML" });
    }

    // Step 3: Jumlah kontak per file
    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const jumlah = parseInt(text);
      if (isNaN(jumlah) || jumlah <= 0) {
        return bot.sendMessage(chatId, "⚠️ Masukkan angka yang valid.");
      }

      try {
        const hasil = splitVcfSession(session.file, session.outputName, jumlah, session.splitCounter, session.fileCounter);

        for (const f of hasil.files) {
          await bot.sendDocument(chatId, f);
          fs.unlinkSync(f);
        }

        fs.unlinkSync(session.file);
        session.splitCounter = hasil.nextIndex;
        session.fileCounter = hasil.nextFileIndex;

        bot.sendMessage(chatId, `✅ Selesai memotong hingga ${session.splitCounter - 1} kontak.`);
      } catch (err) {
        console.error("Gagal memotong:", err);
        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memotong file.");
      }

      delete sessions[userId];
    }
  });
}

// ===== Fungsi Pendukung =====

// Baca file VCF jadi array kontak
function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const contacts = data.split(/END:VCARD\s*/i).filter(Boolean).map(x => x.trim() + "\nEND:VCARD");
  return contacts;
}

// Rename kontak dengan urutan baru
function renameContacts(contacts, startIndex = 1) {
  return contacts.map((entry, i) => {
    return entry.replace(/FN:.*/i, `FN:Contact-${String(startIndex + i).padStart(4, "0")}`);
  });
}

// Tulis VCF baru
function writeVcf(contacts, filePath) {
  fs.writeFileSync(filePath, contacts.join("\n"));
}

// Bagi file VCF jadi beberapa
function splitVcfSession(inputFile, baseName, perFile = 100, startIndex = 1, startFile = 1) {
  const contacts = readVcf(inputFile);
  const total = contacts.length;
  const fileCount = Math.ceil(total / perFile);
  const files = [];
  let globalIndex = startIndex;
  let fileIndex = startFile;

  for (let i = 0; i < fileCount; i++) {
    const start = i * perFile;
    const end = Math.min(start + perFile, total);
    const chunk = renameContacts(contacts.slice(start, end), globalIndex);
    const fileName = `${baseName}-${fileIndex}.vcf`;
    writeVcf(chunk, fileName);
    files.push(path.join(process.cwd(), fileName));
    globalIndex += chunk.length;
    fileIndex++;
  }

  return {
    files,
    nextIndex: globalIndex,
    nextFileIndex: fileIndex,
  };
}