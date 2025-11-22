"""Redeem Code System - MARKDOWN ONLY"""
from datetime import datetime, timedelta
from telegram import Update
from telegram.ext import ContextTypes, ConversationHandler
from helpers import load_redeem_codes, save_redeem_codes, load_users, save_users, get_user, increment_operation
from config_py import CONFIG

REDEEM_INPUT = 1

async def redeem_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start redeem process"""
    user_id = update.effective_user.id
    
    await update.message.reply_text(
        "🎁 *REDEEM CODE*\n\n"
        "Masukkan kode redeem kamu!\n\n"
        "_Ketik `batal` untuk membatalkan_",
        parse_mode="Markdown"
    )
    return REDEEM_INPUT

async def redeem_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle redeem code input"""
    user_id = update.effective_user.id
    code = update.message.text.strip().upper()
    
    if code.lower() == 'batal':
        await update.message.reply_text("❌ *Dibatalkan* 😊", parse_mode="Markdown")
        return ConversationHandler.END
    
    # Load redeem codes
    redeem_db = load_redeem_codes()
    
    if code not in redeem_db:
        await update.message.reply_text("❌ *Kode tidak ditemukan!* 😞", parse_mode="Markdown")
        return REDEEM_INPUT
    
    redeem = redeem_db[code]
    
    # Check if already used
    if redeem.get('used_by'):
        await update.message.reply_text("❌ *Kode sudah dipakai!* 🔒", parse_mode="Markdown")
        return REDEEM_INPUT
    
    # Check if expired
    if redeem.get('expires_at'):
        exp_date = datetime.fromisoformat(redeem['expires_at'])
        if datetime.now() > exp_date:
            await update.message.reply_text("❌ *Kode sudah expired!* ⏰", parse_mode="Markdown")
            return REDEEM_INPUT
    
    # Apply redeem
    users = load_users()
    user_data = users.get(str(user_id), {})
    
    duration = redeem.get('duration', 30)
    new_expiry = datetime.now() + timedelta(days=duration)
    
    user_data['role'] = 'vip'
    user_data['vip_expired'] = int(new_expiry.timestamp() * 1000)
    user_data['status'] = 'active'
    
    users[str(user_id)] = user_data
    save_users(users)
    
    # Mark code as used
    redeem['used_by'] = user_id
    redeem['used_at'] = datetime.now().isoformat()
    redeem_db[code] = redeem
    save_redeem_codes(redeem_db)
    
    await update.message.reply_text(
        f"✅ *Berhasil!*\n\n"
        f"🎁 Kode: `{code}`\n"
        f"⏳ Durasi: {duration} hari\n"
        f"📅 Berlaku hingga: {new_expiry.strftime('%d/%m/%Y')}\n\n"
        f"💎 Selamat menikmati VIP kak! 🎉",
        parse_mode="Markdown"
    )
    
    increment_operation(user_id)
    return ConversationHandler.END
