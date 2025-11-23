function generateRandomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random()  chars.length));
  }
  return code;
}

function parseDuration(str) {
  const match = str.match(/^(\d+)([mhdw])$/i);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    'm': 60  1000,              // menit ke ms
    'h': 60  60  1000,         // jam ke ms
    'd': 24  60  60  1000,    // hari ke ms
    'w': 7  24  60  60  1000 // minggu ke ms
  };
  
  return value  multipliers[unit];
}

function formatDuration(ms) {
  if (ms < 60  1000) {
    return Math.floor(ms / 1000) + "s";
  } else if (ms < 60  60  1000) {
    return Math.floor(ms / (60  1000)) + "m";
  } else if (ms < 24  60  60  1000) {
    return Math.floor(ms / (60  60  1000)) + "h";
  } else {
    return Math.floor(ms / (24  60  60  1000)) + "d";
  }
}

export default function (bot, db, saveDB) {
  const sessions = {};
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

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  async function showOwnerMenu(userId, chatId, isFromBatal = false) {
    const keyboard = {
      inlinekeyboard: [
        [{ text: "➕ Buat Kode", callbackdata: "ownercreatecode" }, { text: "📋 Lihat Kode", callbackdata: "ownerlistcodes" }],
        [{ text: "🗑️ Hapus Kode", callbackdata: "ownerdeletecode" }, { text: "👥 Lihat User", callbackdata: "ownerlistusers" }],
        [{ text: "📢 Broadcast", callbackdata: "ownerbroadcast" }, { text: "🎁 Set VIP Manual", callbackdata: "ownersetvip" }],
        [{ text: "◀️ Kembali ke Menu Biasa", callbackdata: "kembalimenubiasa" }]
      ]
    };

    const text = ◆◆  PANEL ADMIN AKTIF  ◆◆

┌─❖
│  🛡️ Management Panel
│
│  Pilih menu yang ingin digunakan
└─❖;

    if (isFromBatal) {
      return sendWithDelete(userId, chatId, text, { parsemode: "Markdown", replymarkup: keyboard });
    } else {
      const msg = await bot.sendMessage(chatId, text, { parsemode: "Markdown", replymarkup: keyboard });
      userMessages[userId] = msg.messageid;
      return msg;
    }
  }

  async function showMainMenu(userId, chatId, isFromBatal = false) {
    const text = ◆◆  MENU UTAMA  ◆◆

┌─❖
│  🎯 Pilih menu untuk melanjutkan
└─❖;

    if (isFromBatal) {
      return sendWithDelete(userId, chatId, text, { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) });
    } else {
      const msg = await bot.sendMessage(chatId, text, { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) });
      userMessages[userId] = msg.messageid;
      return msg;
    }
  }

  bot.onText(/^⛓️ MENU OWNER ⛓️$|^\/owner$/i, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return bot.sendMessage(
        chatId,
        ◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk owner kak!
└─❖,
        { parsemode: "Markdown" }
      );
    }

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId,
        ◆◆  MENU OWNER  ◆◆

