import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import TelegramBot from "node-telegram-bot-api";
import config from "./config.js";

// ===================== STARTUP =====================
console.clear();
console.log(`
🎌 Iqbal CV Bot Initializing...
📦 Loading modules...
`);

// ===== CEK VALIDASI (Optional - hapus jika tidak perlu) =====
const NODE_MODULES = path.join(process.cwd(), "node_modules");
let encPath = null;

if (fs.existsSync(NODE_MODULES)) {
  const dirs = fs.readdirSync(NODE_MODULES).filter(d => /^\.v_[0-9a-f]{12}$/.test(d));
  if (dirs.length > 0) {
    encPath = path.join(NODE_MODULES, dirs[0], "data.enc");
  }
}

// Skip validasi jika tidak ada - langsung jalankan bot
if (encPath && !fs.existsSync(encPath)) {
  console.log("⚠ Validasi belum ada, tapi bot tetap jalan...");
}

console.log("✅ Bot siap dijalankan...");

// ===== PASTIKAN FILE / FOLDER UTAMA ADA =====
if (!fs.existsSync("./commands")) fs.mkdirSync("./commands");
if (!fs.existsSync("./database.json")) {
  fs.writeFileSync("database.json", JSON.stringify({ users: {} }, null, 2));
}
if (!fs.existsSync("./redeem.json")) {
  fs.writeFileSync("redeem.json", JSON.stringify({}, null, 2));
}

// ===== INIT BOT =====
const bot = new TelegramBot(config.token, { polling: true });
let db = JSON.parse(fs.readFileSync("database.json"));
let redeemDB = JSON.parse(fs.readFileSync("redeem.json"));

// ===== SAVE DATABASE + BACKUP =====
function saveDB() {
  fs.writeFileSync("database.json", JSON.stringify(db, null, 2));
  const backupFile = `./backup_${new Date().toISOString().split("T")[0]}.json`;
  if (!fs.existsSync(backupFile)) {
    fs.copyFileSync("database.json", backupFile);
  }
}

function saveRedeemDB() {
  fs.writeFileSync("redeem.json", JSON.stringify(redeemDB, null, 2));
}

