import fs from "fs";
import path from "path";
import { parse } from "vcard-parser";

export default function (bot, db, saveDB) {
  const sessions = {};

  bot.onText(/^⛓️CEK KONTAK$|^\/cekkontak$|^\/ceknamakontak$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;
    
    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return bot.sendMessage(chatId, `◆ CEK KONTAK\n\n▸ ◆◆ AKSES DITOLAK ◆◆

┌─❖
├ ❌ Akses Ditolak
├ Fitur khusus VIP
└─❖\n\nFitur ini khusus untuk VIP Kak\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
    }

    sessions[userId] = { step: 1 };
    bot.sendMessage(chatId, `◆ CEK KONTAK\n(Detail Kontak)\n\n▸ Support Format:\n  • VCF (Contact)\n  • TXT (Text)\n\n▸ Lihat detail lengkap kontak\n▸ Nama & nomor telepon\n\n▸ Ketik 'done' setelah selesai\n▸ Ketik 'batal' untuk membatalkan\n\n◆`, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
        return bot.sendMessage(chatId, "◆◆ DIBATALKAN ◆◆\n\n╭─❖\n│ ❌ <b>Proses dibatalkan</b>\n╰───────────────❖ ya Kak 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
      }

      if (!msg.document || !msg.document.file_name.endsWith(".vcf")) {
        return bot.sendMessage(chatId, "⚠️ <b>Harus file VCF ya Kak</b> 😊", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
          return bot.sendMessage(chatId, "⚠️ <b>Tidak ditemukan nama kontak di file ini Kak</b> 😔", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        }

        let hasil = `📋 <b>Daftar Kontak:</b>\n\n📊 <b>Total: ${total} kontak</b>\n\n`;
        hasil += namaKontak.slice(0, 100).map((nama, i) => `${i + 1}. ${nama}`).join("\n");

        if (total > 100) hasil += `\n\n⚠️ Ditampilkan 100 dari ${total} kontak.`;

        await bot.sendMessage(chatId, hasil, { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
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
        bot.sendMessage(chatId, "⚠️ <b>Yah… gagal baca file VCF</b> 😔\n\nPastikan formatnya benar ya!", { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) });
        try {
          if (session.file) fs.unlinkSync(session.file);
        } catch {}
        delete sessions[userId];
      }
    }
  });
}
