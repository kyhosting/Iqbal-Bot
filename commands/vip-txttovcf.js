import fs from "fs";
import path from "path";

// Fungsi pembuat file VCF
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

  bot.onText(/^⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ ⛓️$|^\/txttovcf$/i, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Batasi akses hanya untuk owner/admin/vip
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(
        chatId,
        `◆◆  TXT TO VCF  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(
      chatId,
      `◆◆  TXT TO VCF  ◆◆

┌─❖
│  📤 Kirim file .txt
│
│  Format: nama◆nomor per baris
│
│  Ketik 'batal' batalkan
└─❖`,
      { parse_mode: "HTML" }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];

    if (!session) return;

    // Step 1 → Kirim file txt
    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      if (!msg.document || !msg.document.file_name.endsWith(".txt")) {
        return bot.sendMessage(
          chatId,
          `◆◆  TXT TO VCF  ◆◆

┌─❖
│  ⚠️ Kirim file .txt
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

      // Unduh file txt
      const res = await fetch(filePath);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.file = localPath;
      session.originalName = msg.document.file_name.replace(".txt", "");
      session.step = 2;

      return bot.sendMessage(
        chatId,
        `◆◆  TXT TO VCF  ◆◆

┌─❖
│  📝 Nama File Output
│
│  Ketik 'skip' pakai nama lama
│  Ketik 'batal' batalkan
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // Step 2 → Input nama file output
    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      session.newFileName = /^skip$/i.test(text)
        ? session.originalName
        : text.trim().replace(/[^a-zA-Z0-9-_]/g, "_");

      session.step = 3;
      return bot.sendMessage(
        chatId,
        `◆◆  TXT TO VCF  ◆◆

┌─❖
│  📇 Masukkan Nama Kontak Dasar
│
│  Contoh Input:
│  ➤ Customer
│
│  Catatan:
│  • Ketik skip untuk memakai nama dari nama file
│  • Ketik batal untuk membatalkan proses
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    // Step 3 → Input nama kontak
    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        fs.unlinkSync(session.file);
        delete sessions[userId];
        return bot.sendMessage(
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      session.contactName = /^skip$/i.test(text)
        ? session.newFileName
        : text.trim();

      // Proses konversi
      try {
        const content = fs.readFileSync(session.file, "utf8");
        const numbers = content
          .split(/\s+/)
          .map((x) => x.replace(/[^\d+]/g, ""))
          .filter((x) => x && /^\+?\d+$/.test(x));

        if (numbers.length === 0) {
          fs.unlinkSync(session.file);
          delete sessions[userId];
          return bot.sendMessage(
            chatId,
            `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Tidak ada nomor valid
└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        }

        const outputFile = `${session.newFileName}.vcf`;
        const outputPath = path.join(process.cwd(), outputFile);
        const kontakList = [];
        const vcfData = numbers
          .map((num, i) => {
            const name = `${session.contactName}-${i + 1}`;
            kontakList.push(name);
            return createVcfEntry(num, name);
          })
          .join("\n");
        fs.writeFileSync(outputPath, vcfData);

        await bot.sendDocument(chatId, outputPath);

        const kontakMsg = kontakList.length > 0
          ? `\n\n👥 Kontak:\n${kontakList.slice(0, 10).map((k, i) => `${i + 1}. ${k}`).join("\n")}${kontakList.length > 10 ? `\n... dan ${kontakList.length - 10} lainnya` : ""}`
          : "";

        await bot.sendMessage(
          chatId,
          `◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File VCF dibuat
│
│  📊 Total: ${numbers.length} kontak${kontakMsg}
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );

        fs.unlinkSync(outputPath);
        fs.unlinkSync(session.file);
        bot.incrementOperation(userId);
      } catch (err) {
        console.error("Gagal convert:", err);
        bot.sendMessage(
          chatId,
          `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Ada masalah
└─❖`,
          { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
        );
      }

      delete sessions[userId];
    }
  });
}
