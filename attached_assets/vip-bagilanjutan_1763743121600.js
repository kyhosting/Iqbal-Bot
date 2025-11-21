import fs from "fs";
import path from "path";

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/bagilanjutan$/, (msg) => {
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

    sessions[userId] = {
      step: 1,
      splitCounter: 1,
      fileCounter: 1,
    };

    bot.sendMessage(
      chatId,
      "📤 <b>Kirim file .vcf yang ingin dibagi</b>\n\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    // STEP 1 → Kirim file .vcf
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
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".vcf", "");
      session.step = 2;

      bot.sendMessage(
        chatId,
        "📎 <b>Masukkan nama file output</b>\nKetik <code>skip</code> untuk pakai nama lama.",
        { parse_mode: "HTML" }
      );
      return;
    }

    // STEP 2 → Input nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      session.newFileName =
        /^skip$/i.test(text) || !text
          ? session.originalName
          : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = session.splitCounter === 1 ? 3 : 5;

      if (session.splitCounter === 1) {
        bot.sendMessage(chatId, "🔢 <b>Masukkan angka awal penomoran kontak:</b>", {
          parse_mode: "HTML",
        });
      } else {
        bot.sendMessage(chatId, "🪓 <b>Masukkan jumlah file (bagian) yang ingin dibuat:</b>", {
          parse_mode: "HTML",
        });
      }
      return;
    }

    // STEP 3 → Angka awal penomoran kontak
    if (session.step === 3) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }
      session.splitCounter = parseInt(text);
      session.step = 4;
      bot.sendMessage(chatId, "🔢 <b>Masukkan angka awal nama file:</b>", {
        parse_mode: "HTML",
      });
      return;
    }

    // STEP 4 → Angka awal nama file
    if (session.step === 4) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text))) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }
      session.fileCounter = parseInt(text);
      session.step = 5;
      bot.sendMessage(chatId, "🪓 <b>Masukkan jumlah file (bagian) yang ingin dibuat:</b>", {
        parse_mode: "HTML",
      });
      return;
    }

    // STEP 5 → Jumlah file (bagian)
    if (session.step === 5) {
      if (/^batal$/i.test(text) || isNaN(parseInt(text)) || parseInt(text) <= 0) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan.");
      }

      const bagian = parseInt(text);
      try {
        const hasil = splitVcfByPart(
          session.file,
          session.newFileName,
          bagian,
          session.splitCounter,
          session.fileCounter
        );

        for (const f of hasil.files) {
          await bot.sendDocument(chatId, f);
          fs.unlinkSync(f);
        }

        session.splitCounter = hasil.nextIndex;
        session.fileCounter = hasil.nextFile;
        fs.unlinkSync(session.file);

        session.step = 6;
        bot.sendMessage(
          chatId,
          "✅ <b>Selesai membagi.</b>\n\nKetik <code>lanjut</code> untuk lanjut file berikutnya, atau <code>selesai</code> untuk berhenti.",
          { parse_mode: "HTML" }
        );
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat membagi file.");
      }
      return;
    }

    // STEP 6 → Lanjut atau selesai
    if (session.step === 6) {
      if (/^lanjut$/i.test(text)) {
        session.step = 1;
        bot.sendMessage(
          chatId,
          "📤 <b>Kirim file VCF berikutnya.</b>\n\nKetik <code>batal</code> untuk membatalkan.",
          { parse_mode: "HTML" }
        );
        return;
      }

      delete sessions[userId];
      return bot.sendMessage(chatId, "✅ Semua proses selesai.");
    }
  });
}

// ===== Fungsi Pendukung =====

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

function splitVcfByPart(filePath, baseName, parts, startIndex, startFile) {
  const contacts = readVcf(filePath);
  const total = contacts.length;
  const perFile = Math.ceil(total / parts);
  const hasil = [];
  let nextIndex = startIndex;
  let nextFile = startFile;

  for (let i = 0; i < total; i += perFile) {
    const chunk = renameContacts(contacts.slice(i, i + perFile), nextIndex);
    const fileName = `${baseName}-${nextFile}.vcf`;
    const outputPath = path.join(process.cwd(), fileName);
    fs.writeFileSync(outputPath, chunk.join("\n"));
    hasil.push(outputPath);

    nextIndex += chunk.length;
    nextFile++;
  }

  return { files: hasil, nextIndex, nextFile };
}