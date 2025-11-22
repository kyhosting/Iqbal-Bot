"""User Commands - /start, /me, /bantuan, /fitur, /cekid"""
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ContextTypes
from helpers import get_user, format_dashboard, get_remaining_days, get_expire_date

async def cmd_me(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show user status"""
    user_id = update.effective_user.id
    user = get_user(user_id)
    if not user:
        await update.message.reply_text("User tidak ditemukan")
        return
    
    status_msg = f"""🎌 *STATUS KAM*

👤 Nama: *{user.get('first_name', 'User')}*
🆔 ID: `{user['id']}`
📱 Username: @{user.get('username', '-')}
🎯 Role: *{user['role'].upper()}*
📅 Expire: *{get_expire_date(user_id)}*
⏳ Tersisa: *{get_remaining_days(user_id)} hari*
📊 Operasi: *{user.get('total_operation', 0)}*"""
    
    await update.message.reply_text(status_msg, parse_mode="Markdown")

async def cmd_bantuan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help"""
    help_msg = """🆘 *BANTUAN*

Bot konversi & management file contact.

📋 *Fitur Utama:*
• TXT ↔ VCF conversion
• XLS to VCF
• Merge files
• Extract numbers
• Rename files/contacts
• Count contacts
• Check contact names
• Create admin VCF

🎯 *Cara Pakai:*
1. Ketik /start
2. Pilih fitur
3. Upload file
4. Dapatkan hasil

📞 *Hubungi: @Iqbaldev*"""
    
    await update.message.reply_text(help_msg, parse_mode="Markdown")

async def cmd_fitur(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show features"""
    features = """✨ *FITUR BOT*

🔧 *Konversi:*
• TXT → VCF
• VCF → TXT  
• XLS → VCF
• MSG → TXT

📁 *File Management:*
• Gabung File (VCF/TXT/XLS)
• Extract Numbers
• Clean TXT

✏️ *Utilities:*
• Rename File
• Rename Contacts
• Count Contacts
• Check Contact Names
• Create Admin VCF

🎁 *VIP Features:*
Semua fitur di atas!

💎 *Redeem:*
Gunakan kode untuk akses VIP"""
    
    await update.message.reply_text(features, parse_mode="Markdown")

async def cmd_cekid(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check user ID - COMMAND ONLY"""
    user = update.effective_user
    chat = update.effective_chat
    
    msg = f"""🆔 *CEK ID TELEGRAM*

{'─' * 35}

👤 *DATA TELEGRAM KAM:*
├─ User ID: `{user.id}`
├─ Nama: *{user.first_name}{ ' ' + user.last_name if user.last_name else ''}*
├─ Username: {('@' + user.username) if user.username else '-'}
└─ Chat ID: `{chat.id}`

{'─' * 35}

💡 Gunakan ID ini untuk setting dengan owner!"""
    
    await update.message.reply_text(msg, parse_mode="Markdown")

async def cmd_viplist(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show VIP pricing"""
    vip_msg = """💎 *PAKET VIP*

┌─ 7 HARI - 15K
├─ Akses semua fitur
├─ Unlimited operasi
└─ Support 24/7

┌─ 30 HARI - 50K
├─ Akses semua fitur
├─ Unlimited operasi
├─ Priority support
└─ Referral bonus

┌─ 90 HARI - 120K
├─ Akses semua fitur
├─ Unlimited operasi
├─ Priority support
└─ Custom features

┌─ 365 HARI - 300K
├─ Seumur hidup access
├─ Unlimited operasi
├─ VIP badge
└─ Free updates

💬 Hubungi @Iqbaldev untuk membership!"""
    
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("7 Hari - 15K", callback_data="vip_7"),
            InlineKeyboardButton("30 Hari - 50K", callback_data="vip_30")
        ],
        [
            InlineKeyboardButton("90 Hari - 120K", callback_data="vip_90"),
            InlineKeyboardButton("365 Hari - 300K", callback_data="vip_365")
        ],
        [InlineKeyboardButton("Hubungi Owner", url="https://t.me/Iqbaldev")]
    ])
    
    await update.message.reply_text(vip_msg, parse_mode="Markdown", reply_markup=keyboard)

async def cmd_clear(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Clear chat session"""
    clear_msg = """🧹 *CLEAR CHAT*

Apakah kamu ingin membersihkan chat history dengan bot?

⚠️ *Catatan:*
Ini hanya mengosongkan session lokal, bukan history Telegram."""
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🗑️ Bersihkan", callback_data="clear_confirm")],
        [InlineKeyboardButton("❌ Batal", callback_data="clear_cancel")]
    ])
    
    await update.message.reply_text(clear_msg, parse_mode="Markdown", reply_markup=keyboard)
