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
        `⚠️ <b>Akses Ditolak</b>\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "HTML" }
      );
    }

    // Only in PRIVATE chat - show user ID
    if (chatType === 'private') {
      let message = `🆔 <b>CEK ID TELEGRAM USER</b>\n\n`;
      message += `${'─'.repeat(35)}\n\n`;
      message += `👤 <b>DATA TELEGRAM KAM:</b>\n`;
      message += `├─ User ID: \`${userId}\`\n`;
      message += `├─ Nama: <b>${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}</b>\n`;
      message += `├─ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n`;
      message += `└─ Chat ID: \`${chatId}\`\n\n`;
      message += `${'─'.repeat(35)}\n\n`;
      message += `💡 Gunakan ID ini jika owner butuh untuk setting! 😊`;

      return await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }

    // In GROUP/SUPERGROUP - show group ID only
    if (chatType === 'group' || chatType === 'supergroup') {
      let groupInfo = `🆔 <b>CEK ID GRUP</b>\n\n`;
      groupInfo += `${'─'.repeat(35)}\n\n`;
      groupInfo += `📌 <b>INFORMASI GRUP:</b>\n`;
      groupInfo += `├─ Grup ID: \`${chatId}\`\n`;
      groupInfo += `├─ Nama: <b>${msg.chat.title}</b>\n`;
      groupInfo += `└─ Tipe: <b>${chatType === 'supergroup' ? 'Supergroup' : 'Group'}</b>\n\n`;
      groupInfo += `${'─'.repeat(35)}\n\n`;
      groupInfo += `_ID grup ini sudah tersimpan! 😊_`;

      return await bot.sendMessage(chatId, groupInfo, { parse_mode: "HTML" });
    }

    // In CHANNEL - show channel ID only
    if (chatType === 'channel') {
      let channelInfo = `🆔 <b>CEK ID CHANNEL</b>\n\n`;
      channelInfo += `${'─'.repeat(35)}\n\n`;
      channelInfo += `📢 <b>INFORMASI CHANNEL:</b>\n`;
      channelInfo += `├─ Channel ID: \`${chatId}\`\n`;
      channelInfo += `└─ Nama: <b>${msg.chat.title}</b>\n\n`;
      channelInfo += `${'─'.repeat(35)}\n\n`;
      channelInfo += `_ID channel ini sudah tercatat! 😊_`;

      return await bot.sendMessage(chatId, channelInfo, { parse_mode: "HTML" });
    }
  });
}
