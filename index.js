/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                    🎌 IQBAL CV BOT v2.1 🎌                          ║
 * ║                                                                      ║
 * ║  🔐 OFFICIAL PROJECT BY KIFZL & IQBAL DEV                           ║
 * ║  📝 DO NOT RENAME, MODIFY CREDITS, OR REDISTRIBUTE                  ║
 * ║                                                                      ║
 * ║  ⚖️  License: MIT (Keep Credits Intact)                             ║
 * ║  👤 Creator: KIKI FZL & PARTNER/SUPPORT IQBAL DEV                   ║
 * ║  🌐 GitHub: https://github.com/kyhosting/Iqbal-Bot                  ║
 * ║  💬 Support: @Iqbaldev (Telegram)                                   ║
 * ║                                                                      ║
 * ║  ⚠️  WARNING: Unauthorized modification or redistribution without    ║
 * ║  credits may result in legal action. This project is protected.     ║
 * ║                                                                      ║
 * ║  🚀 Advanced Telegram Bot - File Converter & Contact Manager         ║
 * ║  ✨ Supported: VCF, TXT, XLSX Conversion • VIP System • 24/7 Online  ║
 * ║                                                                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import TelegramBot from "node-telegram-bot-api";

// ===== AUTO-CREATE config.js IF NOT EXISTS =====
const configPath = "./config.js";
const configExamplePath = "./config.example.js";

if (!fs.existsSync(configPath)) {
  console.log("⚠️  config.js not found!");
  if (fs.existsSync(configExamplePath)) {
    console.log("📋 Creating config.js from config.example.js...");
    fs.copyFileSync(configExamplePath, configPath);
    console.log("✅ config.js created! Please edit it with your settings.");
    console.log("📝 Edit these values in config.js:");
    console.log("   - TELEGRAM_BOT_TOKEN (or set TELEGRAM_BOT_TOKEN environment variable)");
    console.log("   - owner: [YOUR_TELEGRAM_ID]");
    console.log("   - ownerUsername");
    console.log("   - groups.main and groups.cv");
    console.log("");
  } else {
    console.error("❌ config.example.js not found either!");
    process.exit(1);
  }
}

// ===== DYNAMIC IMPORT (for config that might be auto-created) =====
const config = (await import("./config.js")).default;
const { verifyProjectIntegrity, handleIntegrityViolations } = await import("./verify-integrity.js");

// ===================== STARTUP =====================
console.clear();
console.log(`
🎌 Iqbal CV Bot Initializing...
📦 Loading modules...
`);

// ✅ VERIFY PROJECT INTEGRITY (Check if credits are intact)
console.log("🔍 Verifying project integrity...");
const integrityResult = verifyProjectIntegrity();
handleIntegrityViolations(integrityResult);

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

// ===== FORMAT MESSAGE HELPER =====
function formatMessage(text) {
  return `${text}`;
}

// Expose to bot
bot.formatMessage = formatMessage;

