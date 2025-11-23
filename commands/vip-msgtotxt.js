/**
 * 🎌 IQBAL CV BOT - OFFICIAL MODULE 🎌
 * 
 * 🔐 BY: KIFZL & IQBAL DEV
 * 📝 DO NOT RENAME, MODIFY OR REDISTRIBUTE
 * 
 * GitHub: https://github.com/kyhosting/Iqbal-Bot
 * License: MIT (Keep Credits Intact)
 * 
 * ⚠️  Unauthorized modification may result in legal action
 */

import fs from "fs";
import path from "path";

export default function (bot, db, redeemDB, saveDB, saveRedeemDB) {
  const sessions = {};
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

  async function sendWithDelete(userId, chatId, text, options = {}) {
    return trackMessage(userId, chatId, text, options);
  }

  bot.onText(/^⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️$|^⛓️ MSG TO TXT ⛓️$/i, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const hasAccess = await bot.verifyGroupAccess(userId, chatId);
    if (!hasAccess) return;

    const role = bot.getRole(userId);
    if (!["owner", "admin", "vip", "trial"].includes(role)) {
      return trackMessage(
        userId,
        chatId,
        `◆◆  MSG TO TXT  ◆◆

┌─❖
│  ❌ Akses Ditolak
│
│  Fitur khusus VIP
└─❖`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      );
    }

    sessions[userId] = { step: 1 };
    await trackMessage(
      userId,
      chatId,
      `◆◆  MSG TO TXT  ◆◆

┌─❖
│  Message to File
│
│  Kirim teks atau nomor
│
│  Simpan jadi file TXT
│
│  Ketik 'batal' batalkan
└─❖`,
      { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
    );
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text?.trim();

    if (!sessions[userId]) return;

    const session = sessions[userId];

    if (session.step === 1) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.content = text;
      session.step = 2;
      return trackMessage(
        userId,
        chatId,
        `◆◆  ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️  ◆◆

┌─❖
│  ⏳ Processing...
│
│  Perintah:
│  • done  — proses & kirim hasil file
│  • batal — batalkan proses
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 2) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      if (!/^done$/i.test(text)) {
        return trackMessage(
          userId,
          chatId,
          `◆◆  ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️  ◆◆

┌─❖
│  ⚠️ Ketik 'done' atau 'batal'
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.step = 3;
      return trackMessage(
        userId,
        chatId,
        `◆◆  MSG TO TXT  ◆◆

┌─❖
│  📝 Nama File
│
│  Masukkan nama file
│
│  (Tanpa ekstensi .txt)
└─❖`,
        { parse_mode: "HTML" }
      );
    }

    if (session.step === 3) {
      if (/^batal$/i.test(text)) {
        delete sessions[userId];
        return sendWithDelete(
          userId,
          chatId,
          `◆◆  DIBATALKAN  ◆◆

┌─❖
│  ❌ Proses dibatalkan
└─❖`,
          { parse_mode: "HTML" }
        );
      }

      session.filename = text.replace(/[^a-zA-Z0-9-_]/g, "_") + ".txt";

      {
        try {
          const outputPath = path.join(process.cwd(), session.filename);
          fs.writeFileSync(outputPath, session.content);

          await bot.sendDocument(chatId, outputPath, {}, {
            filename: session.filename,
          });

          bot.incrementOperation(userId);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

          delete sessions[userId];
          return sendWithDelete(
            userId,
            chatId,
            `◆◆  SUKSES  ◆◆

┌─❖
│  ✅ File TXT dibuat
└─❖`,
            { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
          );
        } catch (e) {
          delete sessions[userId];
          return sendWithDelete(
            userId,
            chatId,
            `◆◆  ERROR  ◆◆

┌─❖
│  ❌ Ada masalah
└─❖`,
            { parse_mode: "HTML" }
          );
        }
      }
    }
  });

}
