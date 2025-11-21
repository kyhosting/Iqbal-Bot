export default function (bot, db, saveDB) {
  const AUTO_DELETE = 300000; // 5 minutes

  bot.onText(/^\/lapor_admin$|^📞 LAPOR ADMIN$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (msg.chat.type === "private") {
      const errMsg = await bot.sendMessage(chatId, "❌ Hanya di grup!");
      setTimeout(() => bot.deleteMessage(chatId, errMsg.message_id).catch(() => {}), 5000);
      return;
    }

    try {
      const reportMsg = `📞 *LAPOR ADMIN/ABUSE*

Silakan pilih tipe laporan Anda:`;

      const ownerUsername = config.ownerUsername;
      const bugMsg = `Halo Admin, BUG di bot/grup.\n\nUser ID: ${userId}\n\nDetail:`;
      const abuseMsg = `Halo Admin, ada member spam/abuse.\n\nUser ID: ${userId}\n\nDetail:`;
      const featureMsg = `Halo Admin, request fitur baru.\n\nUser ID: ${userId}\n\nFitur:`;

      const sentMsg = await bot.sendMessage(chatId, reportMsg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🐞 Bug Report", url: `https://t.me/${ownerUsername}?text=${encodeURIComponent(bugMsg)}` }],
            [{ text: "⚠️ Report Abuse", url: `https://t.me/${ownerUsername}?text=${encodeURIComponent(abuseMsg)}` }],
            [{ text: "🛠️ Feature Request", url: `https://t.me/${ownerUsername}?text=${encodeURIComponent(featureMsg)}` }],
            [{ text: "💬 Chat Owner", url: `https://t.me/${ownerUsername}` }],
            [{ text: "🗑️ Delete", callback_data: `delete_${sentMsg.message_id}` }]
          ]
        }
      });

      setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), AUTO_DELETE);
    } catch (error) {
      console.error("Error in lapor admin:", error);
    }
  });

  // Broadcast command (owner only)
  bot.onText(/^\/broadcast (.+)$/, async (msg, match) => {
    const userId = msg.from.id;

    if (!config.owner.includes(userId)) {
      const errMsg = await bot.sendMessage(msg.chat.id, "❌ Owner only!");
      setTimeout(() => bot.deleteMessage(msg.chat.id, errMsg.message_id).catch(() => {}), 5000);
      return;
    }

    const message = match[1];
    const users = Object.keys(db.users || {});
    let sent = 0;
    let failed = 0;

    const statusMsg = await bot.sendMessage(msg.chat.id, `📢 *Broadcasting ke ${users.length} user...*\n\n⏳ Loading...`, {
      parse_mode: "Markdown"
    });

    for (const userId of users) {
      try {
        await bot.sendMessage(userId, `📢 *PENGUMUMAN*\n\n${message}`, {
          parse_mode: "Markdown"
        });
        sent++;
      } catch (error) {
        failed++;
      }

      if (sent % 10 === 0) await delay(1000);
    }

    await bot.editMessageText(
      `✅ *Broadcast Selesai*\n\n📨 Terkirim: ${sent}\n❌ Gagal: ${failed}`,
      {
        chat_id: msg.chat.id,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🗑️ Delete", callback_data: `delete_${statusMsg.message_id}` }]
          ]
        }
      }
    );

    setTimeout(() => bot.deleteMessage(msg.chat.id, statusMsg.message_id).catch(() => {}), AUTO_DELETE);
  });

  // Delete callback
  bot.on("callback_query", async (query) => {
    if (query.data.startsWith("delete_")) {
      const msgId = parseInt(query.data.split("_")[1]);
      try {
        await bot.deleteMessage(query.message.chat.id, msgId);
        await bot.answerCallbackQuery(query.id, "✅ Deleted", true);
      } catch (error) {
        await bot.answerCallbackQuery(query.id, "❌ Error", false);
      }
    }
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
