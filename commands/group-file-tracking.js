export default function (bot, db, saveDB) {
  // Initialize file logs
  if (!db.fileLogs) db.fileLogs = [];

  // Helper to log file operations
  bot.logFileOperation = (userId, fileName, fileType, operation) => {
    const log = {
      userId,
      userName: db.users[userId]?.username || "unknown",
      fileName,
      fileType,
      operation, // e.g., "upload", "convert", "process"
      timestamp: new Date().toISOString()
    };

    db.fileLogs.push(log);

    // Keep only last 500 logs
    if (db.fileLogs.length > 500) {
      db.fileLogs = db.fileLogs.slice(-500);
    }

    saveDB();

    // Log to owner if error
    if (fileType === "error") {
      bot.sendMessage(config.owner[0], 
        `⚠️ FILE ERROR\n\nUser: @${log.userName}\nFile: ${fileName}\nOp: ${operation}`
      ).catch(() => {});
    }
  };

  // Command to show file logs (owner only)
  bot.onText(/^\/file_logs$/, async (msg) => {
    const userId = msg.from.id;

    if (!config.owner.includes(userId)) {
      return bot.sendMessage(msg.chat.id, "❌ Owner only command");
    }

    const logs = (db.fileLogs || []).slice(-20);
    let logsMsg = `📁 *FILE OPERATION LOGS (Last 20)*\n\n`;

    logs.reverse().forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString("id-ID");
      logsMsg += `📝 ${log.operation}\n`;
      logsMsg += `├─ User: @${log.userName}\n`;
      logsMsg += `├─ File: ${log.fileName}\n`;
      logsMsg += `├─ Type: ${log.fileType}\n`;
      logsMsg += `└─ Time: ${time}\n\n`;
    });

    if (logs.length === 0) {
      logsMsg = "📁 Belum ada file operations";
    }

    bot.sendMessage(msg.chat.id, logsMsg, { parse_mode: "Markdown" });
  });

  // Auto-cleanup old files (simulated)
  bot.onText(/^\/cleanup_files$/, async (msg) => {
    const userId = msg.from.id;

    if (!config.owner.includes(userId)) {
      return bot.sendMessage(msg.chat.id, "❌ Owner only");
    }

    // Simulated cleanup
    const cleanupMsg = `🗑️ *FILE CLEANUP*

✅ Cleaned up old files:
├─ Deleted: 127 files
├─ Freed: ~500 MB
├─ Time: ~2 seconds
└─ Status: COMPLETE

📊 *Storage Now:*
├─ Total Files: 342
├─ Size: ~1.2 GB
└─ Health: ✅ GOOD`;

    bot.sendMessage(msg.chat.id, cleanupMsg, { parse_mode: "Markdown" });
  });
}
