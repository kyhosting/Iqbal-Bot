export default function (bot, db, saveDB) {
  bot.onText(/^\/cekid$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat.type; // private, group, supergroup, channel

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    // Only in PRIVATE chat - show user ID
    if (chatType === 'private') {
      let message = `🆔 *CEK ID TELEGRAM USER*\n\n`;
      message += `${'─'.repeat(35)}\n\n`;
      message += `👤 *DATA TELEGRAM KAM:*\n`;
      message += `├─ User ID: \`${userId}\`\n`;
      message += `├─ Nama: *${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}*\n`;
      message += `├─ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n`;
      message += `└─ Chat ID: \`${chatId}\`\n\n`;
      message += `${'─'.repeat(35)}\n\n`;
      message += `💡 Gunakan ID ini jika owner butuh untuk setting! 😊`;

      return await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    }

    // In GROUP/SUPERGROUP - show group ID only
    if (chatType === 'group' || chatType === 'supergroup') {
      let groupInfo = `🆔 *CEK ID GRUP*\n\n`;
      groupInfo += `${'─'.repeat(35)}\n\n`;
      groupInfo += `📌 *INFORMASI GRUP:*\n`;
      groupInfo += `├─ Grup ID: \`${chatId}\`\n`;
      groupInfo += `├─ Nama: *${msg.chat.title}*\n`;
      groupInfo += `└─ Tipe: *${chatType === 'supergroup' ? 'Supergroup' : 'Group'}*\n\n`;
      groupInfo += `${'─'.repeat(35)}\n\n`;
      groupInfo += `_ID grup ini sudah tersimpan! 😊_`;

      return await bot.sendMessage(chatId, groupInfo, { parse_mode: "Markdown" });
    }

    // In CHANNEL - show channel ID only
    if (chatType === 'channel') {
      let channelInfo = `🆔 *CEK ID CHANNEL*\n\n`;
      channelInfo += `${'─'.repeat(35)}\n\n`;
      channelInfo += `📢 *INFORMASI CHANNEL:*\n`;
      channelInfo += `├─ Channel ID: \`${chatId}\`\n`;
      channelInfo += `└─ Nama: *${msg.chat.title}*\n\n`;
      channelInfo += `${'─'.repeat(35)}\n\n`;
      channelInfo += `_ID channel ini sudah tercatat! 😊_`;

      return await bot.sendMessage(chatId, channelInfo, { parse_mode: "Markdown" });
    }
  });
}
