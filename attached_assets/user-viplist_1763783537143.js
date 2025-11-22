export default function (bot, db, saveDB) {
  const VIP_PRICES = {
    '7': { days: 7, price: '15K', priceRp: 'Rp 15.000' },
    '30': { days: 30, price: '50K', priceRp: 'Rp 50.000' },
    '90': { days: 90, price: '120K', priceRp: 'Rp 120.000' },
    '365': { days: 365, price: '300K', priceRp: 'Rp 300.000' }
  };

  bot.onText(/^\/viplist$|^💎 VIP LIST$|^🎁 DAFTAR VIP$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check group membership
    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return bot.sendMessage(
        chatId,
        `⚠️ <b>Akses Ditolak</b>\n\nKamu harus join grup terlebih dahulu ya Kak.`,
        { parse_mode: "HTML" }
      );
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: "7 Hari - 15K", callback_data: "vip_buy_7" },
          { text: "30 Hari - 50K", callback_data: "vip_buy_30" }
        ],
        [
          { text: "90 Hari - 120K", callback_data: "vip_buy_90" },
          { text: "365 Hari - 300K", callback_data: "vip_buy_365" }
        ],
        [
          { text: "📞 Chat Owner Untuk Beli", callback_data: "vip_buy_owner" }
        ],
        [
          { text: "❌ Close", callback_data: "vip_close" }
        ]
      ]
    };

    let message = `💎 <b>DAFTAR HARGA VIP BOT</b>\n\n`;
    message += `${'═'.repeat(35)}\n\n`;
    message += `✨ <b>PAKET VIP TERSEDIA:</b>\n\n`;
    
    message += `📌 <b>PAKET 7 HARI</b>\n`;
    message += `├─ Harga: Rp 15.000\n`;
    message += `└─ Akses: Semua fitur selama 7 hari\n\n`;

    message += `📌 <b>PAKET 30 HARI</b> ⭐ POPULER\n`;
    message += `├─ Harga: Rp 50.000\n`;
    message += `└─ Akses: Semua fitur selama 30 hari\n\n`;

    message += `📌 <b>PAKET 90 HARI</b>\n`;
    message += `├─ Harga: Rp 120.000\n`;
    message += `└─ Akses: Semua fitur selama 90 hari\n\n`;

    message += `📌 <b>PAKET 365 HARI</b> 🔥 TERBAIK\n`;
    message += `├─ Harga: Rp 300.000\n`;
    message += `└─ Akses: Semua fitur selama 1 tahun\n\n`;

    message += `${'═'.repeat(35)}\n\n`;
    message += `🎯 <b>FITUR VIP YANG DIDAPATKAN:</b>\n`;
    message += `✓ Konversi file tanpa batas\n`;
    message += `✓ Ekstrak nomor (unlimited)\n`;
    message += `✓ Gabung & split file\n`;
    message += `✓ Rapikan & clean data\n`;
    message += `✓ Rename & manage file\n`;
    message += `✓ Dan fitur premium lainnya!\n\n`;

    message += `💳 <b>CARA PEMBAYARAN:</b>\n`;
    message += `Transfer ke rekening owner\n`;
    message += `Hubungi owner untuk info\n\n`;

    message += `_Pilih paket di bawah atau hubungi owner! 😊_`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: keyboard
    });
  });

  // Handle inline button callbacks
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (query.data === 'vip_buy_owner') {
      const buyMessage = `SAYA INGIN BELI VIP BOT!\n\nID Telegram: ${userId}`;
      const ownerLink = `https://t.me/Iqbaldev?text=${encodeURIComponent(buyMessage)}`;
      
      await bot.editMessageText(
        `✅ <b>Anda akan diarahkan ke owner</b>\n\n💬 Silakan ketik pesan pembelian VIP.\n\nSemoga cepat direspons! 😊`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "💬 Chat Owner", url: ownerLink }],
              [{ text: "🔙 Kembali", callback_data: "vip_back" }]
            ]
          }
        }
      );
      await bot.answerCallbackQuery(query.id);
    } else if (query.data.startsWith('vip_buy_')) {
      const days = query.data.replace('vip_buy_', '');
      const vipData = VIP_PRICES[days];
      
      if (vipData) {
        const buyMessage = `SAYA INGIN BELI VIP ${vipData.days} HARI!\n\nID Telegram: ${userId}`;
        const ownerLink = `https://t.me/Iqbaldev?text=${encodeURIComponent(buyMessage)}`;
        
        await bot.editMessageText(
          `💎 <b>PAKET ${vipData.days} HARI</b>\n\n` +
          `Harga: <b>${vipData.priceRp}</b>\n\n` +
          `Klik tombol di bawah untuk hubungi owner\n` +
          `dan sampaikan keinginan beli Anda.`,
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "💬 Chat Owner", url: ownerLink }],
                [{ text: "🔙 Kembali", callback_data: "vip_back" }]
              ]
            }
          }
        );
      }
      await bot.answerCallbackQuery(query.id);
    } else if (query.data === 'vip_back') {
      // Reload the VIP list
      const keyboard = {
        inline_keyboard: [
          [
            { text: "7 Hari - 15K", callback_data: "vip_buy_7" },
            { text: "30 Hari - 50K", callback_data: "vip_buy_30" }
          ],
          [
            { text: "90 Hari - 120K", callback_data: "vip_buy_90" },
            { text: "365 Hari - 300K", callback_data: "vip_buy_365" }
          ],
          [
            { text: "📞 Chat Owner Untuk Beli", callback_data: "vip_buy_owner" }
          ],
          [
            { text: "❌ Close", callback_data: "vip_close" }
          ]
        ]
      };

      let message = `💎 <b>DAFTAR HARGA VIP BOT</b>\n\n` +
        `${'═'.repeat(35)}\n\n` +
        `✨ <b>PAKET VIP TERSEDIA:</b>\n\n` +
        `📌 <b>PAKET 7 HARI</b> - Rp 15.000\n` +
        `📌 <b>PAKET 30 HARI</b> ⭐ - Rp 50.000\n` +
        `📌 <b>PAKET 90 HARI</b> - Rp 120.000\n` +
        `📌 <b>PAKET 365 HARI</b> 🔥 - Rp 300.000\n\n` +
        `_Pilih paket di bawah atau hubungi owner! 😊_`;

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: keyboard
      });
      await bot.answerCallbackQuery(query.id);
    } else if (query.data === 'vip_close') {
      await bot.editMessageText(
        `✅ <b>Menu Ditutup</b>\n\nGunakan /viplist untuk melihat harga VIP lagi.`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML"
        }
      );
      await bot.answerCallbackQuery(query.id);
    }
  });
}