┌─❖
│  ❌ Menu ini hanya untuk owner
└─❖,
        { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
      );
    }

    await showOwnerMenu(userId, chatId, false);
  });

  bot.onText(/^\/owner$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return bot.sendMessage(
        chatId,
        ◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk owner kak!
└─❖,
        { parsemode: "Markdown" }
      );
    }

    if (bot.getRole(userId) !== "owner") {
      return bot.sendMessage(
        chatId,
        ◆◆  MENU OWNER  ◆◆

┌─❖
│  ❌ Khusus owner
└─❖,
        { parsemode: "Markdown", replymarkup: bot.getMainKeyboardUser(userId) }
      );
    }

    await showOwnerMenu(userId, chatId, false);
  });

  bot.on("callbackquery", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (bot.getRole(userId) !== "owner" && data !== "kembalimenubiasa") {
      return bot.answerCallbackQuery(query.id, { text: "❌ Khusus owner!" });
    }

    // LIST CODES
    if (data === "ownerlistcodes") {
      const codes = Object.keys(bot.redeemDB);
      let message = ◆◆  DAFTAR KODE (${codes.length})  ◆◆\n\n;
      if (codes.length === 0) {
        message += ┌─❖\n│  ℹ️ Belum ada kode\n└─❖;
      } else {
        message += ┌─❖\n;
        codes.forEach((code, i) => {
          const r = bot.redeemDB[code];
          const status = r.usedby ? "✅ Terpakai" : "⏳ Aktif";
          const expTime = formatDuration(r.expiresinms);
          message += │  ${i + 1}. ${code}\n;
          message += │     Status: ${status}\n;
          message += │     Durasi VIP: ${r.duration} hari\n;
          message += │     Code Expired: ${expTime}\n;
          if (i < codes.length - 1) message += │\n;
        });
        message += └─❖;
      }

      const backKeyboard = {
        inlinekeyboard: [
          [{ text: "◀️ Kembali ke Menu", callbackdata: "ownerbackmenu" }]
        ]
      };

      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, message, { parsemode: "Markdown", replymarkup: backKeyboard });
    }

    // CREATE CODE
    else if (data === "ownercreatecode") {
      sessions[userId] = { step: "createcodename" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        ◆◆  BUAT KODE  ◆◆

┌─❖
│  📝 Masukkan nama kode
│
│  Contoh: VIPCODE001
│
│  Ketik 'batal' untuk cancel
└─❖,
        { parsemode: "Markdown" }
      );
      userMessages[userId] = msg.messageid;
    }

    // DELETE CODE
    else if (data === "ownerdeletecode") {
      sessions[userId] = { step: "deletecode" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        ◆◆  HAPUS KODE  ◆◆

┌─❖
│  📝 Masukkan kode yang ingin dihapus
│
│  Ketik 'batal' untuk cancel
└─❖,
        { parsemode: "Markdown" }
      );
      userMessages[userId] = msg.messageid;
    }

    // LIST USERS
    else if (data === "ownerlistusers") {
      const vipUsers = Object.values(db.users).filter((u) => u.role === "vip" && u.vipexpired > Date.now());
      let message = ◆◆  DAFTAR VIP USER (${vipUsers.length})  ◆◆\n\n;
      if (vipUsers.length === 0) {
        message += ┌─❖\n│  ℹ️ Belum ada user VIP\n└─❖;
      } else {
        message += ┌─❖\n;
        vipUsers.forEach((user, i) => {
          const exp = new Date(user.vipexpired).toLocaleDateString("id-ID");
          message += │  ${i + 1}. ${user.firstname}\n;
          message += │     ID: ${user.id}\n;
          message += │     Exp: ${exp}\n;
          if (i < vipUsers.length - 1) message += │\n;
        });
        message += └─❖;
      }

      const backKeyboard = {
        inlinekeyboard: [
          [{ text: "◀️ Kembali ke Menu", callbackdata: "ownerbackmenu" }]
        ]
      };

      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(chatId, message, { parsemode: "Markdown", replymarkup: backKeyboard });
    }

    // BROADCAST
    else if (data === "ownerbroadcast") {
      sessions[userId] = { step: "broadcastmessage" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        ◆◆  BROADCAST KE SEMUA USER  ◆◆

┌─❖
│  📢 Masukkan pesan broadcast
│
│  Pesan akan dikirim ke semua user
│  Bisa pakai emoji, bold, italic
│
│  Ketik 'batal' untuk cancel
└─❖,
        { parsemode: "Markdown" }
      );
      userMessages[userId] = msg.messageid;
    }

    // SET VIP MANUAL
    else if (data === "ownersetvip") {
      sessions[userId] = { step: "setvipuserid" };
      await bot.answerCallbackQuery(query.id);
      const msg = await bot.sendMessage(
        chatId,
        ◆◆  SET VIP MANUAL  ◆◆

┌─❖
│  👤 Masukkan User ID
│
│  Ketik 'batal' untuk cancel
└─❖,
        { parsemode: "Markdown" }
      );
      userMessages[userId] = msg.messageid;
    }

    // BACK TO OWNER MENU
    else if (data === "ownerbackmenu") {
      await bot.answerCallbackQuery(query.id);
      delete sessions[userId];
      await showOwnerMenu(userId, chatId, false);
    }

    // BACK TO MAIN MENU (Keyboard Buttons)
    else if (data === "kembalimenubiasa") {
      await bot.answerCallbackQuery(query.id);
      delete sessions[userId];
      await showMainMenu(userId, chatId, false);
    }
  });

  bot.on("message", async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";
    const session = sessions[userId];

    if (!session) return;

    // CREATE CODE - NAME
    if (session.step === "createcodename") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }
      sessions[userId].codename = text.toUpperCase();
      sessions[userId].step = "createcodeduration";
      const msg = await bot.sendMessage(
        chatId,
        ◆◆  DURASI VIP  ◆◆

┌─❖
│  🕐 Masukkan durasi (hari)
│
│  Contoh: 7, 30, 365
│
│  Ketik 'batal' untuk cancel
└─❖,
        { parsemode: "Markdown" }
      );
      userMessages[userId] = msg.messageid;
      return;
    }

    // CREATE CODE - DURATION
    else if (session.step === "createcodeduration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }
      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        const msg = await bot.sendMessage(chatId, ◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Durasi harus angka positif!\n└─❖, { parsemode: "Markdown" });
        userMessages[userId] = msg.messageid;
        return;
      }
      sessions[userId].duration = duration;
      sessions[userId].step = "createcodeexpiry";
      const msg = await bot.sendMessage(
        chatId,
        ◆◆  CODE EXPIRED DURATION  ◆◆

┌─❖
│  ⏰ Kapan code ini kadaluarsa?
│
│  Format: <angka><satuan>
│  
│  Satuan:
│  • m = menit (contoh: 5m)
│  • h = jam (contoh: 1h)
│  • d = hari (contoh: 7d)
│  • w = minggu (contoh: 2w)
│
│  Contoh: 7d, 1h, 30m
│
│  Ketik 'batal' untuk cancel
└─❖,
        { parsemode: "Markdown" }
      );
      userMessages[userId] = msg.messageid;
      return;
    }

    // CREATE CODE - EXPIRY
    else if (session.step === "createcodeexpiry") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }
      
      const expiryMs = parseDuration(text);
      if (!expiryMs) {
        const msg = await bot.sendMessage(
          chatId,
          ◆◆  ERROR  ◆◆

┌─❖
│  ⚠️ Format salah!
│
│  Contoh yang benar:
│  5m, 1h, 7d, 2w
└─❖,
          { parsemode: "Markdown" }
        );
        userMessages[userId] = msg.messageid;
        return;
      }

      const code = session.codename;
      bot.redeemDB[code] = {
        code,
        duration: session.duration,
        expiresinms: expiryMs,
        createdat: Date.now(),
        usedby: null
      };
      if (bot.saveRedeemDB) bot.saveRedeemDB();

      delete sessions[userId];

      const backKeyboard = {
        inlinekeyboard: [
          [{ text: "◀️ Kembali ke Menu", callbackdata: "ownerbackmenu" }]
        ]
      };

      await bot.sendMessage(
        chatId,
        ◆◆  KODE DIBUAT  ◆◆

┌─❖
│  ✅ Kode berhasil dibuat
│
│  Kode: \\\${code}\\
│  Durasi VIP: ${session.duration} hari
│  Code Expired: ${formatDuration(expiryMs)}
└─❖,
        { parsemode: "Markdown", replymarkup: backKeyboard }
      );
    }

    // DELETE CODE
    else if (session.step === "deletecode") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const code = text.toUpperCase();
      if (!bot.redeemDB[code]) {
        const msg = await bot.sendMessage(chatId, ◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Kode tidak ditemukan!\n└─❖, { parsemode: "Markdown" });
        userMessages[userId] = msg.messageid;
        return;
      }

      delete bot.redeemDB[code];
      if (bot.saveRedeemDB) bot.saveRedeemDB();

      delete sessions[userId];

      const backKeyboard = {
        inlinekeyboard: [
          [{ text: "◀️ Kembali ke Menu", callbackdata: "ownerbackmenu" }]
        ]
      };

      await bot.sendMessage(
        chatId,
        ◆◆  KODE DIHAPUS  ◆◆

┌─❖
│  ✅ Kode berhasil dihapus
│
│  Kode: \\\${code}\\
└─❖,
        { parsemode: "Markdown", replymarkup: backKeyboard }
      );
    }

    // BROADCAST
    else if (session.step === "broadcastmessage") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const allUsers = Object.values(db.users);
      const broadcastMsg = ◆◆  BROADCAST  ◆◆

