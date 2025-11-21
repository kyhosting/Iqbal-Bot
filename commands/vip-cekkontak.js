import fs from "fs";
import path from "path";
import { parse } from "vcard-parser";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️CEK KONTAK$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📤 *Cek Kontak VCF*\n\nKirim file VCF yang mau dicek nama kontaknya ya Kak ✨\n\nKetik \`batal\` untuk membatalkan`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
  });

  bot.onText(/^\/cekkontak$|^\/ceknamakontak$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip"].includes(role)) {
      return bot.sendMessage(chatId, `❌ *Yah… fitur ini khusus VIP nih Kak* 😔`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `📤 *Cek Kontak VCF*\n\nKirim file VCF yang mau dicek nama kontaknya ya Kak ✨\n\nKetik \`batal\` untuk membatalkan`, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
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
        return bot.sendMessage(chatId, "❌ Proses dibatalkan ya Kak 😊", { reply_markup: bot.getMainKeyboard() });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ *Harus file VCF ya Kak* 😊", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
      }

      try {
        const fileId = msg.document.file_id;
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        const res = await fetch(fileUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        const localPath = path.join(process.cwd(), msg.document.file_name);

        fs.writeFileSync(localPath, buffer);
        session.file = localPath;

        const data = fs.readFileSync(localPath, "utf8");
        let parsed = parse(data);

        parsed = Array.isArray(parsed) ? parsed : [parsed];

        const namaKontak = parsed.filter((c) => c.fn && c.fn.value && c.fn.value.trim()).map((c) => c.fn.value.trim());
        const total = namaKontak.length;

        if (total === 0) {
          fs.unlinkSync(localPath);
          delete sessions[userId];
          return bot.sendMessage(chatId, "⚠️ *Tidak ditemukan nama kontak di file ini Kak* 😔", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        }

        let hasil = `📋 *Daftar Kontak:*\n\n📊 *Total: ${total} kontak*\n\n`;
        hasil += namaKontak.slice(0, 100).map((nama, i) => `${i + 1}. ${nama}`).join("\n");

        if (total > 100) hasil += `\n\n⚠️ Ditampilkan 100 dari ${total} kontak.`;

        await bot.sendMessage(chatId, hasil, { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        bot.incrementOperation(userId);

        if (total > 100) {
          const txtPath = path.join(process.cwd(), `nama_kontak_${Date.now()}.txt`);
          fs.writeFileSync(txtPath, namaKontak.join("\n"));
          await bot.sendDocument(chatId, txtPath);
          fs.unlinkSync(txtPath);
        }

        fs.unlinkSync(localPath);
        delete sessions[userId];
      } catch (err) {
        console.error("Gagal memproses VCF:", err);
        bot.sendMessage(chatId, "⚠️ *Yah… gagal baca file VCF* 😔\n\nPastikan formatnya benar ya!", { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() });
        try {
          if (session.file) fs.unlinkSync(session.file);
        } catch {}
        delete sessions[userId];
      }
    }
  });
}
