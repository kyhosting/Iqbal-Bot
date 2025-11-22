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

// ===== KEYBOARD HELPER FOR USER (Filter berdasarkan role) =====
bot.getMainKeyboardUser = (userId) => {
  const baseKeyboard = [
    ['⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ', '⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ'],
    ['⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ', '⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ'],
    ['⛓️ ᴇxᴛʀᴀᴋ ɴᴏᴍᴏʀ', '⛓️ ʙᴀɢɪ ʟᴀɴᴊᴜᴛ'],
    ['⛓️ GABUNG FILE', '⛓️ᴘᴏᴛᴏɴɢ ʟᴀɴᴊᴜᴛ'],
    ['⛓️ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ', '⛓️CEK KONTAK'],
    ['⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ', '⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ'],
    ['⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ', '🎁 Redeem Code']
  ];
  
  // Tambah MENU OWNER hanya untuk owner
  if (config.owner.includes(userId)) {
    baseKeyboard.push(['⛓️MENU OWNER']);
  }
  
  return {
    keyboard: baseKeyboard,
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
  
  // Check if user is suspended
  const user = db.users[userId];
  if (user && user.suspended) {
    const groupMainDeeplink = `https://t.me/agentviber12?join`;
    const groupCvDeeplink = `https://t.me/channelviber?join`;

    const rejoinKeyboard = {
      inline_keyboard: [
        [{ text: "📱 @agentviber12", url: groupMainDeeplink }],
        [{ text: "📱 @channelviber", url: groupCvDeeplink }]
      ]
    };
    
    // Show remaining days if active
    let remainingText = "";
    if (user.vip_expired && user.vip_expired > Date.now()) {
      const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
      remainingText = `\n\n✨ Sisa akses kamu: <b>${daysLeft} hari</b>\nJoin kembali untuk aktifkan!`;
    }
    
    await bot.sendMessage(
      chatId,
      `❌ <b>Akses Dicabut Sementara Kak!</b>\n\nKamu keluar dari salah satu grup 😢${remainingText}`,
      { parse_mode: "HTML", reply_markup: rejoinKeyboard }
    );
    
    return false;
  }
  
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
       { parse_mode: "HTML", reply_markup: joinKeyboard }
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

// ===== HELPER: Show Dashboard (with profile photo) =====
bot.showDashboard = async (userId, chatId) => {
  let user = db.users[userId];

  // Jika user belum ada, tambahkan ke database + kasih trial 1 hari
  if (!user) {
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

    // Notif trial diberikan (hanya untuk non-owner)
    if (!config.owner.includes(userId)) {
      await bot.sendMessage(
        userId,
        `🎁 <b>TRIAL 1 HARI GRATIS!</b>\n\nSelamat! Kamu sudah verifikasi grup 🎉\n\n✅ Akses trial selama 1 hari sudah aktif!\n⏰ Berlaku sampai: ${new Date(trialExpired).toLocaleDateString("id-ID")}\n\nNikmati semua fitur premium dulu ya Kak! 💎\nSetelah trial habis, beli VIP untuk terus akses 😊`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      ).catch(() => {});
    }
  } else {
    // User sudah ada - restore jika suspended
    if (user.suspended && user.vip_expired && user.vip_expired > Date.now()) {
      user.suspended = false;
      user.status = "active";
      if (!user.role || user.role === "user") {
        user.role = user.trial_start ? "trial" : "vip";
      }
      saveDB();

      const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
      await bot.sendMessage(
        userId,
        `✅ <b>Akses Dipulihkan Kak!</b>\n\nKamu sudah join kedua grup 🎉\n\n✨ Trial/VIP kamu aktif kembali!\n⏰ Sisa: <b>${daysLeft} hari</b>\n\nLanjut nikmati fitur premium ya 😊`,
        { parse_mode: "HTML", reply_markup: bot.getMainKeyboardUser(userId) }
      ).catch(() => {});
    }
  }

  // Get user data (refresh)
  user = db.users[userId];
  const role = bot.getRole(userId);

  // Hitung sisa hari VIP
  let expired = "Tidak Aktif";
  let remaining = "0 hari";
  let status = user.status || "inactive";

  if (user.vip_expired && user.vip_expired > Date.now()) {
    const expDate = new Date(user.vip_expired);
    expired = expDate.toLocaleDateString("id-ID");
    const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
    remaining = `${daysLeft} hari`;
    status = "active";
  }

  // Caption dengan format EXACT (tidak boleh diubah sekalipun 1 huruf)
  const caption = `🎌 iqbal ᴄᴠ ʙᴏᴛꜱ\n(by iqbaldev)\n\n╭─❖\n│ こんにちは、私は Iqbalʙᴏᴛ です。\n│ 私はファイル変換と管理を担当します。\n│ ✦ Created by: @Iqbaldev\n╰───────────────❖\n\n╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ\n│ ➤ Nama: <b>${user.first_name || "User"}</b>\n│ ➤ ID: <code>${userId}</code>\n│ ➤ Username: @${user.username || "-"}\n│ ➤ Role: <b>${role.toUpperCase()}</b>\n│ ➤ Status: <b>${status === "active" ? "✅ Aktif" : "❌ Tidak Aktif"}</b>\n│ ➤ Masa Aktif: <b>${expired}</b>\n│ ➤ Hari Tersisa: <b>${remaining}</b>\n│ ➤ Total Operasi: <b>${user.total_operation || 0}</b>\n╰───────────────❖\n\n╭─❖ ꜰɪʟᴇ ꜰᴏʀᴍᴀᴛ ꜱᴜᴘᴘᴏʀᴛ\n│ ➤ 📄 TXT 📇 VCF 📊 XLSX\n│ ➤ 他の形式も順次対応予定です。\n╰───────────────❖\n\n╭─❖ ᴍᴇɴᴜ ʙᴏᴛ\n│ ➤ ⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ\n│ ➤ ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ\n│ ➤ ⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ\n│ ➤ ⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ\n│ ➤ ⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ\n│ ➤ ⛓️ ꜱᴘʟɪᴛ ꜰɪʟᴇ\n│ ➤ ⛓️ GABUNG FILE\n│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ\n│ ➤ ⛓️ ᴀᴍʙɪʟ ɴᴀᴍᴀ ꜰɪʟᴇ\n│ ➤ ⛓️ ʙᴜᴀᴛ ɴᴀᴍᴀ\n│ ➤ ⛓️ ᴀᴅᴍ & ɴᴀᴠʏ\n│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ\n│ ➤ ⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ\n╰───────────────❖\n\n💎 ご利用ありがとうございます。\nこのボットは常に進化しています ⚙️`;

  try {
    const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      await bot.sendPhoto(chatId, fileId, {
        caption: caption,
        parse_mode: "HTML",
        reply_markup: bot.getMainKeyboardUser(userId)
      });
    } else {
      await bot.sendMessage(chatId, caption, {
        parse_mode: "HTML",
        reply_markup: bot.getMainKeyboardUser(userId)
      });
    }
  } catch (err) {
    console.error("Error getting profile photo:", err);
    await bot.sendMessage(chatId, caption, {
      parse_mode: "HTML",
      reply_markup: bot.getMainKeyboardUser(userId)
    });
  }
};

// ===== AUTO-SUSPEND WHEN USER LEAVES GROUP =====
bot.on("my_chat_member", async (update) => {
  try {
    const userId = update.from.id;
    const chatId = update.chat.id;
    const newStatus = update.new_chat_member.status;
    const oldStatus = update.old_chat_member.status;
    
    // Only process if user LEFT (status changed from member to left/kicked)
    if ((oldStatus === "member" || oldStatus === "administrator" || oldStatus === "creator") &&
        (newStatus === "left" || newStatus === "kicked")) {
      
      // Check if user exists in database
      if (db.users[userId]) {
        const user = db.users[userId];
        
        // Check if user still in both groups or NOT
        const groupCheck = await bot.checkGroupMembership(userId);
        
        // If user is NOT verified (not in both groups) → SUSPEND ACCESS
        if (!groupCheck.verified) {
          // SUSPEND: Set flag but PRESERVE vip_expired
          user.suspended = true;
          user.status = "suspended";
          // vip_expired TIDAK direset - tetap tersimpan!
          saveDB();
          
          // Notify user about suspension
          const groupMainDeeplink = `https://t.me/agentviber12?join`;
          const groupCvDeeplink = `https://t.me/channelviber?join`;
          
          const rejoinKeyboard = {
            inline_keyboard: [
              [{ text: "📱 @agentviber12", url: groupMainDeeplink }],
              [{ text: "📱 @channelviber", url: groupCvDeeplink }]
            ]
          };
          
          // Show remaining days if VIP/trial still active
          let remainingText = "";
          if (user.vip_expired && user.vip_expired > Date.now()) {
            const daysLeft = Math.ceil((user.vip_expired - Date.now()) / (1000 * 60 * 60 * 24));
            remainingText = `\n\n✨ Sisa akses kamu masih ada: <b>${daysLeft} hari</b>\n\nJoin kembali ke grup untuk aktifkan akses!`;
          }
          
          await bot.sendMessage(
            userId,
            `❌ <b>Akses Dicabut Sementara Kak!</b>\n\nKamu keluar dari salah satu grup 😢${remainingText}`,
            { parse_mode: "HTML", reply_markup: rejoinKeyboard }
          ).catch(() => {});
          
          console.log(`⚠️ [SUSPENDED] User ${userId} left group - access suspended`);
        }
      }
    }
  } catch (err) {
    console.error("Error in my_chat_member handler:", err);
  }
});

// ===== MESSAGE MONITORING: ANTI-LINK, ANTI-SPAM, ANTI-TOXSI =====
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || msg.caption || "";
    const messageId = msg.message_id;
    
    // Skip private messages dan skip bot commands
    if (msg.chat.type === "private" || /^\//.test(text)) return;
    
    // Get group settings
    const groupsDB = JSON.parse(fs.readFileSync("groups.json"));
    const groupSettings = groupsDB.groups[chatId] || {};
    
    // ANTI-LINK: Delete messages with links
    const hasLink = /(http|https|t\.me|telegram)/gi.test(text);
    if (hasLink && groupSettings.antiLink !== false) {
      try {
        await bot.deleteMessage(chatId, messageId).catch(() => {});
        await bot.sendMessage(
          chatId,
          `⛔ <b>Link dilarang di grup ini!</b>\n\n@${msg.from.username || "user"}, link tidak boleh di-share di sini.`,
          { parse_mode: "HTML" }
        ).then(m => {
          setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 3000);
        });
        return;
      } catch (e) {}
    }
    
    // ANTI-SPAM: Detect rapid messages (more than 5 messages in 10 seconds)
    if (!bot.userMessageCount) bot.userMessageCount = {};
    if (!bot.userMessageCount[userId]) {
      bot.userMessageCount[userId] = [];
    }
    
    const now = Date.now();
    bot.userMessageCount[userId].push(now);
    bot.userMessageCount[userId] = bot.userMessageCount[userId].filter(t => now - t < 10000);
    
    if (bot.userMessageCount[userId].length > 5 && groupSettings.antiSpam !== false) {
      try {
        await bot.deleteMessage(chatId, messageId).catch(() => {});
        await bot.sendMessage(
          chatId,
          `⛔ <b>Spam terdeteksi!</b>\n\n@${msg.from.username || "user"}, jangan spam pesan!`,
          { parse_mode: "HTML" }
        ).then(m => {
          setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 3000);
        });
        return;
      } catch (e) {}
    }
    
    // ANTI-TOXSI: Detect offensive words
    const toxsiWords = ["anjing", "babi", "kontol", "goblok", "tolol", "kacau", "bangsat"];
    const hasToxsi = toxsiWords.some(word => text.toLowerCase().includes(word));
    
    if (hasToxsi && groupSettings.antiToxsi !== false) {
      try {
        await bot.deleteMessage(chatId, messageId).catch(() => {});
        await bot.sendMessage(
          chatId,
          `⛔ <b>Bahasa tidak sopan!</b>\n\n@${msg.from.username || "user"}, jaga bahasa kamu di grup ini!`,
          { parse_mode: "HTML" }
        ).then(m => {
          setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 3000);
        });
        return;
      } catch (e) {}
    }
  } catch (err) {
    console.error("Error in message monitoring:", err);
  }
});

