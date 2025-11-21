import fs from "fs";
import path from "path";
import { parse } from "vcard-parser";

export default function (bot) {
  const sessions = {};

  bot.onText(/^\/ceknamakontak$/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const role = bot.getRole(userId);

    // Batasi akses
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
      "📤 <b>Kirim file .vcf yang ingin dicek nama kontaknya.</b>\n\nKetik <code>batal</code> untuk membatalkan.",
      { parse_mode: "HTML" }
    );
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

      try {
        // Download file
        const fileId = msg.document.file_id;
        const file = await bot.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
        const res = await fetch(fileUrl);
        const buffer = Buffer.from(await res.arrayBuffer());
        const localPath = path.join(process.cwd(), msg.document.file_name);

        fs.writeFileSync(localPath, buffer);
        session.file = localPath;

        // Proses file
        const data = fs.readFileSync(localPath, "utf8");
        let parsed = parse(data);

        // Pastikan parsed selalu array
        parsed = Array.isArray(parsed) ? parsed : [parsed];

        const namaKontak = parsed
          .filter((c) => c.fn && c.fn.value && c.fn.value.trim())
          .map((c) => c.fn.value.trim());

        const total = namaKontak.length;

        if (total === 0) {
          fs.unlinkSync(localPath);
          delete sessions[userId];
          return bot.sendMessage(chatId, "⚠️ Tidak ditemukan nama kontak di file ini.");
        }

        let hasil = `📋 <b>Total kontak:</b> ${total}\n\n🔍 <b>Nama-nama kontak:</b>\n\n`;
        hasil += namaKontak
          .slice(0, 100)
          .map((nama, i) => `${i + 1}. ${nama}`)
          .join("\n");

        if (total > 100) hasil += `\n\n⚠️ Ditampilkan 100 dari ${total} kontak.`;

        await bot.sendMessage(chatId, hasil, { parse_mode: "HTML" });

        // Jika >100, kirim file txt berisi semua nama
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
        bot.sendMessage(chatId, "⚠️ Gagal membaca file .vcf, pastikan formatnya benar.");
        try {
          if (session.file) fs.unlinkSync(session.file);
        } catch {}
        delete sessions[userId];
      }
    }
  });
}