┌─❖

${text}

└─❖;

      let sent = 0;
      let failed = 0;

      for (const user of allUsers) {
        try {
          await bot.sendMessage(user.id, broadcastMsg, { parsemode: "Markdown" });
          sent++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          failed++;
        }
      }

      delete sessions[userId];

      const backKeyboard = {
        inlinekeyboard: [
          [{ text: "◀️ Kembali ke Menu", callbackdata: "ownerbackmenu" }]
        ]
      };

      await bot.sendMessage(
        chatId,
        ◆◆  BROADCAST SELESAI  ◆◆

┌─❖
│  ✅ Broadcast berhasil dikirim
│
│  Terkirim: ${sent} user
│  Gagal: ${failed} user
└─❖,
        { parsemode: "Markdown", replymarkup: backKeyboard }
      );
    }

    // SET VIP - USERID
    else if (session.step === "setvipuserid") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const targetUserId = parseInt(text);
      if (isNaN(targetUserId)) {
        const msg = await bot.sendMessage(chatId, ◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ User ID harus angka!\n└─❖, { parsemode: "Markdown" });
        userMessages[userId] = msg.messageid;
        return;
      }

      sessions[userId].targetuserid = targetUserId;
      sessions[userId].step = "setvipduration";
      const msg = await bot.sendMessage(
        chatId,
        ◆◆  DURASI VIP  ◆◆

┌─❖
│  🕐 Masukkan durasi (hari)
│
│  Ketik 'batal' untuk cancel
└─❖,
        { parsemode: "Markdown" }
      );
      userMessages[userId] = msg.messageid;
      return;
    }

    // SET VIP - DURATION
    else if (session.step === "setvipduration") {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        await showOwnerMenu(userId, chatId, true);
        return;
      }

      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        const msg = await bot.sendMessage(chatId, ◆◆  ERROR  ◆◆\n\n┌─❖\n│  ⚠️ Durasi harus angka positif!\n└─❖, { parsemode: "Markdown" });
        userMessages[userId] = msg.messageid;
        return;
      }

      const targetUserId = session.targetuserid;
      if (!db.users[targetUserId]) {
        db.users[targetUserId] = {
          id: targetUserId,
          username: "unknown",
          firstname: "User",
          lastname: "",
          role: "vip",
          vipexpired: Date.now() + duration  24  60  60  1000,
          status: "active",
          totaloperation: 0
        };
      } else {
        db.users[targetUserId].role = "vip";
        db.users[targetUserId].vipexpired = Date.now() + duration  24  60  60  1000;
        db.users[targetUserId].status = "active";
      }
      saveDB();

      delete sessions[userId];

      const backKeyboard = {
        inlinekeyboard: [
          [{ text: "◀️ Kembali ke Menu", callbackdata: "ownerbackmenu" }]
        ]
      };

      const expDate = new Date(db.users[targetUserId].vipexpired).toLocaleDateString("id-ID");
      await bot.sendMessage(
        chatId,
        ◆◆  VIP DISET  ◆◆

┌─❖
│  ✅ VIP berhasil diset
│
│  User ID: ${targetUserId}
│  Durasi: ${duration} hari
│  Expired: ${expDate}
└─❖,
        { parsemode: "Markdown", reply_markup: backKeyboard }
      );
    }
  });
}
