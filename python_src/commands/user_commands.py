"""User commands untuk Iqbal CV Bot"""
from telegram import Update
from telegram.ext import ContextTypes
from helpers import get_user, create_user, is_owner, format_dashboard, get_main_keyboard

async def cmd_me(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show user profile"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    
    if not db_user:
        db_user = create_user(user_id, update.effective_user.first_name, update.effective_user.username)
    
    text = f"""👤 *Profil Kamu*

📱 Nama: {db_user.get('first_name', 'User')}
🆔 ID: `{user_id}`
👤 Username: @{db_user.get('username', '-')}
🎖️ Role: *{db_user['role'].upper()}*
✅ Status: *{db_user['status']}*

Semoga membantu! 😊"""
    
    await update.message.reply_text(text, parse_mode="Markdown")

async def cmd_bantuan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help"""
    text = """🎌 *Bantuan - Iqbal CV Bot*

✨ *FITUR VIP CONVERSION:*
⛓️ ᴛxᴛ ↔ ᴠᴄꜰ - Convert kontak
⛓️ xʟꜱ → ᴠᴄꜰ - Excel ke VCF
⛓️ ᴍꜱɢ → ᴛxᴛ - Ekstrak nomor

📦 *FITUR FILE MANAGEMENT:*
⛓️ ꜱᴘʟɪᴛ - Potong VCF
⛓️ ɢᴀʙᴜɴɢ - Merge files
⛓️ ʀᴀᴘɪᴋᴀɴ - Clean & sort

✨ *UTILITIES:*
⛓️ ʀᴇɴᴀᴍᴇ - Rename files/kontak
⛓️ ʜɪᴛᴜɴɢ - Count contacts
⛓️ ᴄᴇᴋ ᴋᴏɴᴛᴀᴋ - Check details

🎁 *CARA PAKAI:*
1. /start - Dashboard
2. /me - Profil kamu
3. /fitur - Daftar fitur
4. Click tombol untuk mulai!

❓ *Masalah?*
Hub @Iqbaldev 🎌"""
    
    await update.message.reply_text(text, parse_mode="Markdown")

async def cmd_fitur(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show features list"""
    text = """📋 *Daftar Fitur Lengkap*

⛓️ **Conversion**
├─ TXT ↔ VCF
├─ XLS → VCF
└─ MSG → TXT

⛓️ **File Management**
├─ Split VCF
├─ Merge Files (TXT/VCF)
└─ Clean & Rapikan

⛓️ **Utilities**  
├─ Rename Kontak
├─ Rename File
├─ Count Kontak
└─ Check Detail

💎 *Semua fitur butuh VIP/Trial!*
Dapatkan 1 hari trial gratis setelah verifikasi grup! 🎁"""
    
    await update.message.reply_text(text, parse_mode="Markdown")
