export default function (bot, db, saveDB) {
  bot.onText(/^\/lapor_admin$|^📞 LAPOR ADMIN$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (msg.chat.type === "private") {
      return bot.sendMessage(chatId, "❌ Command ini hanya di grup!");
    }

    try {
      const reportMsg = `📞 *LAPOR ADMIN/ABUSE*

Silakan gunakan tombol di bawah untuk lapor masalah:

🐞 **Lapor Bug** - Ada bug di bot atau grup
⚠️ **Report Abuse** - Ada member yang spam/abuse
🛠️ **Request Fitur** - Minta fitur baru
💬 **Chat Owner** - Hubungi owner langsung

_Laporan Anda akan diproses segera!_`;

      const ownerUsername = config.ownerUsername;
      const reportBugMsg = `Halo Admin, saya ingin melaporkan BUG di grup.\n\nUser ID: ${userId}\nGrup: Lihat pesan sebelumnya\n\nDetail bug:`;
      const reportAbuseMsg = `Halo Admin, ada member yang spam/abuse.\n\nUser ID: ${userId}\nMember ID: [mention di reply]\n\nDetail:`;
      const featureMsg = `Halo Admin, saya request fitur baru untuk bot.\n\nUser ID: ${userId}\n\nFitur yang diminta:`;

      bot.sendMessage(chatId, reportMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🐞 Lapor Bug", url: `https://t.me/${ownerUsername}?text=${encodeURIComponent(reportBugMsg)}` }],
            [{ text: "⚠️ Report Abuse", url: `https://t.me/${ownerUsername}?text=${encodeURIComponent(reportAbuseMsg)}` }],
            [{ text: "🛠️ Request Fitur", url: `https://t.me/${ownerUsername}?text=${encodeURIComponent(featureMsg)}` }],
            [{ text: "💬 Chat Owner", url: `https://t.me/${ownerUsername}` }]
          ]
        }
      });

    } catch (error) {
      console.error("Error in lapor admin:", error);
      bot.sendMessage(chatId, "❌ Error, coba lagi");
    }
  });

  // Broadcast command (owner only)
  bot.onText(/^\/broadcast (.+)$/, async (msg, match) => {
    const userId = msg.from.id;

    if (!config.owner.includes(userId)) {
      return bot.sendMessage(msg.chat.id, "❌ Owner only");
    }

    const message = match[1];
    const users = Object.keys(db.users || {});
    let sent = 0;
    let failed = 0;

    const statusMsg = await bot.sendMessage(msg.chat.id, `📢 Mengirim broadcast ke ${users.length} user...`);

    for (const userId of users) {
      try {
        await bot.sendMessage(userId, `📢 *PENGUMUMAN DARI OWNER*\n\n${message}`, {
          parse_mode: "Markdown"
        });
        sent++;
      } catch (error) {
        failed++;
      }

      // Delay untuk avoid flood
      if (sent % 10 === 0) await delay(1000);
    }

    bot.editMessageText(
      `✅ *Broadcast Selesai*\n\n` +
      `📨 Terkirim: ${sent}\n` +
      `❌ Gagal: ${failed}`,
      {
        chat_id: msg.chat.id,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown"
      }
    );
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
