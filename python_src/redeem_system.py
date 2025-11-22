"""Redeem code system untuk Iqbal CV Bot"""
from datetime import datetime, timedelta
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from helpers import load_redeem_codes, save_redeem_codes, get_user, load_users, save_users

REDEEM_INPUT = 1

async def redeem_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start redeem code process"""
    await update.message.reply_text(
        "🎁 *Redeem Code System*\n\n"
        "Silakan masukkan kode redeem kamu ya Kak ✨\n\n"
        "Ketik `batal` untuk membatalkan.",
        parse_mode="Markdown"
    )
    return REDEEM_INPUT

async def redeem_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle redeem code input"""
    text = update.message.text.strip()
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    
    if text.lower() == 'batal':
        await update.message.reply_text(
            "❌ Proses dibatalkan ya Kak 😊",
            parse_mode="Markdown"
        )
        return ConversationHandler.END
    
    code = text.upper()
    redeem_db = load_redeem_codes()
    
    if code not in redeem_db:
        await update.message.reply_text(
            f"❌ *Yah… kode redeem tidak valid*\n\n"
            f"Kode `{code}` tidak ditemukan Kak.\n"
            f"Coba cek lagi ya 🙏",
            parse_mode="Markdown"
        )
        return ConversationHandler.END
    
    redeem_data = redeem_db[code]
    
    # Check if already used
    if redeem_data.get('used_by'):
        await update.message.reply_text(
            f"❌ *Yah… kode sudah digunakan*\n\n"
            f"Kode ini sudah dipakai sama user lain Kak 😔\n"
            f"Coba minta kode baru ya!",
            parse_mode="Markdown"
        )
        return ConversationHandler.END
    
    # Check expiry
    if redeem_data.get('expires_at'):
        exp_date = datetime.fromisoformat(redeem_data['expires_at'])
        if datetime.now() > exp_date:
            await update.message.reply_text(
                f"❌ *Yah… kode sudah kadaluarsa*\n\n"
                f"Kode ini sudah expired sejak {exp_date.strftime('%d/%m/%Y')} 😔",
                parse_mode="Markdown"
            )
            return ConversationHandler.END
    
    # Apply VIP
    users = load_users()
    db_user = users.get(str(user_id))
    
    if not db_user:
        await update.message.reply_text("❌ Silakan /start dulu!", parse_mode="Markdown")
        return ConversationHandler.END
    
    vip_duration_days = redeem_data.get('duration', 30)
    new_expiry = datetime.now() + timedelta(days=vip_duration_days)
    
    db_user['role'] = 'vip'
    db_user['vip_expired'] = int(new_expiry.timestamp() * 1000)
    db_user['status'] = 'active'
    db_user['suspended'] = False
    
    users[str(user_id)] = db_user
    save_users(users)
    
    # Mark code as used
    redeem_data['used_by'] = user_id
    redeem_data['used_at'] = datetime.now().isoformat()
    redeem_db[code] = redeem_data
    save_redeem_codes(redeem_db)
    
    await update.message.reply_text(
        f"✅ *Kode redeem berhasil!*\n\n"
        f"💎 VIP Status Aktif!\n"
        f"⏰ Berlaku hingga: {new_expiry.strftime('%d/%m/%Y')}\n"
        f"🎉 Akses semua fitur premium sudah bisa digunakan!\n\n"
        f"Semoga membantu ya Kak! 😊",
        parse_mode="Markdown"
    )
    return ConversationHandler.END

async def redeem_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel redeem process"""
    await update.message.reply_text("❌ Proses dibatalkan ya Kak 😊", parse_mode="Markdown")
    return ConversationHandler.END
