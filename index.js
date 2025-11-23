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
import config from "./config.js";
import { verifyProjectIntegrity, handleIntegrityViolations } from "./verify-integrity.js";

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

// ===== CEK VALIDASI (Optional - hapus jika tidak perlu) =====
const NODE_MODULES = path.join(process.cwd(), "node_modules");
let encPath = null;
try {
  const encModule = path.join(NODE_MODULES, "encryption");
  if (fs.existsSync(encModule)) {
    encPath = encModule;
  }
} catch (e) {}

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
bot.on("polling_error", err => console.error("❌ Polling Error:", err));
bot.on("error", err => console.error("❌ Bot Error:", err));

console.log("🚀 Bot Siap! Loading commands...");
loadCommands().then(() => {
  console.log("✅ Bot Running! 🎌");
  console.log(`🌐 Creator: ${config.botCreator}`);
  console.log(`📱 Support: @${config.ownerUsername}`);
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
