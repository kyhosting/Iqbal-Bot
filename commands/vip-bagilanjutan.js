import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};
  const userMessages = {};
  const sessionLanjutan = { split_counter: 1, file_counter: 1 };

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

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  // Helper untuk cek file VCF
  function isVcf(msg) {
    return msg.document && msg.document.file_name.endsWith(".vcf");
  }

  // Helper untuk cek batalkan
  function batals(text) {
    return /^batal$/i.test(text);
  }

  bot.onText(/^⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ ⛓️$|^⛓️ BAGI LANJUT ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    sessionLanjutan.split_counter = 1;
    sessionLanjutan.file_counter = 1;

    await lanjutBagiLanjutan(bot, userId, chatId, userMessages, sessions);
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = sessions[userId];
    if (!session) return;

    const text = msg.text?.trim() || "";

    // Step 1: Upload File VCF
    if (session.step === 1) {
      if (batals(text)) {
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!isVcf(msg)) {
        return await trackMessage(
          userId,
          chatId,
          `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  ⚠️ Kirim file VCF
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      // Download file
      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.step = 2;

      return await trackMessage(
        userId,
        chatId,
        `◆◆  ⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ ⛓️  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // Step 2: Konfirmasi done/batal
    if (session.step === 2) {
      if (batals(text)) {
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!/^done$/i.test(text)) {
        return await trackMessage(
          userId,
          chatId,
          `◆◆  ⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ ⛓️  ◆◆

┌─❖
│  ⚠️ Ketik 'done' atau 'batal'
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.step = 3;
      return await trackMessage(
        userId,
        chatId,
        `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  📎 Masukkan nama file output
│
│  Ketik 'skip' pakai nama lama
│  Ketik 'batal' batalkan
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // Step 3: Output filename
    if (session.step === 3) {
      if (batals(text)) {
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const originalName = path.basename(session.file, ".vcf");
      session.newFileName =
        /^skip$/i.test(text) || !text ? originalName : text.replace(/[^a-zA-Z0-9-_]/g, "_");
      session.step = 4;

      return await trackMessage(
        userId,
        chatId,
        `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  🔢 Angka awal penomoran kontak
│
│  Contoh: 100 → "Nama-100", "Nama-101"
│  Ketik 'batal' batalkan
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // Step 4: Starting contact number
    if (session.step === 4) {
      if (batals(text) || isNaN(parseInt(text))) {
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      sessionLanjutan.split_counter = parseInt(text);
      session.step = 5;

      return await trackMessage(
        userId,
        chatId,
        `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  🔢 Angka awal nama file
│
│  Contoh: 1 → "nama-1.vcf", "nama-2.vcf"
│  Ketik 'batal' batalkan
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // Step 5: Starting file number
    if (session.step === 5) {
      if (batals(text) || isNaN(parseInt(text))) {
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      sessionLanjutan.file_counter = parseInt(text);
      session.step = 6;

      return await trackMessage(
        userId,
        chatId,
        `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  🪓 Berapa jumlah file (bagian)?
│
│  Contoh: 5 → Bagi jadi 5 file
│  Ketik 'batal' batalkan
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // Step 6: Number of parts
    if (session.step === 6) {
      if (batals(text) || isNaN(parseInt(text)) || parseInt(text) <= 0) {
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      const bagian = parseInt(text);
      session.step = 7;

      try {
        const contacts = readVcf(session.file);
        const totalContacts = contacts.length;
        const contactsPerFile = Math.ceil(totalContacts / bagian);

        const dump = [];
        let globalIndex = sessionLanjutan.split_counter;
        let fileIndex = sessionLanjutan.file_counter;

        for (let i = 0; i < bagian; i++) {
          const start = i * contactsPerFile;
          const end = Math.min(start + contactsPerFile, totalContacts);
          const chunk = renameContacts(contacts.slice(start, end), globalIndex);
          const filename = `${session.newFileName}-${fileIndex}.vcf`;
          writeVcf(chunk, filename);
          dump.push(filename);
          globalIndex += chunk.length;
          fileIndex++;
        }

        // Sort files by numeric suffix
        const sortedFiles = dump.sort((a, b) => {
          const numA = parseInt(a.match(/-(\d+)\.vcf/)?.[1] || 0);
          const numB = parseInt(b.match(/-(\d+)\.vcf/)?.[1] || 0);
          return numA - numB;
        });

        // Kirim file BERURUTAN
        for (const f of sortedFiles) {
          await bot.sendDocument(chatId, f);
        }

        // Cleanup
        sortedFiles.forEach((f) => {
          try {
            fs.unlinkSync(f);
          } catch (e) {}
        });
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);

        sessionLanjutan.split_counter = globalIndex;
        sessionLanjutan.file_counter = fileIndex;

        bot.incrementOperation(userId);
        
        const kontakMsg = contacts.length > 0
          ? `\n\n👥 Kontak:\n${contacts.slice(0, 8).map((c, i) => {
              const match = c.match(/FN:(.*)/i);
              const name = match ? match[1].trim() : "Kontak";
              return `${i + 1}. ${name}`;
            }).join("\n")}${contacts.length > 8 ? `\n... dan ${contacts.length - 8} lainnya` : ""}`
          : "";

        return await trackMessage(
          userId,
          chatId,
          `◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File berhasil dibagi
│
│  📊 Total: ${sortedFiles.length} file
│  📊 Total: ${contacts.length} kontak${kontakMsg}
│
│  Ketik 'lanjut' untuk file berikutnya
│  Ketik 'selesai' untuk selesai
└─❖`,
          { parse_mode: "HTML" }
        );
      } catch (err) {
        console.error(err);
        if (session.file && fs.existsSync(session.file)) fs.unlinkSync(session.file);
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Ada masalah saat membagi
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }
    }

    // Step 7: Continue or finish
    if (session.step === 7) {
      if (/^lanjut$/i.test(text)) {
        session.step = 1;
        return await trackMessage(
          userId,
          chatId,
          `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  📤 Kirim file VCF berikutnya
│
│  ℹ️ Nomor kontak melanjut
│  dari sebelumnya 📈
│
│  Ketik 'batal' batalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      if (/^selesai$/i.test(text) || /^done$/i.test(text)) {
        delete sessions[userId];
        return await sendWithDelete(
          userId,
          chatId,
          `◆◆  SELESAI  ◆◆

┌─❖
│  ✅ Semua proses selesai
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      // Default: finish
      delete sessions[userId];
      return await sendWithDelete(
        userId,
        chatId,
        `◆◆  SELESAI  ◆◆

┌─❖
│  ✅ Semua proses selesai
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }
  });
}

// Helper functions
function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return data
    .split(/END:VCARD\s*/i)
    .filter(Boolean)
    .map((x) => x.trim() + "\nEND:VCARD");
}

function extractBaseName(name) {
  return name.replace(/[-_\s]*\d+$/, "");
}

function renameContacts(contacts, startIndex) {
  let index = startIndex;
  return contacts.map((c) => {
    const match = c.match(/FN:(.*)/i);
    if (!match) return c;

    const namaAsli = match[1].trim();
    const namaDasar = extractBaseName(namaAsli);
    const namaBaru = `${namaDasar}-${index}`;
    const updated = c.replace(/FN:(.*)/i, `FN:${namaBaru}`);
    index++;
    return updated;
  });
}

function writeVcf(contacts, filename) {
  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, contacts.join("\n"));
  return outputPath;
}

async function lanjutBagiLanjutan(bot, userId, chatId, userMessages, sessions) {
  sessions[userId] = { step: 1 };
  return await bot.sendMessage(
    chatId,
    `◆◆  BAGI LANJUTAN  ◆◆

┌─❖
│  📤 Kirim file VCF yang mau dibagi
│
│  Ketik 'batal' batalkan
└─❖`,
    { parse_mode: "HTML" }
  );
}
