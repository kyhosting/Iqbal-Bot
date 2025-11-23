import config from "../config.js";

export default function (bot, db, saveDB) {
  const OWNERUSERNAME = config.ownerUsername;
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

  bot.onText(/^\/bantuan$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const hasAccess = await bot.checkGroupOwnerVipAccess(userId, chatId);
    if (!hasAccess) {
      return trackMessage(
        userId,
        chatId,
        ◆◆  AKSES DITOLAK  ◆◆

┌─❖
│  ❌ Fitur grup hanya untuk VIP users kak!
└─❖,
        { parsemode: "Markdown" }
      );
    }

    const groupCheck = await bot.checkGroupMembership(userId);
    if (!groupCheck.verified) {
      return trackMessage(
        userId,
        chatId,
        ◆◆  BANTUAN  ◆◆

┌─❖
│  ⚠️ Akses Ditolak
│
│  Harus join grup terlebih dahulu
└─❖,
        { parsemode: "Markdown" }
      );
    }

    const bugMessage = Halo Owner, saya ingin melaporkan BUG.\n\n• User ID: ${userId}\n\nTulis bug nya disini:;
    const errorMessage = Owner, BOT nya ERROR.\n\n• User ID: ${userId}\n\nError yang terjadi:;
    const featureMessage = Halo Owner, saya ingin request fitur baru.\n\n• User ID: ${userId}\n\nFitur yang saya inginkan:;

    const bugUrl = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(bugMessage)};
    const errorUrl = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(errorMessage)};
    const featureUrl = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(featureMessage)};

    const keyboard = {
      inlinekeyboard: [
        [{ text: "🐞 Lapor Bug", url: bugUrl }],
        [{ text: "⚠️ Bot Error", url: errorUrl }],
        [{ text: "🛠️ Request Fitur", url: featureUrl }],
        [{ text: "💎 Beli VIP", callbackdata: "showviplist" }],
        [{ text: "💬 Chat Owner", url: https://t.me/${OWNERUSERNAME} }]
      ]
    };

    const message = ◆◆  MENU BANTUAN  ◆◆

┌─❖
│  🆘 Ada Yang Bisa Dibantu?
│
│  🐞 Lapor Bug
│
│  ⚠️ Bot Error
│
│  🛠️ Request Fitur
│
│  💎 Beli VIP
│
│  💬 Chat Owner
│
│  Ketik 'bantuan' untuk menu
│  Ketik 'batal' untuk batal
└─❖;

    await trackMessage(userId, chatId, message, {
      parsemode: "Markdown",
      replymarkup: keyboard
    });
  });

  bot.on("callbackquery", async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "showviplist") {
      const vip7Message = Halo Owner, saya ingin membeli VIP.\n\n• Harga: VIP 7 Hari (15K)\n• User ID: ${userId}\n\nMohon diproses 🙏;
      const vip30Message = Halo Owner, saya ingin membeli VIP.\n\n• Harga: VIP 30 Hari (35K)\n• User ID: ${userId}\n\nMohon diproses 🙏;
      const vip1yMessage = Halo Owner, saya ingin membeli VIP.\n\n• Harga: VIP 1 Tahun (100K)\n• User ID: ${userId}\n\nMohon diproses 🙏;

      const vip7Url = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(vip7Message)};
      const vip30Url = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(vip30Message)};
      const vip1yUrl = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(vip1yMessage)};

      const keyboard = {
        inlinekeyboard: [
          [{ text: "💎 VIP 7 Hari — 15K", url: vip7Url }],
          [{ text: "💎 VIP 30 Hari — 35K", url: vip30Url }],
          [{ text: "💎 VIP 1 Tahun — 100K", url: vip1yUrl }],
          [{ text: "🔙 Kembali", callbackdata: "backtobantuan" }]
        ]
      };

      const message = ◆◆  PAKET VIP  ◆◆

┌─❖
│  💎 TERSEDIA
│
│  VIP 7 Hari: 15K
│
│  VIP 30 Hari: 35K (POPULER)
│
│  VIP 1 Tahun: 100K
└─❖

┌─❖
│  ✨ FITUR VIP
│
│  ✓ Konversi file tanpa batas
│
│  ✓ Ekstrak nomor unlimited
│
│  ✓ Gabung & split file
│
│  ✓ Rapikan & clean data
│
│  ✓ Rename & manage file
└─❖;

      await trackMessage(userId, chatId, message, {
        parsemode: "Markdown",
        replymarkup: keyboard
      });

      await bot.answerCallbackQuery(query.id);
    } else if (data === "backtobantuan") {
      const bugMessage = Halo Owner, saya ingin melaporkan BUG.\n\n• User ID: ${userId}\n\nTulis bug nya disini:;
      const errorMessage = Owner, BOT nya ERROR.\n\n• User ID: ${userId}\n\nError yang terjadi:;
      const featureMessage = Halo Owner, saya ingin request fitur baru.\n\n• User ID: ${userId}\n\nFitur yang saya inginkan:;

      const bugUrl = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(bugMessage)};
      const errorUrl = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(errorMessage)};
      const featureUrl = https://t.me/${OWNERUSERNAME}?text=${encodeURIComponent(featureMessage)};

      const keyboard = {
        inlinekeyboard: [
          [{ text: "🐞 Lapor Bug", url: bugUrl }],
          [{ text: "⚠️ Bot Error", url: errorUrl }],
          [{ text: "🛠️ Request Fitur", url: featureUrl }],
          [{ text: "💎 Beli VIP", callbackdata: "showviplist" }],
          [{ text: "💬 Chat Owner", url: https://t.me/${OWNERUSERNAME} }]
        ]
      };

      const message = ◆◆  MENU BANTUAN  ◆◆

┌─❖
│  🆘 Ada Yang Bisa Dibantu?
│
│  🐞 Lapor Bug
│
│  ⚠️ Bot Error
│
│  🛠️ Request Fitur
│
│  💎 Beli VIP
│
│  💬 Chat Owner
│
│  Ketik 'bantuan' untuk menu
│  Ketik 'batal' untuk batal
└─❖;

      await trackMessage(userId, chatId, message, {
        parsemode: "Markdown",
        replymarkup: keyboard
      });

      await bot.answerCallbackQuery(query.id);
    }
  });
}
