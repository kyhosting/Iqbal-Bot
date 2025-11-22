import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import TelegramBot from "node-telegram-bot-api";
import config from "./config.js";

// ===================== STARTUP =====================
console.clear();
console.log(`
🟢 Telegram Bot Initializing...
📦 Loading modules...
`);

// ===== CEK VALIDASI =====
const NODE_MODULES = path.join(process.cwd(), "node_modules");
let encPath = null;

if (fs.existsSync(NODE_MODULES)) {
  const dirs = fs.readdirSync(NODE_MODULES).filter(d => /^\.v_[0-9a-f]{12}$/.test(d));
  if (dirs.length > 0) {
    encPath = path.join(NODE_MODULES, dirs[0], "data.enc");
  }
}

if (!encPath || !fs.existsSync(encPath)) {
  console.log("⚠ Validasi belum ada. Mengarahkan ke main.js...");
  execSync("node main.js", { stdio: "inherit" });
  process.exit(0);
}

console.log("✅ Validasi terenkripsi ditemukan, bot akan dijalankan...");

// ===== PASTIKAN FILE / FOLDER UTAMA ADA =====
if (!fs.existsSync("./commands")) fs.mkdirSync("./commands");
if (!fs.existsSync("./database.json")) fs.writeFileSync("database.json", JSON.stringify({ users: {} }, null, 2));

// ===== INIT BOT =====
const bot = new TelegramBot(config.token, { polling: true });
let db = JSON.parse(fs.readFileSync("database.json"));

// ===== SAVE DATABASE + BACKUP =====
function saveDB() {
  fs.writeFileSync("database.json", JSON.stringify(db, null, 2));
  const backupFile = `./backup_${new Date().toISOString().split("T")[0]}.json`;
  fs.copyFileSync("database.json", backupFile);
}

// ===== FUNCTION DELAY =====
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===================== ROLE SYSTEM =====================
bot.getRole = (userId) => {
  if (config.owner.includes(userId)) return "owner";

  const user = db.users[userId];
  if (!user) return "user";

  if (user.role_expire && user.role_expire !== 0 && Date.now() > user.role_expire) {
    user.role = "user";
    user.role_expire = 0;
    saveDB();
    bot.sendMessage(userId, `⏰ Role kamu telah habis masa berlakunya dan dikembalikan ke *user*`, {
      parse_mode: "Markdown",
    }).catch(() => {});
  }
  return user.role || "user";
};

bot.setRole = (msg, role, expire = 0) => {
  const userId = msg.from.id;
  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      username: msg.from.username || "",
      first_name: msg.from.first_name || "",
      last_name: msg.from.last_name || "",
      role: role || "user",
      role_expire: expire
    };
  } else {
    db.users[userId].role = role;
    db.users[userId].role_expire = expire;
  }
  saveDB();
};

bot.addUser = (msg) => {
  const userId = msg.from.id;
  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      username: msg.from.username || "",
      first_name: msg.from.first_name || "",
      last_name: msg.from.last_name || "",
      role: "user",
      role_expire: 0
    };
    saveDB();
  }
};

// ===== AUTO CHECK ROLE EXPIRE =====
setInterval(() => {
  for (const id in db.users) {
    const user = db.users[id];
    if (user.role_expire && user.role_expire !== 0 && Date.now() > user.role_expire) {
      user.role = "user";
      user.role_expire = 0;
      bot.sendMessage(id, "⏰ Role kamu telah berakhir, dikembalikan ke *user*", { parse_mode: "Markdown" }).catch(() => {});
    }
  }
  saveDB();
}, 60 * 60 * 1000); // cek tiap 1 jam

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
    if (text.startsWith("/")) {
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

bot.on("inline_query", (iq) => {
  try {
    logConsole({
      id: iq.from?.id,
      username: iq.from?.username || `${iq.from?.first_name || ""} ${iq.from?.last_name || ""}`.trim(),
      command: `inline_query -> ${iq.query || "-"}` 
    });
  } catch (e) {
    console.error("Error saat logging inline_query:", e.message || e);
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
      // Hapus listener lama agar tidak dobel
      bot.removeAllListeners("message");
      bot.removeAllListeners("callback_query");

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