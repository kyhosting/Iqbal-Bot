import fs from "fs";
import path from "path";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️ ɢᴀʙᴜɴɢ ᴠᴄꜰ$|^\/gabungvcf$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId, `◆ GABUNG VCF\n\n▸ ❌ Akses Ditolak\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1, files: [] };
    bot.sendMessage(chatId, `◆ GABUNG VCF\n(Gabung Multiple File)\n\n▸ Support Format:\n  • VCF (Contact)\n\n▸ Minimal 2 file\n▸ Semua file harus tipe VCF\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();
    const session = sessions[userId];
    if (!session) return;

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      if (/^done$/i.test(text)) {
        if (session.files.length < 2) {
          return bot.sendMessage(chatId, "⚠️ *Minimal 2 file untuk digabung ya Kak* 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        }
        session.step = 2;
        return bot.sendMessage(chatId, `📎 *Masukkan nama file output ya Kak*\n\nTanpa ekstensi .vcf`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ *Harus file VCF ya Kak* 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const buffer = await res.arrayBuffer();
      const localPath = path.join(process.cwd(), msg.document.file_name);
      fs.writeFileSync(localPath, Buffer.from(buffer));

      session.files.push(localPath);
      return bot.sendMessage(chatId, `✅ *File ${msg.document.file_name} disimpan* ✨\n\nKirim file lagi atau ketik \`done\` ya!`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        for (const f of session.files) try { fs.unlinkSync(f); } catch {}
        delete sessions[userId];
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      const outputName = text.trim().replace(/[^a-zA-Z0-9-_]/g, "_") || "gabungan";
      const outputFile = path.join(process.cwd(), `${outputName}.vcf`);

      try {
        mergeVcfFiles(session.files, outputFile);
        await bot.sendDocument(chatId, outputFile);
        bot.sendMessage(chatId, `✅ *File VCF berhasil digabung Kak!* 🎉\n\n📂 *Nama:* \`${outputName}.vcf\`\n📊 *Total file:* ${session.files.length}\n\nSemoga membantu ya! 😊`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        bot.incrementOperation(userId);
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "⚠️ *Yah… gagal gabung file* 😔", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      for (const f of [...session.files, outputFile]) {
        try { fs.unlinkSync(f); } catch {}
      }

      delete sessions[userId];
    }
  });
}

function readVcf(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  const contacts = data.split(/END:VCARD\s*/i).filter(Boolean).map((x) => x.trim() + "\nEND:VCARD");
  return contacts;
}

function mergeVcfFiles(inputFiles, outputFile) {
  let allContacts = [];
  for (const file of inputFiles) {
    const contacts = readVcf(file);
    allContacts = allContacts.concat(contacts);
  }
  fs.writeFileSync(outputFile, allContacts.join("\n"));
}
