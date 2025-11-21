import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import fs from "fs";
import logger from "./logger.js";

// Initialize data directory
const dataDir = "data";
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database adapter using lowdb
const adapter = new JSONFile(path.join(dataDir, "db.json"));
const db = new Low(adapter);

// Default data structure
const defaultData = {
  users: {},
  vip: {},
  warns: {},
  groupSettings: {},
  banned: {},
  logs: []
};

// Initialize database
export async function initializeDatabase() {
  try {
    await db.read();
    
    // Set defaults if empty
    if (!db.data) {
      db.data = defaultData;
    }
    
    // Merge any missing collections
    Object.keys(defaultData).forEach(key => {
      if (!db.data[key]) {
        db.data[key] = defaultData[key];
      }
    });
    
    await db.write();
    logger.info("✅ Database initialized successfully");
    return true;
  } catch (error) {
    logger.error("❌ Database initialization failed:", error);
    return false;
  }
}

// User operations
export const userDB = {
  async getUser(userId) {
    await db.read();
    return db.data.users[userId] || null;
  },
  
  async setUser(userId, data) {
    await db.read();
    db.data.users[userId] = {
      ...db.data.users[userId],
      ...data,
      id: userId,
      updatedAt: new Date().toISOString()
    };
    await db.write();
  },
  
  async getAllUsers() {
    await db.read();
    return db.data.users || {};
  }
};

// VIP operations
export const vipDB = {
  async getVIP(userId) {
    await db.read();
    return db.data.vip[userId] || null;
  },
  
  async setVIP(userId, data) {
    await db.read();
    db.data.vip[userId] = {
      userId,
      ...data,
      createdAt: db.data.vip[userId]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.write();
  },
  
  async deleteVIP(userId) {
    await db.read();
    delete db.data.vip[userId];
    await db.write();
  },
  
  async isVIP(userId) {
    const vip = await this.getVIP(userId);
    if (!vip) return false;
    return new Date(vip.expiresAt) > new Date();
  }
};

// Warn operations
export const warnDB = {
  async getWarns(groupId, userId) {
    await db.read();
    const key = `${groupId}_${userId}`;
    return db.data.warns[key] || { count: 0, warns: [] };
  },
  
  async addWarn(groupId, userId, reason) {
    await db.read();
    const key = `${groupId}_${userId}`;
    if (!db.data.warns[key]) {
      db.data.warns[key] = { count: 0, warns: [] };
    }
    db.data.warns[key].count++;
    db.data.warns[key].warns.push({
      reason,
      timestamp: new Date().toISOString()
    });
    await db.write();
    return db.data.warns[key];
  },
  
  async resetWarns(groupId, userId) {
    await db.read();
    const key = `${groupId}_${userId}`;
    delete db.data.warns[key];
    await db.write();
  }
};

// Group settings operations
export const groupDB = {
  async getGroupSettings(groupId) {
    await db.read();
    return db.data.groupSettings[groupId] || {
      welcome: true,
      antiLink: true,
      antiVirtex: true,
      autoDelete: true,
      vipWhitelist: []
    };
  },
  
  async updateGroupSettings(groupId, settings) {
    await db.read();
    db.data.groupSettings[groupId] = {
      ...db.data.groupSettings[groupId],
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await db.write();
  },
  
  async toggleFeature(groupId, feature) {
    const settings = await this.getGroupSettings(groupId);
    settings[feature] = !settings[feature];
    await this.updateGroupSettings(groupId, settings);
    return settings[feature];
  }
};

// Ban operations
export const banDB = {
  async getBanned(groupId) {
    await db.read();
    return db.data.banned[groupId] || [];
  },
  
  async addBanned(groupId, userId, reason) {
    await db.read();
    if (!db.data.banned[groupId]) {
      db.data.banned[groupId] = [];
    }
    if (!db.data.banned[groupId].find(b => b.userId === userId)) {
      db.data.banned[groupId].push({
        userId,
        reason,
        bannedAt: new Date().toISOString()
      });
    }
    await db.write();
  },
  
  async removeBanned(groupId, userId) {
    await db.read();
    if (db.data.banned[groupId]) {
      db.data.banned[groupId] = db.data.banned[groupId].filter(b => b.userId !== userId);
    }
    await db.write();
  },
  
  async isBanned(groupId, userId) {
    const banned = await this.getBanned(groupId);
    return banned.some(b => b.userId === userId);
  }
};

// Logs operations
export const logsDB = {
  async addLog(data) {
    await db.read();
    db.data.logs.push({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 logs
    if (db.data.logs.length > 1000) {
      db.data.logs = db.data.logs.slice(-1000);
    }
    await db.write();
  },
  
  async getLogs(limit = 50) {
    await db.read();
    return db.data.logs.slice(-limit).reverse();
  }
};

export default db;
