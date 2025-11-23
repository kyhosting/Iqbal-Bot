import fs from "fs";
import path from "path";
import { parse } from "vcard-parser";

export default function (bot, db, saveDB) {
  const sessions = {};
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

  bot.onText(/^⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️$|^⛓️ RENAME KONTAK ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(userId, chatId, `◆◆  RENAME KONTAK  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    trackMessage(userId, chatId, `◆◆  RENAME KONTAK  ◆◆

┌─❖
│  Ganti nama kontak
│
│  Kirim file VCF
│
│  Ketik 'batal' untuk batal
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ✅ Operasi dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document) {
        return trackMessage(userId, chatId, `⚠️ Silakan kirim file VCF Kak`, { parse_mode: "HTML" });
      }

      try {
        const fileName = msg.document.file_name || "file.vcf";
        const ext = fileName.split(".").pop().toLowerCase();

        if (ext !== "vcf") {
          return trackMessage(userId, chatId, `❌ Hanya support format VCF`, { parse_mode: "HTML" });
        }

        const fileId = msg.document.file_id;
        const filePath = await bot.getFile(fileId);
        const url = `https://api.telegram.org/file/bot${bot.token}/${filePath.file_path}`;
        
        const response = await fetch(url);
        const content = await response.text();
        const vcards = parse(content);

        session.step = 2;
        session.vcards = vcards;
        session.fileName = fileName;
        
        return trackMessage(userId, chatId, `◆◆  ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`, { parse_mode: "HTML" });
      } catch (err) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `❌ Error: ${err.message}`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    } else if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ✅ Operasi dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!/^done$/i.test(text)) {
        return trackMessage(userId, chatId, `◆◆  ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`, { parse_mode: "HTML" });
      }

      session.step = 3;
      return trackMessage(userId, chatId, `${(() => {
        const vcards = session.vcards;
        let listText = `Kontak di file (${vcards.length}):\n\n`;
        vcards.slice(0, 5).forEach((v, i) => {
          const name = v.fn || `Kontak ${i + 1}`;
          listText += `${i + 1}. ${name}\n`;
        });
        if (vcards.length > 5) listText += `... dan ${vcards.length - 5} lainnya\n`;
        return listText;
      })()}\n\nFormat: \`nomor|nama_baru|nama_baru|...\`\n\nContoh: \`1|John Doe\``, { parse_mode: "HTML" });
    } else if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ✅ Operasi dibatalkan
└─❖`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      try {
        const parts = text.split("|");
        const index = parseInt(parts[0]) - 1;
        const newName = parts[1]?.trim();

        if (isNaN(index) || index < 0 || index >= session.vcards.length) {
          return trackMessage(userId, chatId, `❌ Nomor kontak tidak valid`, { parse_mode: "HTML" });
        }

        if (!newName) {
          return trackMessage(userId, chatId, `❌ Nama tidak boleh kosong`, { parse_mode: "HTML" });
        }

        session.vcards[index].fn = newName;
        
        // Manually reconstruct VCF format
        const updatedVcf = session.vcards.map(v => {
          let vcfText = "BEGIN:VCARD\nVERSION:3.0\n";
          if (v.fn) vcfText += `FN:${v.fn}\n`;
          if (v.n) vcfText += `N:${v.n}\n`;
          if (v.tel) {
            const phones = Array.isArray(v.tel) ? v.tel : [v.tel];
            phones.forEach(p => vcfText += `TEL:${p}\n`);
          }
          if (v.email) {
            const emails = Array.isArray(v.email) ? v.email : [v.email];
            emails.forEach(e => vcfText += `EMAIL:${e}\n`);
          }
          if (v.org) vcfText += `ORG:${v.org}\n`;
          if (v.note) vcfText += `NOTE:${v.note}\n`;
          vcfText += "END:VCARD";
          return vcfText;
        }).join("\n\n");

        const outputPath = path.join("./temp", `renamed_${Date.now()}_${session.fileName}`);
        if (!fs.existsSync("./temp")) fs.mkdirSync("./temp", { recursive: true });
        fs.writeFileSync(outputPath, updatedVcf);

        bot.incrementOperation(userId);
        delete sessions[userId];

        await bot.sendDocument(chatId, outputPath, {
          caption: `✅ Kontak berhasil direname!`,
          reply_markup: bot.getMainKeyboardUser(userId)
        });

        setTimeout(() => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, 5000);
      } catch (err) {
        delete sessions[userId];
        return trackMessage(userId, chatId, `❌ Error: ${err.message}`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }
    }
  });
}
