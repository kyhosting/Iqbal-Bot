export default function (bot, db, saveDB) {
  bot.onText(/^\/cekid$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat.type;

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    if (chatType === 'private') {
      let message = `🆔 *CEK ID TELEGRAM USER*\n\n${'-'.repeat(35)}\n\n👤 *DATA TELEGRAM KAM:*\n`;
      message += `├─ User ID: \`${userId}\`\n`;
      message += `├─ Nama: *${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}*\n`;
      message += `├─ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n`;
      message += `└─ Chat ID: \`${chatId}\`\n\n`;
      message += `${'-'.repeat(35)}\n\n💡 Gunakan ID ini jika owner butuh untuk setting! 😊`;

      return await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    if (chatType === 'group' || chatType === 'supergroup') {
      let groupInfo = `🆔 *CEK ID GRUP*\n\n${'-'.repeat(35)}\n\n📌 *INFORMASI GRUP:*\n`;
      groupInfo += `├─ Grup ID: \`${chatId}\`\n`;
      groupInfo += `├─ Nama: *${msg.chat.title}*\n`;
      groupInfo += `└─ Tipe: *${chatType === 'supergroup' ? 'Supergroup' : 'Group'}*\n\n`;
      groupInfo += `${'-'.repeat(35)}\n\n_ID grup ini sudah tersimpan! 😊_`;

      return await bot.sendMessage(chatId, groupInfo, { parse_mode: "Markdown" });
    }

    if (chatType === 'channel') {
      let channelInfo = `🆔 *CEK ID CHANNEL*\n\n${'-'.repeat(35)}\n\n📢 *INFORMASI CHANNEL:*\n`;
      channelInfo += `├─ Channel ID: \`${chatId}\`\n`;
      channelInfo += `└─ Nama: *${msg.chat.title}*\n\n`;
      channelInfo += `${'-'.repeat(35)}\n\n_ID channel ini sudah tercatat! 😊_`;

      return await bot.sendMessage(chatId, channelInfo, { parse_mode: "Markdown" });
    }
  });
}
