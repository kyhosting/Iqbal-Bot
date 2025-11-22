import config from "../config.js";

export default function (bot, db, saveDB) {
  const userMessages = {};

  async function trackMessage(userId, chatId, text, options = {}) {
    if (userMessages[userId]) {
      try {
        await bot.deleteMessage(chatId, userMessages[userId]);
      } catch (e) {}
    }
    const msg = await bot.sendMessage(chatId, text, options);
    userMessages[userId] = msg.message_id;
    return msg;
  }

  bot.onText(/^\/start$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (config.owner.includes(userId)) {
      return bot.showDashboard(userId, chatId);
    }

    const user = db.users[userId];

    if (user && !user.suspended && user.status === "active") {
      return bot.showDashboard(userId, chatId);
    }

    if (user && user.suspended) {
      const verifyKeyboard = {
        inline_keyboard: [
          [{ text: "✅ Verifikasi Sekarang", callback_data: "verify_join" }]
        ]
      };

      return trackMessage(
        userId,
        chatId,
        `◆◆  VERIFIKASI GRUP  ◆◆

┌─❖
│  ⚠️ Akses Ditolak
│
│  Harus join 2 grup untuk akses
│
│  Klik tombol di bawah
│
│  Ketik 'start' untuk refresh
│  Ketik 'bantuan' untuk help
└─❖`,
        { parse_mode: "HTML", reply_markup: verifyKeyboard }
      );
    }

    const verifyKeyboard = {
      inline_keyboard: [
        [{ text: "✅ Verifikasi Sekarang", callback_data: "verify_join" }]
      ]
    };

    return trackMessage(
      userId,
      chatId,
      `◆◆  VERIFIKASI GRUP  ◆◆

┌─❖
│  ⚠️ Akses Ditolak
│
│  Harus join 2 grup untuk akses
│
│  Klik tombol di bawah
└─❖`,
      { parse_mode: "HTML", reply_markup: verifyKeyboard }
    );
  });

  bot.on("callback_query", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    if (query.data === "verify_join") {
      await bot.answerCallbackQuery(query.id);

      const groupCheck = await bot.checkGroupMembership(userId);

      if (!groupCheck.verified) {
        const groupMainDeeplink = `https://t.me/agentviber12?join`;
        const groupCvDeeplink = `https://t.me/channelviber?join`;

        const joinKeyboard = {
          inline_keyboard: [
            [
              { text: "📱 @agentviber12", url: groupMainDeeplink }
            ],
            [
              { text: "📱 @channelviber", url: groupCvDeeplink }
            ],
            [{ text: "✅ Sudah Join", callback_data: "verify_again" }]
          ]
        };

        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.sendMessage(
            chatId,
            `❌ Harus join kedua grup dulu Kak`,
            { parse_mode: "HTML", reply_markup: joinKeyboard }
          );
        } catch (err) {
          console.error("Error di verify_join:", err);
        }
      } else {
        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.showDashboard(userId, chatId);
        } catch (err) {
          console.error("Error di verify_join (already joined):", err);
        }
      }
    }
  });

  // DASHBOARD WITH AESTHETIC FORMAT
  bot.showDashboard = async (userId, chatId) => {
    try {
      const user = db.users[userId];
      if (!user) {
        db.users[userId] = {
          id: userId,
          username: (await bot.getChat(userId)).username || "unknown",
          first_name: (await bot.getChat(userId)).first_name || "User",
          last_name: (await bot.getChat(userId)).last_name || "",
          role: "user",
          vip_expired: Date.now() + 7 * 24 * 60 * 60 * 1000,
          status: "active",
          total_operation: 0
        };
        saveDB();
      }

      const userData = db.users[userId];
      const now = Date.now();
      const isVip = userData.role === "vip" && userData.vip_expired > now;
      const remainingMs = Math.max(0, userData.vip_expired - now);
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      const expiredDate = new Date(userData.vip_expired).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const statusText = isVip ? "🔥 VIP ACTIVE" : "👤 Regular";
      const roleText = userData.role === "owner" ? "👑 OWNER" : (userData.role === "vip" ? "💎 VIP" : "👤 USER");

      // Get profile photo
      let photoSent = false;
      try {
        const userPhotos = await bot.getUserProfilePhotos(userId, { limit: 1 });
        if (userPhotos.total_count > 0) {
          const photoId = userPhotos.photos[0][0].file_id;
          const caption = `🎌 <b>iqbal ᴄᴠ ʙᴏᴛꜱ</b>
(by iqbaldev)

╭─❖
│ こんにちは、私は Iqbalʙᴏᴛ です。
│ 私はファイル変換と管理を担当します。
│ ✦ Created by: @Iqbaldev
╰───────────────❖

╭─❖ <b>ꜱᴛᴀᴛᴜꜱ ᴀᴄᴄᴇꜱ</b>
│ ➤ Nama: <b>${userData.first_name || "User"}</b>
│ ➤ ID: <code>${userId}</code>
│ ➤ Username: @${userData.username || "unknown"}
│ ➤ Role: <b>${roleText}</b>
│ ➤ Status: <b>${statusText}</b>
│ ➤ Masa Aktif: <b>${expiredDate}</b>
│ ➤ Hari Tersisa: <b>${remainingDays} hari</b>
│ ➤ Total Operasi: <b>${userData.total_operation}</b>
╰───────────────❖

╭─❖ <b>ꜰɪʟᴇ ꜰᴏʀᴍᴀᴛ ꜱᴜᴘᴘᴏʀᴛ</b>
│ ➤ 📄 TXT 📇 VCF 📊 XLSX
│ ➤ 他の形式も順次対応予定です。
╰───────────────❖

╭─❖ <b>ᴍᴇɴᴜ ʙᴏᴛ</b>
│ ➤ ⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ
│ ➤ ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ
│ ➤ ⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ
│ ➤ ⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ
│ ➤ ⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ
│ ➤ ⛓️ ꜱᴘʟɪᴛ ꜰɪʟᴇ
│ ➤ ⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ
│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ
│ ➤ ⛓️ ᴀᴍʙɪʟ ɴᴀᴍᴀ ꜰɪʟᴇ
│ ➤ ⛓️ ʙᴜᴀᴛ ɴᴀᴍᴀ
│ ➤ ⛓️ ᴀᴅᴍ & ɴᴀᴠʏ
│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ
│ ➤ ⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ
╰───────────────❖

💎 ご利用ありがとうございます。
このボットは常に進化しています ⚙️`;

          await bot.sendPhoto(chatId, photoId, {
            caption: caption,
            parse_mode: "HTML",
            reply_markup: bot.getMainKeyboardUser(userId)
          });
          photoSent = true;
        }
      } catch (e) {
        // Foto tidak ada, lanjut tanpa foto
      }

      // Jika tidak ada foto, kirim text saja
      if (!photoSent) {
        const message = `🎌 <b>iqbal ᴄᴠ ʙᴏᴛꜱ</b>
(by iqbaldev)

╭─❖
│ こんにちは、私は Iqbalʙᴏᴛ です。
│ 私はファイル変換と管理を担当します。
│ ✦ Created by: @Iqbaldev
╰───────────────❖

╭─❖ <b>ꜱᴛᴀᴛᴜꜱ ᴀᴄᴄᴇꜱ</b>
│ ➤ Nama: <b>${userData.first_name || "User"}</b>
│ ➤ ID: <code>${userId}</code>
│ ➤ Username: @${userData.username || "unknown"}
│ ➤ Role: <b>${roleText}</b>
│ ➤ Status: <b>${statusText}</b>
│ ➤ Masa Aktif: <b>${expiredDate}</b>
│ ➤ Hari Tersisa: <b>${remainingDays} hari</b>
│ ➤ Total Operasi: <b>${userData.total_operation}</b>
╰───────────────❖

╭─❖ <b>ꜰɪʟᴇ ꜰᴏʀᴍᴀᴛ ꜱᴜᴘᴘᴏʀᴛ</b>
│ ➤ 📄 TXT 📇 VCF 📊 XLSX
│ ➤ 他の形式も順次対応予定です。
╰───────────────❖

╭─❖ <b>ᴍᴇɴᴜ ʙᴏᴛ</b>
│ ➤ ⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ
│ ➤ ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ
│ ➤ ⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ
│ ➤ ⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ
│ ➤ ⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ
│ ➤ ⛓️ ꜱᴘʟɪᴛ ꜰɪʟᴇ
│ ➤ ⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ
│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ
│ ➤ ⛓️ ᴀᴍʙɪʟ ɴᴀᴍᴀ ꜰɪʟᴇ
│ ➤ ⛓️ ʙᴜᴀᴛ ɴᴀᴍᴀ
│ ➤ ⛓️ ᴀᴅᴍ & ɴᴀᴠʏ
│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ
│ ➤ ⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ
╰───────────────❖

💎 ご利用ありがとうございます。
このボットは常に進化しています ⚙️`;

        await bot.sendMessage(chatId, message, {
          parse_mode: "HTML",
          reply_markup: bot.getMainKeyboardUser(userId)
        });
      }
    } catch (err) {
      console.error("Error di showDashboard:", err);
      await bot.sendMessage(chatId, "❌ Error loading dashboard", { parse_mode: "HTML" });
    }
  };
}
