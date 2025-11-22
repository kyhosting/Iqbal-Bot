"""Owner commands untuk Iqbal CV Bot"""
import string
import random
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from config_py import CONFIG
from helpers import load_redeem_codes, save_redeem_codes, load_users, save_users, is_owner

def generate_random_code(length=8):
    """Generate random redeem code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

async def owner_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show owner menu"""
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    
    if not is_owner(user_id):
        await update.message.reply_text(
            "❌ *Menu ini hanya untuk owner ya Kak* 😊",
            parse_mode="Markdown"
        )
        return
    
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("➕ Buat Kode", callback_data="owner_create_code"),
            InlineKeyboardButton("📋 Lihat Kode", callback_data="owner_list_codes")
        ],
        [
            InlineKeyboardButton("🗑️ Hapus Kode", callback_data="owner_delete_code"),
            InlineKeyboardButton("👥 Lihat User", callback_data="owner_list_users")
        ],
        [
            InlineKeyboardButton("🎁 Set VIP Manual", callback_data="owner_set_vip")
        ]
    ])
    
    await update.message.reply_text(
        "🛡️ *Panel Admin Aktif*\n\n"
        "Silakan pilih menu yang ingin digunakan ya Kak:",
        parse_mode="Markdown",
        reply_markup=keyboard
    )

async def owner_create_code(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Create new redeem code"""
    query = update.callback_query
    await query.answer()
    
    # Store in context for next step
    context.user_data['owner_action'] = 'create_code'
    
    await query.edit_message_text(
        "➕ *Buat Kode Redeem*\n\n"
        "Berapa hari durasi VIP?\n\n"
        "(Ketik angka, misal: 30)",
        parse_mode="Markdown"
    )

async def owner_list_codes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """List all redeem codes"""
    query = update.callback_query
    await query.answer()
    
    redeem_db = load_redeem_codes()
    
    if not redeem_db:
        await query.edit_message_text("📋 Tidak ada kode redeem")
        return
    
    text = "📋 *Daftar Kode Redeem*\n\n"
    for code, data in list(redeem_db.items())[:10]:
        status = "✅ Used" if data.get('used_by') else "⏳ Pending"
        duration = data.get('duration', 30)
        text += f"• `{code}` ({duration}d) - {status}\n"
    
    await query.edit_message_text(text, parse_mode="Markdown")

async def owner_list_users(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """List all users"""
    query = update.callback_query
    await query.answer()
    
    users = load_users()
    
    text = "👥 *Daftar User*\n\n"
    for uid, user in list(users.items())[:10]:
        role = user.get('role', 'user').upper()
        text += f"• {user.get('first_name', 'User')} (ID: {uid}) - {role}\n"
    
    text += f"\n📊 Total: {len(users)} user"
    
    await query.edit_message_text(text, parse_mode="Markdown")

async def owner_set_vip(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set VIP manually"""
    query = update.callback_query
    await query.answer()
    
    context.user_data['owner_action'] = 'set_vip'
    
    await query.edit_message_text(
        "🎁 *Set VIP Manual*\n\n"
        "Masukkan User ID dan durasi hari\n"
        "(Format: USER_ID HARI)\n\n"
        "Misal: 123456789 30",
        parse_mode="Markdown"
    )

async def handle_owner_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle owner inputs"""
    text = update.message.text.strip()
    user_id = update.effective_user.id
    
    if not is_owner(user_id):
        return
    
    action = context.user_data.get('owner_action')
    
    if action == 'create_code':
        try:
            duration = int(text)
            code = generate_random_code()
            
            redeem_db = load_redeem_codes()
            redeem_db[code] = {
                'duration': duration,
                'created_at': datetime.now().isoformat(),
                'expires_at': (datetime.now() + timedelta(days=30)).isoformat()
            }
            save_redeem_codes(redeem_db)
            
            await update.message.reply_text(
                f"✅ *Kode Redeem Berhasil Dibuat*\n\n"
                f"Kode: `{code}`\n"
                f"Durasi: {duration} hari\n\n"
                f"Bagikan kode ini ke user ya Kak!",
                parse_mode="Markdown"
            )
            context.user_data.pop('owner_action', None)
        except:
            await update.message.reply_text("❌ Format salah. Ketik angka saja!", parse_mode="Markdown")
    
    elif action == 'set_vip':
        try:
            parts = text.split()
            target_user_id = int(parts[0])
            duration = int(parts[1])
            
            users = load_users()
            if str(target_user_id) in users:
                db_user = users[str(target_user_id)]
                new_expiry = datetime.now() + timedelta(days=duration)
                
                db_user['role'] = 'vip'
                db_user['vip_expired'] = int(new_expiry.timestamp() * 1000)
                db_user['status'] = 'active'
                
                users[str(target_user_id)] = db_user
                save_users(users)
                
                await update.message.reply_text(
                    f"✅ *VIP Berhasil Diset*\n\n"
                    f"User ID: {target_user_id}\n"
                    f"Durasi: {duration} hari\n"
                    f"Berlaku hingga: {new_expiry.strftime('%d/%m/%Y')}",
                    parse_mode="Markdown"
                )
                context.user_data.pop('owner_action', None)
            else:
                await update.message.reply_text("❌ User tidak ditemukan", parse_mode="Markdown")
        except:
            await update.message.reply_text("❌ Format salah. Gunakan: USER_ID HARI", parse_mode="Markdown")
