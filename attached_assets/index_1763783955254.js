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

  // Check VIP/TRIAL expiry
  if (user.vip_expired && user.vip_expired !== 0 && Date.now() > user.vip_expired) {
    user.role = "user";
    user.vip_expired = 0;
    user.status = "inactive";
    user.notified_expiry = false;
    saveDB();
    bot.sendMessage(userId, `⏰ <b>Masa Trial/VIP kamu sudah habis Kak</b>\nSekarang kembali jadi user biasa ya 😊`, {
      parse_mode: "HTML",
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
    const options = { parse_mode: "HTML" };
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
        
        // Helper: Format dashboard message (EXACT format dari user)
        const getDashboardMessage = (user) => {
          const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 <b> 60 </b> 60 * 24));
          const expireDate = new Date(user.vip_expired).toLocaleDateString("id-ID");
          
          return `🎌 <b>iqbal ᴄᴠ ʙᴏᴛꜱ</b>\n(by iqbaldev)\n\n` +
            `╭─❖\n` +
            `│ こんにちは、私は Iqbalʙᴏᴛ です。\n` +
            `│ 私はファイル変換と管理を担当します。\n` +
            `│ ✦ Created by: @Iqbaldev\n` +
            `╰───────────────❖\n\n` +
            `╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ\n` +
            `│ ➤ Nama: <b>${user.first_name || "User"}</b>\n` +
            `│ ➤ ID: \`${user.id}\`\n` +
            `│ ➤ Username: @${user.username || "-"}\n` +
            `│ ➤ Role: <b>${user.role.toUpperCase()}</b>\n` +
            `│ ➤ Status: <b>✅ Aktif</b>\n` +
            `│ ➤ Masa Aktif: <b>${expireDate}</b>\n` +
            `│ ➤ Hari Tersisa: <b>${daysLeft} hari</b>\n` +
            `│ ➤ Total Operasi: <b>${user.total_operation || 0}</b>\n` +
            `╰───────────────❖\n\n` +
            `╭─❖ ꜰɪʟᴇ ꜰᴏʀᴍᴀᴛ ꜱᴜᴘᴘᴏʀᴛ\n` +
            `│ ➤ 📄 TXT 📇 VCF 📊 XLSX\n` +
            `│ ➤ 他の形式も順次対応予定です。\n` +
            `╰───────────────❖\n\n` +
            `╭─❖ ᴍᴇɴᴜ ʙᴏᴛ\n` +
            `│ ➤ ⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ\n` +
            `│ ➤ ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ\n` +
            `│ ➤ ⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n` +
            `│ ➤ ⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ\n` +
            `│ ➤ ⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n` +
            `│ ➤ ⛓️ ꜱᴘʟɪᴛ ꜰɪʟᴇ\n` +
            `│ ➤ ⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ\n` +
            `│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ\n` +
            `│ ➤ ⛓️ ᴀᴍʙɪʟ ɴᴀᴍᴀ ꜰɪʟᴇ\n` +
            `│ ➤ ⛓️ ʙᴜᴀᴛ ɴᴀᴍᴀ\n` +
            `│ ➤ ⛓️ ᴀᴅᴍ & ɴᴀᴠʏ\n` +
            `│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ\n` +
            `│ ➤ ⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ\n` +
            `╰───────────────❖\n\n` +
            `💎 ご利用ありがとうございます。\n` +
            `このボットは常に進化しています ⚙️`;
        };
        
        // Jika user belum ada di database, tambahkan dengan trial 1 hari
        if (!db.users[userId]) {
          const trialExpired = Date.now() + 1 <b> 24 </b> 60 <b> 60 </b> 1000;
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
          
          // Send dashboard dengan foto profil
          const caption = getDashboardMessage(db.users[userId]);
          try {
            const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
            if (photos.total_count > 0) {
              const fileId = photos.photos[0][0].file_id;
              await bot.sendPhoto(userId, fileId, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: bot.getMainKeyboard()
              });
            } else {
              await bot.sendMessage(userId, caption, {
                parse_mode: "HTML",
                reply_markup: bot.getMainKeyboard()
              });
            }
          } catch (err) {
            await bot.sendMessage(userId, caption, {
              parse_mode: "HTML",
              reply_markup: bot.getMainKeyboard()
            }).catch(() => {});
          }
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
          
          // Send dashboard dengan foto profil
          const caption = getDashboardMessage(db.users[userId]);
          try {
            const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
            if (photos.total_count > 0) {
              const fileId = photos.photos[0][0].file_id;
              await bot.sendPhoto(userId, fileId, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: bot.getMainKeyboard()
              });
            } else {
              await bot.sendMessage(userId, caption, {
                parse_mode: "HTML",
                reply_markup: bot.getMainKeyboard()
              });
            }
          } catch (err) {
            await bot.sendMessage(userId, caption, {
              parse_mode: "HTML",
              reply_markup: bot.getMainKeyboard()
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error di verify_again callback:", err);
      }
    }
  }
});

