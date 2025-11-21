export default function (bot, db, saveDB) {
  bot.onText(/^\/cekid$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ *Akses Ditolak*\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "Markdown" }
      );
    }

    let message = `🆔 *CEK ID INFORMASI*\n\n`;
    message += `${'─'.repeat(35)}\n\n`;

    message += `👤 *DATA TELEGRAM KAM:*\n`;
    message += `├─ User ID: \`${userId}\`\n`;
    message += `├─ Nama: *${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}*\n`;
    message += `├─ Username: ${msg.from.username ? '@' + msg.from.username : '-'}\n`;
    message += `└─ Chat ID: \`${chatId}\`\n\n`;

    message += `${'─'.repeat(35)}\n\n`;
    message += `👥 *GRUP MANDATORY:*\n`;
    message += `├─ Grup Utama: @agentviber12\n`;
    message += `└─ Channel: @channelviber\n\n`;

    message += `${'─'.repeat(35)}\n\n`;
    message += `💡 *INFO PENTING:*\n`;
    message += `Jika ingin cek ID grup/channel:\n`;
    message += `• Tambahkan bot ke grup/channel\n`;
    message += `• Ketik /cekid di grup/channel\n`;
    message += `• Bot akan kirim ID grup tersebut\n\n`;

    message += `_Gunakan ID ini jika dibutuhkan owner untuk setting! 😊_`;

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  });

  // Handle /cekid di grup/channel
  bot.onText(/^\/cekid(@\w+)?/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const chatType = msg.chat.type; // private, group, supergroup, channel

    // If it's a group or channel, show group/channel info
    if (chatType === 'group' || chatType === 'supergroup' || chatType === 'channel') {
      let groupInfo = `🆔 *CEK ID GRUP/CHANNEL*\n\n`;
      groupInfo += `${'─'.repeat(35)}\n\n`;

      groupInfo += `📌 *INFORMASI:*\n`;
      groupInfo += `├─ Chat ID: \`${chatId}\`\n`;
      groupInfo += `├─ Nama: *${msg.chat.title}*\n`;
      groupInfo += `├─ Tipe: *${chatType === 'supergroup' ? 'Supergroup' : chatType === 'channel' ? 'Channel' : 'Group'}*\n`;
      groupInfo += `└─ User ID: \`${userId}\`\n\n`;

      groupInfo += `${'─'.repeat(35)}\n\n`;
      groupInfo += `_ID grup/channel ini sudah tercatat! 😊_`;

      return bot.sendMessage(chatId, groupInfo, { parse_mode: "Markdown" });
    }
  });
}
