"""Helper functions untuk Iqbal CV Bot"""
import json
import os
from datetime import datetime, timedelta
from config_py import DB_USERS, DB_REDEEM, CONFIG

def load_db(db_path):
    """Load JSON database"""
    if os.path.exists(db_path):
        with open(db_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_db(db_path, data):
    """Save JSON database"""
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_users():
    """Load users from database"""
    db = load_db(DB_USERS)
    return db.get("users", {})

def save_users(users):
    """Save users to database"""
    db = load_db(DB_USERS)
    db["users"] = users
    save_db(DB_USERS, db)

def load_redeem_codes():
    """Load redeem codes from database"""
    return load_db(DB_REDEEM)

def save_redeem_codes(codes):
    """Save redeem codes to database"""
    save_db(DB_REDEEM, codes)

def get_user(user_id):
    """Get user data by ID"""
    users = load_users()
    return users.get(str(user_id), None)

def create_user(user_id, first_name, username, is_owner=False):
    """Create new user"""
    users = load_users()
    trial_expired = datetime.now() + timedelta(days=1)
    
    users[str(user_id)] = {
        "id": user_id,
        "username": username or "",
        "first_name": first_name or "User",
        "last_name": "",
        "role": "owner" if is_owner else "trial",
        "vip_expired": int(trial_expired.timestamp() * 1000) if not is_owner else 0,
        "status": "active",
        "total_operation": 0,
        "notified_expiry": False,
        "trial_start": int(datetime.now().timestamp() * 1000),
        "suspended": False
    }
    save_users(users)
    return users[str(user_id)]

def increment_operation(user_id):
    """Increment user's total operations"""
    users = load_users()
    if str(user_id) in users:
        users[str(user_id)]["total_operation"] = users[str(user_id)].get("total_operation", 0) + 1
        save_users(users)

def is_owner(user_id):
    """Check if user is owner"""
    return user_id in CONFIG["owner"]

def get_remaining_days(user_id):
    """Get remaining VIP/trial days"""
    user = get_user(user_id)
    if not user or not user.get("vip_expired"):
        return 0
    
    now = datetime.now().timestamp() * 1000
    if user["vip_expired"] <= now:
        return 0
    
    days = (user["vip_expired"] - now) / (1000 * 60 * 60 * 24)
    return max(0, int(days) + 1)

def get_expire_date(user_id):
    """Get VIP/trial expire date"""
    user = get_user(user_id)
    if not user or not user.get("vip_expired"):
        return "Tidak Aktif"
    
    expire = datetime.fromtimestamp(user["vip_expired"] / 1000)
    return expire.strftime("%d/%m/%Y")

def format_dashboard(user):
    """Format dashboard message"""
    remaining_days = get_remaining_days(user["id"])
    expire_date = get_expire_date(user["id"])
    
    dashboard = f"""🎌 *iqbal ᴄᴠ ʙᴏᴛꜱ*
(by iqbaldev)

╭─❖
│ こんにちは、私は Iqbalʙᴏᴛ です。
│ 私はファイル変換と管理を担当します。
│ ✦ Created by: @Iqbaldev
╰───────────────❖

╭─❖ ꜱᴛᴀᴛᴜꜱ ᴀᴋᴄᴇꜱ
│ ➤ Nama: *{user.get('first_name', 'User')}*
│ ➤ ID: `{user['id']}`
│ ➤ Username: @{user.get('username', '-')}
│ ➤ Role: *{user['role'].upper()}*
│ ➤ Status: *✅ Aktif*
│ ➤ Masa Aktif: *{expire_date}*
│ ➤ Hari Tersisa: *{remaining_days} hari*
│ ➤ Total Operasi: *{user.get('total_operation', 0)}*
╰───────────────❖

╭─❖ ꜰɪʟᴇ ꜰᴏʀᴍᴀᴛ ꜱᴜᴘᴘᴏʀᴛ
│ ➤ 📄 TXT 📇 VCF 📊 XLSX
│ ➤ 他の形式も順次対応予定です。
╰───────────────❖

╭─❖ ᴍᴇɴᴜ ʙᴏᴛ
│ ➤ ⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ
│ ➤ ⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ
│ ➤ ⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ
│ ➤ ⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ
│ ➤ ⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ
│ ➤ ⛓️ ꜱᴘʟɪᴛ ꜰɪʟᴇ
│ ➤ ⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ
│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ
│ ➤ ⛓️ ᴀᴍʙɪʟ ɴᴀᴍᴀ ꜰɪʟᴇ
│ ➤ ⛓️ ʙᴜᴀᴛ ɴᴀᴍᴀ
│ ➤ ⛓️ ᴀᴅᴍ & ɴᴀᴠʏ
│ ➤ ⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ
│ ➤ ⛓️ ʜɪᴛᴜɴɢ ꜰɪʟᴇ
╰───────────────❖

💎 ご利用ありがとうございます。
このボットは常に進化しています ⚙️"""
    
    return dashboard

def get_main_keyboard():
    """Get main keyboard buttons - Japanese aesthetic with small caps"""
    return {
        "keyboard": [
            [{"text": "⛓️ ꜱᴛᴀᴛᴜꜱ ⛓️"}],
            [{"text": "⛓️ ᴛxᴛ ᴛᴏ ᴠᴄꜰ ⛓️"}, {"text": "⛓️ ᴠᴄꜰ ᴛᴏ ᴛxᴛ ⛓️"}],
            [{"text": "⛓️ ʀᴀᴘɪᴋᴀɴ ᴛxᴛ ⛓️"}, {"text": "⛓️ ᴍꜱɢ ᴛᴏ ᴛxᴛ ⛓️"}],
            [{"text": "⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ ⛓️"}, {"text": "⛓️ ɢᴀʙᴜɴɢ ᴛxᴛ ⛓️"}],
            [{"text": "⛓️ xʟꜱ ᴛᴏ ᴠᴄꜰ ⛓️"}, {"text": "⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️"}],
            [{"text": "⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️"}, {"text": "⛓️ ʜɪᴛᴜɴɢ ᴋᴏɴᴛᴀᴋ ⛓️"}],
            [{"text": "⛓️ ᴄᴇᴋ ɴᴀᴍᴀ ᴋᴏɴᴛᴀᴋ ⛓️"}, {"text": "⛓️ ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ ⛓️"}],
            [{"text": "🎁 ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ ⛓️"}, {"text": "ᴍᴇɴᴜ ᴏᴡɴᴇʀ ⛓️"}]
        ],
        "resize_keyboard": True,
        "one_time_keyboard": False
    }