// ===== NEW MEMBER GREETING =====
bot.on("new_chat_members", async (msg) => {
  try {
    const chatId = msg.chat.id;
    
    // Get group settings and welcome message
    const groupsDB = JSON.parse(fs.readFileSync("groups.json"));
    const groupSettings = groupsDB.groups[chatId] || {};
    
    if (!groupSettings.welcome) return;
    
    // Send welcome message for each new member
    for (const member of msg.new_chat_members) {
      let welcomeMsg = groupSettings.welcome;
      welcomeMsg = welcomeMsg.replace(/{user}/g, `@${member.username || member.first_name}`);
      welcomeMsg = welcomeMsg.replace(/{name}/g, member.first_name);
      welcomeMsg = welcomeMsg.replace(/{group}/g, msg.chat.title);
      
      await bot.sendMessage(chatId, welcomeMsg, { parse_mode: "HTML" });
    }
  } catch (err) {
    console.error("Error in new member greeting:", err);
  }
});

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
      // User sudah join - DELETE message & show dashboard with photo
      try {
        await bot.deleteMessage(chatId, messageId).catch(() => {});
        await delay(300);
        
        // Show dashboard aesthetic dengan foto profil
        await bot.showDashboard(userId, chatId);
      } catch (err) {
        console.error("Error di verify_again callback:", err);
      }
    }
  }
});

console.log(`\n🟢 Telegram Bot Initializing...`);
console.log(`📦 Loading modules...`);
console.log(`✅ Bot siap dijalankan...`);
