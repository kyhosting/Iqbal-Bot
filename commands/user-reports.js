import config from "../config.js";

export default function (bot, db, saveDB) {
  const reportSessions = {};
  const VIP_PACKAGES = {
    buyvip_7: { days: 7, price: "15.000", priceRp: "Rp 15.000" },
    buyvip_30: { days: 30, price: "40.000", priceRp: "Rp 40.000" },
    buyvip_90: { days: 90, price: "100.000", priceRp: "Rp 100.000" }
  };

  const OWNER_ID = config.owner[0];

  // ===== HANDLER: Report Buttons =====
  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    // Bug Report
    if (data === "bug_report") {
      reportSessions[userId] = { type: "bug_report", chatId };
      
      await bot.deleteAndSend(
        query,
        `🐞 *LAPOR BUG*\n\n` +
        `Silakan jelaskan bug yang Anda temukan:\n\n` +
        `_Ketik pesan Anda di bawah ini_ 👇`,
        null
      );
      
      await bot.answerCallbackQuery(query.id);
    }

    // Bot Error
    else if (data === "bot_error") {
      reportSessions[userId] = { type: "bot_error", chatId };
      
      await bot.deleteAndSend(
        query,
        `⚠️ *LAPOR ERROR BOT*\n\n` +
        `Jelaskan error atau masalah yang Anda hadapi:\n\n` +
        `_Ketik pesan Anda di bawah ini_ 👇`,
        null
      );
      
      await bot.answerCallbackQuery(query.id);
    }

    // Feature Request
    else if (data === "feature_request") {
      reportSessions[userId] = { type: "feature_request", chatId };
      
      await bot.deleteAndSend(
        query,
        `🛠️ *REQUEST FITUR BARU*\n\n` +
        `Usulkan fitur baru yang Anda inginkan:\n\n` +
        `_Ketik ide Anda di bawah ini_ 👇`,
        null
      );
      
      await bot.answerCallbackQuery(query.id);
    }

    // Buy VIP Menu
    else if (data === "report_buyvip_menu") {
      const keyboard = {
        inline_keyboard: [
          [
            { text: "💎 7 Hari - Rp 15.000", callback_data: "buyvip_7" },
            { text: "💎 30 Hari - Rp 40.000", callback_data: "buyvip_30" }
          ],
          [
            { text: "💎 90 Hari - Rp 100.000", callback_data: "buyvip_90" }
          ],
          [
            { text: "🔙 Kembali", callback_data: "buyvip_back" }
          ]
        ]
      };

      await bot.deleteAndSend(
        query,
        `💎 *DAFTAR PAKET VIP*\n\n` +
        `Pilih paket VIP yang Anda inginkan:\n\n` +
        `📌 7 Hari - Rp 15.000\n` +
        `📌 30 Hari - Rp 40.000 (⭐ PALING POPULER)\n` +
        `📌 90 Hari - Rp 100.000\n\n` +
        `_Klik tombol di bawah untuk memilih_ 😊`,
        keyboard
      );
      
      await bot.answerCallbackQuery(query.id);
    }

    // Buy VIP - Specific Package
    else if (data.startsWith("buyvip_")) {
      const pkg = VIP_PACKAGES[data];
      
      if (pkg) {
        // Send to owner
        const ownerMessage = 
          `💎 *PEMBELIAN VIP*\n\n` +
          `User: \`${userId}\`\n` +
          `Username: @${query.from.username || "no username"}\n` +
          `Nama: ${query.from.first_name || "N/A"}\n\n` +
          `Paket: ${pkg.days} Hari — ${pkg.priceRp}`;

        await bot.sendMessage(OWNER_ID, ownerMessage, { parse_mode: "Markdown" });

        // Reply to user
        const userReply = 
          `✅ *PESANAN DITERIMA*\n\n` +
          `Paket VIP ${pkg.days} Hari (${pkg.priceRp}) telah dicatat.\n\n` +
          `Silakan tunggu konfirmasi dari owner. 😊`;

        await bot.deleteAndSend(query, userReply, null);
      }
      
      await bot.answerCallbackQuery(query.id);
    }

    // Back to VIP Menu
    else if (data === "buyvip_back") {
      const keyboard = {
        inline_keyboard: [
          [
            { text: "🐞 Lapor Bug", callback_data: "bug_report" },
            { text: "⚠️ Bot Error", callback_data: "bot_error" }
          ],
          [
            { text: "🛠️ Request Fitur", callback_data: "feature_request" }
          ],
          [
            { text: "💎 Beli VIP", callback_data: "report_buyvip_menu" }
          ],
          [
            { text: "💬 Chat Owner", url: "https://t.me/Iqbaldev" }
          ],
          [
            { text: "❌ Close", callback_data: "report_close" }
          ]
        ]
      };

      const message = `🆘 *MENU BANTUAN*\n\n` +
        `Ada yang bisa dibantu Kak?\n\n` +
        `Pilih salah satu opsi:\n` +
        `• 🐞 Lapor Bug - Laporkan bug yang Anda temukan\n` +
        `• ⚠️ Bot Error - Laporkan error yang Anda alami\n` +
        `• 🛠️ Request Fitur - Usulkan fitur baru\n` +
        `• 💎 Beli VIP - Lihat paket VIP tersedia\n` +
        `• 💬 Chat Owner - Hubungi owner langsung\n\n` +
        `_Owner akan merespons secepat mungkin ya Kak!_ 😊`;

      await bot.deleteAndSend(query, message, keyboard);
      await bot.answerCallbackQuery(query.id);
    }

    // Close Menu
    else if (data === "report_close") {
      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
      await bot.answerCallbackQuery(query.id, "✅ Menu ditutup");
    }
  });

  // ===== HANDLER: Text Messages for Reports =====
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/") || msg.text.startsWith("⛓️")) {
      return; // Skip commands
    }

    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const session = reportSessions[userId];

    if (!session) return; // No active session

    const userText = msg.text;

    try {
      if (session.type === "bug_report") {
        // Send to owner
        const report = 
          `🐞 *LAPORAN BUG*\n\n` +
          `Dari user: \`${userId}\`\n` +
          `Username: @${msg.from.username || "no username"}\n` +
          `Nama: ${msg.from.first_name || "N/A"}\n\n` +
          `Isi laporan:\n_${userText}_`;

        await bot.sendMessage(OWNER_ID, report, { parse_mode: "Markdown" });

        // Reply to user
        await bot.sendMessage(
          chatId,
          `✅ *LAPORAN DIKIRIM*\n\n` +
          `Terima kasih telah melaporkan bug! 🙏\n` +
          `Owner akan segera memeriksa laporan Anda.\n\n` +
          `_Gunakan /bantuan untuk menu lainnya_ 😊`,
          { parse_mode: "Markdown" }
        );
      }

      else if (session.type === "bot_error") {
        // Send to owner
        const report = 
          `⚠️ *LAPORAN ERROR BOT*\n\n` +
          `Dari user: \`${userId}\`\n` +
          `Username: @${msg.from.username || "no username"}\n` +
          `Nama: ${msg.from.first_name || "N/A"}\n\n` +
          `Pesan:\n_${userText}_`;

        await bot.sendMessage(OWNER_ID, report, { parse_mode: "Markdown" });

        // Reply to user
        await bot.sendMessage(
          chatId,
          `✅ *LAPORAN ERROR DIKIRIM*\n\n` +
          `Terima kasih telah melaporkan error! 🙏\n` +
          `Owner akan segera memeriksanya.\n\n` +
          `_Gunakan /bantuan untuk menu lainnya_ 😊`,
          { parse_mode: "Markdown" }
        );
      }

      else if (session.type === "feature_request") {
        // Send to owner
        const report = 
          `🛠️ *REQUEST FITUR BARU*\n\n` +
          `Dari user: \`${userId}\`\n` +
          `Username: @${msg.from.username || "no username"}\n` +
          `Nama: ${msg.from.first_name || "N/A"}\n\n` +
          `Request:\n_${userText}_`;

        await bot.sendMessage(OWNER_ID, report, { parse_mode: "Markdown" });

        // Reply to user
        await bot.sendMessage(
          chatId,
          `✅ *REQUEST FITUR DIKIRIM*\n\n` +
          `Terima kasih atas saran Anda! 🙏\n` +
          `Owner akan mempertimbangkan fitur ini.\n\n` +
          `_Gunakan /bantuan untuk menu lainnya_ 😊`,
          { parse_mode: "Markdown" }
        );
      }

      // Clear session
      delete reportSessions[userId];
    } catch (err) {
      console.error("Report handler error:", err);
      await bot.sendMessage(
        chatId,
        `❌ *Ada kesalahan saat mengirim laporan*\n\nSilakan coba lagi nanti ya Kak 😊`,
        { parse_mode: "Markdown" }
      );
      delete reportSessions[userId];
    }
  });
}