// ===== KEYBOARD HELPER =====
bot.getMainKeyboard = () => {
  return {
    keyboard: [
      ['⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ ⛓️', '⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ ⛓️'],
      ['⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ ⛓️', '⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️'],
      ['⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ ⛓️', '⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ ⛓️'],
      ['⛓️ ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ ⛓️', '⛓️ ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ ⛓️'],
      ['⛓️ ᴄᴇᴋ ᴋᴏɴᴛᴀᴋ ⛓️', '⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ ⛓️'],
      ['⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️', '⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️'],
      ['🎁 ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ', '⛓️ ᴍᴇɴᴜ ᴏᴡɴᴇʀ ⛓️']
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
};

// ===== KEYBOARD HELPER WITH USER ROLE =====
bot.getMainKeyboardUser = (userId) => {
  try {
    const isOwner = config.owner && config.owner.includes(userId);
    const buttons = [
      ['⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ ⛓️', '⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ ⛓️'],
      ['⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ ⛓️', '⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️'],
      ['⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ ⛓️', '⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ ⛓️'],
      ['⛓️ ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ ⛓️', '⛓️ ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ ⛓️'],
      ['⛓️ ᴄᴇᴋ ᴋᴏɴᴛᴀᴋ ⛓️', '⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ ⛓️'],
      ['⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️', '⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️']
    ];
    
    // Add last row with redeem + owner menu (or just redeem for non-owners)
    if (isOwner) {
      buttons.push(['🎁 ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ', '⛓️ ᴍᴇɴᴜ ᴏᴡɴᴇʀ ⛓️']);
    } else {
      buttons.push(['🎁 ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ']);
    }
    
    return {
      keyboard: buttons,
      resize_keyboard: true,
      one_time_keyboard: false
    };
  } catch (err) {
    // Fallback to default keyboard
    return bot.getMainKeyboard();
  }
};

// ===== GROUP VERIFICATION =====
bot.checkGroupMembership = async (userId) => {
  try {
    const group1 = `@${config.groups.main}`;
    const group2 = `@${config.groups.cv}`;
    return true;
  } catch (err) {
    return false;
  }
};

// ===== GET USER ROLE =====
bot.getRole = (userId) => {
  if (config.owner && config.owner.includes(userId)) {
    return "owner";
  }
  if (db.users && db.users[userId] && db.users[userId].role) {
    return db.users[userId].role;
  }
  return "user";
};

// ===== CHECK IF USER IS VIP =====
bot.isVip = (userId) => {
  const role = bot.getRole(userId);
  return ["owner", "admin", "vip"].includes(role);
};

// ===== GET USER DATA =====
bot.getUser = (userId) => {
  if (!db.users) db.users = {};
  if (!db.users[userId]) {
    db.users[userId] = {
      role: "user",
      joinedAt: new Date().toISOString(),
      totalOperations: 0
    };
  }
  return db.users[userId];
};

// ===== VERIFY GROUP ACCESS =====
bot.verifyGroupAccess = async (userId, chatId) => {
  try {
    const role = bot.getRole(userId);
    if (["owner", "admin", "vip"].includes(role)) return true;
    return false;
  } catch (err) {
    return false;
  }
};

// ===== SEND VIP PANEL =====
bot.sendVipPanel = async (chatId, userId, title = "🎌 VIP PANEL") => {
  try {
    const role = bot.getRole(userId);
    const message = `${title}\n\nYour role: ${role}\n✨ Enjoy VIP features!`;
    return await bot.sendMessage(chatId, message, { 
      parse_mode: "HTML",
      reply_markup: bot.getMainKeyboardUser(userId)
    });
  } catch (err) {
    console.error("Error sending VIP panel:", err);
  }
};

// ===== DELETE MESSAGE SAFE =====
bot.deleteMessageSafe = async (chatId, messageId) => {
  try {
    if (messageId) {
      await bot.deleteMessage(chatId, messageId);
      return true;
    }
  } catch (err) {
    return false;
  }
};

// ===== SEND TEMP MESSAGE =====
bot.sendTempMessage = async (chatId, text, deleteAfter = 10000) => {
  try {
    const msg = await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
    if (deleteAfter > 0) {
      setTimeout(() => {
        bot.deleteMessageSafe(chatId, msg.message_id);
      }, deleteAfter);
    }
    return msg;
  } catch (err) {
    console.error("Error sending temp message:", err);
  }
};

// ===== INCREMENT OPERATION COUNTER =====
bot.incrementOperation = (userId) => {
  try {
    if (!bot.db.users) bot.db.users = {};
    if (!bot.db.users[userId]) {
      bot.db.users[userId] = {
        id: userId,
        username: "",
        first_name: "",
        last_name: "",
        role: "user",
        vip_expired: 0,
        status: "active",
        total_operation: 0
      };
    }
    bot.db.users[userId].total_operation = (bot.db.users[userId].total_operation || 0) + 1;
    bot.saveDB();
    return bot.db.users[userId].total_operation;
  } catch (err) {
    console.error("Error incrementing operation:", err);
    return 0;
  }
};

// ===== EXPOSE DATABASE & SAVE FUNCTIONS =====
bot.db = db;
bot.redeemDB = redeemDB;
bot.saveDB = saveDB;
bot.saveRedeemDB = saveRedeemDB;

// ===== CHECK IF OWNER OR VIP ACCESS =====
bot.checkGroupOwnerVipAccess = async (userId, chatId) => {
  try {
    const isOwner = config.owner && config.owner.includes(userId);
    const role = bot.getRole(userId);
    return isOwner || ["admin", "vip"].includes(role);
  } catch (err) {
    return false;
  }
};

// ===== SHOW DASHBOARD =====
bot.showDashboard = async (userId, chatId) => {
  try {
    const role = bot.getRole(userId);
    const isOwner = config.owner && config.owner.includes(userId);
    
    let roleText = "👤 User";
    if (isOwner) roleText = "👑 Owner";
    else if (role === "admin") roleText = "🔐 Admin";
    else if (role === "vip") roleText = "💎 VIP";
    else if (role === "trial") roleText = "⭐ Trial";
    
    const user = bot.db.users[userId] || {};
    const vipDaysLeft = user.vip_expired > Date.now() 
      ? Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const dashboardMsg = `◆◆  DASHBOARD  ◆◆

┌─❖
│  ${roleText}
│
│  📊 Stats:
│  • Operations: ${user.total_operation || 0}
${user.vip_expired > Date.now() ? `│  • VIP Days: ${vipDaysLeft}` : ""}
│
│  🎯 Choose feature:
│  • Conversion
│  • File Tools
│  • VIP Features
│
│  Ketik 'fitur' untuk daftar lengkap
└─❖`;

    return bot.sendMessage(chatId, dashboardMsg, {
      parse_mode: "HTML",
      reply_markup: bot.getMainKeyboardUser(userId)
    });
  } catch (err) {
    console.error("Error showing dashboard:", err);
  }
};

// ===== DOWNLOAD FILE FROM TELEGRAM =====
bot.downloadFile = async (fileId) => {
  try {
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const res = await fetch(fileUrl);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error("Error downloading file:", err);
    return null;
  }
};

// ===== LOAD COMMANDS =====
async function loadCommands() {
  const commandsPath = path.join(process.cwd(), "commands");
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
  
  console.log(`📁 Loading ${commandFiles.length} commands...`);
  for (const file of commandFiles) {
    try {
      const command = await import(`./commands/${file}`);
      if (command.default) {
        command.default(bot, db, redeemDB, saveDB, saveRedeemDB);
      }
    } catch (err) {
      console.error(`❌ Error loading ${file}:`, err.message);
    }
  }
}

// ===== ON BOT START =====
bot.on("polling_error", err => {
  // Suppress 404 errors (invalid/placeholder token) - they spam constantly
  if (err.code === 'ETELEGRAM' && err.response?.body?.error_code === 404) {
    return; // Skip logging 404 errors
  }
  
  // Handle 409 Conflict - multiple instances running
  if (err.response?.statusCode === 409) {
    console.error(`\n⚠️  409 CONFLICT ERROR - Another bot instance already running!`);
    console.error(`📌 Only ONE bot instance allowed per token at a time.`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Stop the other bot instance (Replit/Termux/VPS)`);
    console.error(`   2. Wait 30+ seconds for Telegram to reset`);
    console.error(`   3. Try running again\n`);
    console.error(`Shutting down gracefully...`);
    saveDB();
    saveRedeemDB();
    process.exit(0);
  }
  
  console.error("❌ Polling Error:", err.message);
});
bot.on("error", err => {
  // Suppress 404 errors
  if (err.message?.includes("404")) {
    return;
  }
  
  // Handle 409 Conflict in error handler too
  if (err.message?.includes("409") || err.message?.includes("Conflict")) {
    console.error(`\n⚠️  409 CONFLICT - Another instance running!`);
    console.error(`Shutting down...\n`);
    saveDB();
    saveRedeemDB();
    process.exit(0);
  }
  
  console.error("❌ Bot Error:", err.message);
});

console.log("🚀 Bot Siap! Loading commands...");
loadCommands().then(() => {
  console.log("✅ Bot Running! 🎌");
  console.log(`🌐 Creator: ${config.botCreator}`);
  const supportUsername = config.ownerUsername && config.ownerUsername !== "YOUR_USERNAME" 
    ? config.ownerUsername 
    : "Iqbaldev";
  console.log(`📱 Support: @${supportUsername}`);
}).catch(err => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Bot shutting down gracefully...");
  saveDB();
  saveRedeemDB();
  process.exit(0);
});

export { bot, db, redeemDB, saveDB, saveRedeemDB, delay };
