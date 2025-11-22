export default function (bot) {
  bot.onText(/^\/fitur$/, async (msg) => {
    const chatId = msg.chat.id;

    const message = `◆◆ DAFTAR FITUR ◆◆\n\n╭─❖\n│ 📋 <b>FITUR TERSEDIA</b>\n╰───────────────❖\n\n╭─❖\n│ 🔄 <b>KONVERSI FILE</b>\n│ ➤ TXT ↔ VCF ↔ XLSX\n│ ➤ MSG to TXT\n├─❖\n│ 📂 <b>MANAJEMEN FILE</b>\n│ ➤ Split & Merge\n│ ➤ Rapikan & Clean\n│ ➤ Rename File/Kontak\n│ ➤ Count Contacts\n├─❖\n│ 🛠️ <b>UTILITIES</b>\n│ ➤ Extract Nomor\n│ ➤ Check Kontak\n│ ➤ Create Admin\n╰───────────────❖`;

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  });
}
