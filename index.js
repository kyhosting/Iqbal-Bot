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
      ['⛓️ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ'],
      ['⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ'],
      ['⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ', '⛓️ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ'],
      ['⛓️ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ'],
      ['⛓️CEK KONTAK', '⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ'],
      ['⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ', '⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ'],
      ['🎁 Redeem Code', '⛓️MENU OWNER']
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

  // Check VIP expiry
  if (user.vip_expired && user.vip_expired !== 0 && Date.now() > user.vip_expired) {
    user.role = "user";
    user.vip_expired = 0;
    user.status = "inactive";
    saveDB();
    bot.sendMessage(userId, `⏰ *Masa VIP kamu sudah habis Kak*\nSekarang kembali jadi user biasa ya 😊`, {
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
    const missingGroups = [];
    if (!groupCheck.inGroup1) missingGroups.push(`@agentviber12`);
    if (!groupCheck.inGroup2) missingGroups.push(`@channelviber`);
    
    await bot.sendMessage(
      chatId,
      `⚠️ *Akses Ditolak Kak!*\n\n` +
      `Kamu harus tetap join grup ini ya:\n` +
      `${missingGroups.map(g => `• ${g}`).join('\n')}\n\n` +
      `Setelah join, coba lagi 😊`,
      { parse_mode: "Markdown" }
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

// ===== AUTO CHECK VIP EXPIRE =====
setInterval(() => {
  for (const id in db.users) {
    const user = db.users[id];
    if (user.vip_expired && user.vip_expired !== 0 && Date.now() > user.vip_expired) {
      user.role = "user";
      user.vip_expired = 0;
      user.status = "inactive";
      bot.sendMessage(id, "⏰ *Masa VIP kamu telah berakhir Kak* 😊\nKembali jadi user biasa ya~", { 
        parse_mode: "Markdown",
        reply_markup: bot.getMainKeyboard()
      }).catch(() => {});
    }
  }
  saveDB();
}, 60 * 60 * 1000); // cek tiap 1 jam

// ===== EXPOSE REDEEM DB =====
bot.redeemDB = redeemDB;
bot.saveRedeemDB = saveRedeemDB;

// ===================== LOGGING SYSTEM =====================
function logConsole({ id, username, command }) {
  const log = `[${new Date().toISOString()}] ID: ${id} | USER: ${username || "-"} | CMD: ${command}\n`;
  fs.appendFileSync("logs.txt", log);
  console.log(log);
}

bot.on("message", (msg) => {
  try {
    if (!msg || !msg.text) return;
    const text = String(msg.text).trim();
    if (text.startsWith("/") || text.startsWith("⛓️") || text.startsWith("🎁")) {
      const cmd = text.split(/\s+/)[0].split("@")[0];
      logConsole({
        id: msg.from?.id || (msg.chat && msg.chat.id) || "unknown",
        username: msg.from?.username || `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim(),
        command: cmd
      });
    }
  } catch (e) {
    console.error("Error saat logging message:", e.message || e);
  }
});

bot.on("callback_query", (q) => {
  try {
    const data = q.data || "";
    logConsole({
      id: q.from?.id,
      username: q.from?.username || `${q.from?.first_name || ""} ${q.from?.last_name || ""}`.trim(),
      command: `callback_query -> ${data}`
    });
  } catch (e) {
    console.error("Error saat logging callback_query:", e.message || e);
  }
});

// ===================== LOAD PLUGINS =====================
async function loadPlugins() {
  await delay(1000);
  const PLUGIN_FOLDER = path.join("./commands");
  const commandFiles = fs.readdirSync(PLUGIN_FOLDER).filter(f => f.endsWith(".js"));
  let loadedPlugins = [];
  let failedPlugins = [];

  for (const file of commandFiles) {
    try {
      const { default: command } = await import(`./commands/${file}?t=${Date.now()}`);
      command(bot, db, saveDB);
      loadedPlugins.push(file);
      await delay(100);
    } catch (err) {
      failedPlugins.push({ file, error: err.message });
    }
  }

  console.log("=======================================");
  if (failedPlugins.length > 0) {
    console.log("⚠ Ada plugin gagal load:");
    failedPlugins.forEach(p => console.log(`- ${p.file}: ${p.error}`));
    console.log("---------------------------------------");
  }

  if (loadedPlugins.length > 20) {
    console.log(`✅ Total plugins: ${loadedPlugins.length} berhasil berjalan...`);
  } else {
    console.log(`✅ Berhasil load plugins (${loadedPlugins.length}):`);
    loadedPlugins.forEach(f => console.log(f));
  }
  console.log("=======================================\n\n\n");

  return commandFiles.length;
}

// ===================== HOT RELOAD PLUGINS =====================
fs.watch("./commands", async (eventType, filename) => {
  if (filename && filename.endsWith(".js")) {
    console.log(`♻ Reloading plugin: ${filename}`);
    try {
      const modulePath = `./commands/${filename}?update=${Date.now()}`;
      const { default: command } = await import(modulePath);
      command(bot, db, saveDB);
      console.log(`✅ ${filename} reloaded successfully`);
    } catch (err) {
      console.error(`❌ Error reload ${filename}:`, err.message);
    }
  }
});

// ===================== BOT INFO =====================
async function showBotInfo(commandCount) {
  await delay(3000);
  bot.getMe().then(info => {
    console.log("======================================");
    console.log("✅ Bot sedang berjalan...");
    console.log(`🤖 Nama Bot : ${info.first_name}`);
    console.log(`🔹 Username : @${info.username}`);
    console.log(`🆔 ID Bot    : ${info.id}`);
    console.log(`📂 Commands  : ${commandCount} file`);
    console.log(`👥 Total User: ${Object.keys(db.users).length}`);
    console.log(`🕒 Start Time: ${new Date().toLocaleString()}`);
    console.log("======================================");
  }).catch(err => {
    console.log("Gagal mengambil informasi bot:", err);
  });
}

// ===================== START =====================
(async () => {
  const count = await loadPlugins();
  await showBotInfo(count);
})();