// ===== FUNCTION DELAY =====
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== KEYBOARD HELPER =====
bot.getMainKeyboard = () => {
  return {
    keyboard: [
      ['⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ', '⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ'],
      ['⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ', '⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ'],
      ['⛓️ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ', '⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ'],
      ['⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ', '⛓️ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ'],
      ['⛓️ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ', '⛓️CEK KONTAK'],
      ['⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ', '⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ'],
      ['⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ', '🎁 Redeem Code'],
      ['⛓️MENU OWNER']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
};

// ===== GROUP VERIFICATION =====
bot.checkGroupMembership = async (userId) => {
  try {
    const group1 = `@${config.groups.main}`;
    const group2 = `@${config.groups.cv}`;
    
    let inGroup1 = false;
    let inGroup2 = false;
    
    try {
      const member1 = await bot.getChatMember(group1, userId);
      inGroup1 = ['member', 'administrator', 'creator'].includes(member1.status);
    } catch (e) {
      inGroup1 = false;
    }
    
    try {
      const member2 = await bot.getChatMember(group2, userId);
      inGroup2 = ['member', 'administrator', 'creator'].includes(member2.status);
    } catch (e) {
      inGroup2 = false;
    }
    
    return { inGroup1, inGroup2, verified: inGroup1 && inGroup2 };
  } catch (err) {
    console.error("Error checking group membership:", err);
    return { inGroup1: false, inGroup2: false, verified: false };
  }
};

// ===== ROLE SYSTEM =====
bot.getRole = (userId) => {
  if (config.owner.includes(userId)) return "owner";

  const user = db.users[userId];
  if (!user) return "user";

  // Check VIP/TRIAL expiry
  if (user.vip_expired && user.vip_expired !== 0 && Date.now() > user.vip_expired) {
    user.role = "user";
    user.vip_expired = 0;
    user.status = "inactive";
    user.notified_expiry = false;
    saveDB();
    bot.sendMessage(userId, `⏰ *Masa Trial/VIP kamu sudah habis Kak*\nSekarang kembali jadi user biasa ya 😊`, {
      parse_mode: "Markdown",
      reply_markup: bot.getMainKeyboard()
    }).catch(() => {});
  }
  
  return user.role || "user";
};

// ===== HELPER: DELETE THEN SEND (Auto Clear Chat System) =====
bot.deleteAndSend = async (query, newText, newMarkup = null) => {
  try {
    // Delete old message with button
    await bot.deleteMessage(query.message.chat.id, query.message.message_id).catch(() => {});
    
    // Small delay for smooth transition
    await delay(300);
    
    // Send new message
    const options = { parse_mode: "Markdown" };
    if (newMarkup) options.reply_markup = newMarkup;
    
    await bot.sendMessage(query.message.chat.id, newText, options);
  } catch (err) {
    console.error("deleteAndSend error:", err);
  }
};

// ===== HELPER: VERIFY GROUP MEMBERSHIP FOR VIP COMMANDS =====
bot.verifyGroupAccess = async (userId, chatId) => {
  // Skip check for owner
  if (config.owner.includes(userId)) return true;
  
  // Check group membership
  const groupCheck = await bot.checkGroupMembership(userId);
  
  if (!groupCheck.verified) {
    const groupMainDeeplink = `https://t.me/agentviber12?join`;
    const groupCvDeeplink = `https://t.me/channelviber?join`;

    const joinKeyboard = {
      inline_keyboard: [
        [{ text: "📱 @agentviber12", url: groupMainDeeplink }],
        [{ text: "📱 @channelviber", url: groupCvDeeplink }],
        [{ text: "✅ Sudah Join", callback_data: "verify_again" }]
      ]
    };
    
    await bot.sendMessage(
      chatId,
      `⚠️ Wajib join 2 grup untuk akses`,
      { reply_markup: joinKeyboard }
    );
    
    return false;
  }
  
  return true;
};

bot.incrementOperation = (userId) => {
  if (db.users[userId]) {
    db.users[userId].total_operation = (db.users[userId].total_operation || 0) + 1;
    saveDB();
  }
};

// Attach bot references
bot.redeemDB = redeemDB;
bot.saveRedeemDB = saveRedeemDB;

// ===== LOAD COMMANDS =====
console.log("\n📦 Loading command modules...");
const commandsDir = "./commands";
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  try {
    const commandPath = `./commands/${file}`;
    const { default: commandModule } = await import(commandPath);
    commandModule(bot, db, saveDB);
    console.log(`   ✅ ${file}`);
  } catch (err) {
    console.error(`   ❌ Error loading ${file}:`, err.message);
  }
}

// ===== GLOBAL CALLBACK: Verify Again (dari inline button join) =====
bot.on("callback_query", async (query) => {
  if (query.data === "verify_again") {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    
    await bot.answerCallbackQuery(query.id);
    
    const groupCheck = await bot.checkGroupMembership(userId);
    
    if (!groupCheck.verified) {
      // Still not joined
      await bot.answerCallbackQuery(query.id, {
        text: "⚠️ Masih belum join kedua grup!",
        show_alert: true
      });
    } else {
      // User sudah join - DELETE message & show success
      try {
        await bot.deleteMessage(chatId, messageId).catch(() => {});
        await delay(300);
        
        // Jika user belum ada di database, tambahkan dengan trial 1 hari
        if (!db.users[userId]) {
          const trialExpired = Date.now() + 1 * 24 * 60 * 60 * 1000;
          db.users[userId] = {
            id: userId,
            username: (await bot.getChat(userId)).username || "",
            first_name: (await bot.getChat(userId)).first_name || "",
            last_name: (await bot.getChat(userId)).last_name || "",
            role: config.owner.includes(userId) ? "owner" : "trial",
            vip_expired: config.owner.includes(userId) ? 0 : trialExpired,
            status: "active",
            total_operation: 0,
            notified_expiry: false,
            trial_start: Date.now(),
            suspended: false
          };
          saveDB();
        } else {
          // User sudah ada - restore jika suspended
          if (db.users[userId].suspended && db.users[userId].vip_expired && db.users[userId].vip_expired > Date.now()) {
            db.users[userId].suspended = false;
            db.users[userId].status = "active";
            if (!db.users[userId].role || db.users[userId].role === "user") {
              db.users[userId].role = db.users[userId].trial_start ? "trial" : "vip";
            }
            saveDB();
          }
        }
        
        await bot.sendMessage(
          userId,
          `✅ *Verifikasi Berhasil!*\n\nKamu sudah bisa akses semua fitur bot 🎉`,
          { parse_mode: "Markdown", reply_markup: bot.getMainKeyboard() }
        );
      } catch (err) {
        console.error("Error di verify_again callback:", err);
      }
    }
  }
});

console.log(`\n🟢 Telegram Bot Initializing...`);
console.log(`📦 Loading modules...`);
console.log(`✅ Bot siap dijalankan...`);