// ===== AUTO CHECK VIP EXPIRE + TRIAL NOTIFICATION =====
setInterval(() => {
  for (const id in db.users) {
    const user = db.users[id];
    
    // Notif trial/VIP akan habis dalam 6 jam
    if (user.vip_expired && user.vip_expired > Date.now() && user.vip_expired - Date.now() < 6 <b> 60 </b> 60 * 1000 && !user.notified_expiry) {
      const hours = Math.ceil((user.vip_expired - Date.now()) / (1000 <b> 60 </b> 60));
      bot.sendMessage(id, `⏰ <b>PERINGATAN: Trial/VIP kamu akan habis dalam ${hours} jam lagi Kak!</b>\n\n🎁 Perpanjang sekarang sebelum akses dicabut ya! 😊`, { 
        parse_mode: "HTML",
        reply_markup: bot.getMainKeyboard()
      }).catch(() => {});
      user.notified_expiry = true;
      saveDB();
    }
    
    // VIP expire
    if (user.vip_expired && user.vip_expired !== 0 && Date.now() > user.vip_expired) {
      user.role = "user";
      user.vip_expired = 0;
      user.status = "inactive";
      user.notified_expiry = false;
      bot.sendMessage(id, "⏰ <b>Masa Trial/VIP kamu telah berakhir Kak</b> 😊\n\nKembali jadi user biasa ya. Beli VIP lagi untuk akses fitur premium!", { 
        parse_mode: "HTML",
        reply_markup: bot.getMainKeyboard()
      }).catch(() => {});
    }
  }
  saveDB();
}, 30 <b> 60 </b> 1000); // cek tiap 30 menit

// ===== GROUP LEAVE DETECTOR - AUTO REVOKE AKSES (Suspend, not delete trial) =====
bot.on("my_chat_member", async (update) => {
  const userId = update.from.id;
  const groupName = update.chat.username;
  
  // Cek jika bot atau user keluar dari group
  if (update.new_chat_member.status === "left" || update.new_chat_member.status === "kicked") {
    const groupCheck = await bot.checkGroupMembership(userId);
    
    if (!groupCheck.verified) {
      const user = db.users[userId];
      if (user && (user.role === "vip" || user.role === "trial")) {
        // JANGAN RESET vip_expired - hanya suspend akses!
        user.suspended = true;
        user.status = "suspended";
        saveDB();
        
        bot.sendMessage(userId, 
          `⚠️ <b>Anda Keluar Dari Grup</b>\n\n` +
          `Akses bot dihentikan. Silakan join kembali untuk melanjutkan.\n\n` +
          `📌 Grup yang wajib diikuti:\n` +
          `• @agentviber12\n` +
          `• @channelviber\n\n` +
          `Ketik /start untuk verifikasi ulang 😊`,
          { parse_mode: "HTML" }
        ).catch(() => {});
      }
    }
  }
});

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

