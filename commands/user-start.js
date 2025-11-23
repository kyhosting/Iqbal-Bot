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
    userMessages[userId] = msg.messageid;
    return msg;
  }

  bot.onText(/^\/start$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (config.owner.includes(userId)) {
      return bot.showDashboard(userId, chatId);
    }

    const user = db.users[userId];

    // ===== CHECK GROUP VERIFIED FLAG FIRST =====
    // Jika user sudah pernah verify group → langsung tampilkan dashboard
    if (user && user.groupverified && !user.suspended) {
      return bot.showDashboard(userId, chatId);
    }

    // User suspended (keluar dari grup) → force re-verify
    if (user && user.suspended) {
      const verifyKeyboard = {
        inlinekeyboard: [
          [{ text: "✅ Verifikasi Sekarang", callbackdata: "verifyjoin" }]
        ]
      };

      return trackMessage(
        userId,
        chatId,
        ◆◆  VERIFIKASI GRUP  ◆◆

┌─❖
│  ⚠️ Akses Ditolak
│
│  Harus join 2 grup untuk akses
│
│  Klik tombol di bawah
│
│  Ketik 'start' untuk refresh
│  Ketik 'bantuan' untuk help
└─❖,
        { parsemode: "Markdown", replymarkup: verifyKeyboard }
      );
    }

    // User belum pernah verify atau belum ada → tanya verifikasi
    const verifyKeyboard = {
      inlinekeyboard: [
        [{ text: "✅ Verifikasi Sekarang", callbackdata: "verifyjoin" }]
      ]
    };

    return trackMessage(
      userId,
      chatId,
      ◆◆  VERIFIKASI GRUP  ◆◆

┌─❖
│  ⚠️ Akses Ditolak
│
│  Harus join 2 grup untuk akses
│
│  Klik tombol di bawah
└─❖,
      { parsemode: "Markdown", replymarkup: verifyKeyboard }
    );
  });

  bot.on("callbackquery", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const messageId = query.message.messageid;

    if (query.data === "verifyjoin") {
      await bot.answerCallbackQuery(query.id);

      const groupCheck = await bot.checkGroupMembership(userId);

      if (!groupCheck.verified) {
        const groupMainDeeplink = https://t.me/agentviber12?join;
        const groupCvDeeplink = https://t.me/channelviber?join;

        const joinKeyboard = {
          inlinekeyboard: [
            [
              { text: "📱 @agentviber12", url: groupMainDeeplink }
            ],
            [
              { text: "📱 @channelviber", url: groupCvDeeplink }
            ],
            [{ text: "✅ Sudah Join", callbackdata: "verifyagain" }]
          ]
        };

        try {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.sendMessage(
            chatId,
            ❌ Harus join kedua grup dulu Kak,
            { parsemode: "Markdown", replymarkup: joinKeyboard }
          );
        } catch (err) {
          console.error("Error di verifyjoin:", err);
        }
      } else {
        try {
          // ===== SET GROUP VERIFIED FLAG =====
          // Saat user verified, set flag agar tidak perlu verify lagi
          if (!db.users[userId]) {
            const chatUser = await bot.getChat(userId);
            db.users[userId] = {
              id: userId,
              username: chatUser.username || "",
              firstname: chatUser.firstname || "User",
              lastname: chatUser.lastname || "",
              role: "trial",
              vipexpired: Date.now() + 1  24  60  60  1000,
              status: "active",
              totaloperation: 0,
              notifiedexpiry: false,
              trialstart: Date.now(),
              suspended: false,
              groupverified: true // SET FLAG SETELAH VERIFY BERHASIL!
            };
          } else {
            db.users[userId].groupverified = true;
            db.users[userId].suspended = false;
            if (!db.users[userId].vipexpired) {
              db.users[userId].vipexpired = Date.now() + 1  24  60  60  1000;
              db.users[userId].role = "trial";
            }
          }
          saveDB();

          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.showDashboard(userId, chatId);
        } catch (err) {
          console.error("Error di verifyjoin (already joined):", err);
        }
      }
    }
  });

  // DASHBOARD WITH AESTHETIC FORMAT - MARKDOWN
  bot.showDashboard = async (userId, chatId) => {
    try {
      const user = db.users[userId];
      if (!user) {
        db.users[userId] = {
          id: userId,
          username: (await bot.getChat(userId)).username || "unknown",
          firstname: (await bot.getChat(userId)).firstname || "User",
          lastname: (await bot.getChat(userId)).lastname || "",
          role: "user",
          vipexpired: Date.now() + 7  24  60  60  1000,
          status: "active",
          totaloperation: 0
        };
        saveDB();
      }

      const userData = db.users[userId];
      const now = Date.now();
      const isVip = userData.role === "vip" && userData.vipexpired > now;
      const remainingMs = Math.max(0, userData.vipexpired - now);
      const remainingDays = Math.ceil(remainingMs / (24  60  60  1000));
      const expiredDate = new Date(userData.vipexpired).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const statusText = isVip ? "🔥 VIP ACTIVE" : "👤 Regular";
      const roleText = userData.role === "owner" ? "👑 OWNER" : (userData.role === "vip" ? "💎 VIP" : "👤 USER");
      const username = userData.username || "unknown";

      // Buat caption dengan format MARKDOWN yang tepat
      const caption = 🎌 iqbal ᴄᴠ ʙᴏᴛꜱ
(by iqbaldev)

╭─❖
│ こんにちは、私は Iqbalʙᴏᴛ です。
│ 私はファイル変換と管理を担当します。
│ ✦ Created by: @Iqbaldev
╰───────────────❖

╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ
│ ➤ Nama: ${userData.firstname || "User"}
│ ➤ ID: \${userId}
│ ➤ Username: @${username}
│ ➤ Role: ${roleText}
│ ➤ Status: ${statusText}
│ ➤ Masa Aktif: ${expiredDate}
│ ➤ Hari Tersisa: ${remainingDays} hari
│ ➤ Total Operasi: ${userData.totaloperation}
╰───────────────❖

╭─❖ ꜰɪʟᴇ ꜰᴏʀᴍᴀᴛ ꜱᴜᴘᴘᴏʀᴛ
│ ➤ 📄 TXT 📇 VCF 📊 XLSX
│ ➤ 他の形式も順次対応予定です。
╰───────────────❖

╭─❖ ᴍᴇɴᴜ ʙᴏᴛ*
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
このボットは常に進化しています ⚙️;

      // Get profile photo
      let photoSent = false;
      try {
        const userPhotos = await bot.getUserProfilePhotos(userId, { limit: 1 });
        if (userPhotos.totalcount > 0) {
          const photoId = userPhotos.photos[0][0].fileid;
          await bot.sendPhoto(chatId, photoId, {
            caption: caption,
            parsemode: "Markdown",
            replymarkup: bot.getMainKeyboardUser(userId)
          });
          photoSent = true;
        }
      } catch (e) {
        // Foto tidak ada, lanjut tanpa foto
      }

      // Jika tidak ada foto, kirim text saja
      if (!photoSent) {
        await bot.sendMessage(chatId, caption, {
          parsemode: "Markdown",
          replymarkup: bot.getMainKeyboardUser(userId)
        });
      }
    } catch (err) {
      console.error("Error di showDashboard:", err);
      await bot.sendMessage(chatId, "❌ Error loading dashboard", { parsemode: "Markdown" });
    }
  };
}
