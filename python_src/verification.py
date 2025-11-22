"""Group verification system untuk Iqbal CV Bot"""
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from config_py import CONFIG
from helpers import get_user, create_user, is_owner, save_users, load_users

async def check_group_membership(bot, user_id):
    """Check if user is member of both required groups"""
    groups = [CONFIG["groups"]["main"], CONFIG["groups"]["cv"]]
    
    try:
        for group in groups:
            chat_member = await bot.get_chat_member(f"@{group}", user_id)
            if chat_member.status not in ["member", "administrator", "creator"]:
                return False
        return True
    except:
        return False

async def verify_group_access(bot, user_id: int, chat_id: int, update: Update = None):
    """Verify group membership and send inline buttons if needed"""
    if is_owner(user_id):
        return True
    
    verified = await check_group_membership(bot, user_id)
    
    if not verified:
        # Send inline button for joining - NO GROUP LINKS, JUST CHECK BUTTON
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Cek Keanggotaan", callback_data="verify_again")
            ]
        ])
        
        await bot.send_message(
            chat_id=chat_id,
            text="⚠️ *Wajib join 2 grup untuk akses*\n\nSudah join kedua grup?\n`@agentviber12` dan `@channelviber`\n\nKlik tombol di bawah untuk verifikasi ulang!",
            parse_mode="Markdown",
            reply_markup=keyboard
        )
        return False
    
    return True

async def handle_verify_again(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle verify again callback"""
    query = update.callback_query
    user_id = query.from_user.id
    chat_id = query.message.chat.id
    message_id = query.message.message_id
    
    await query.answer()
    
    verified = await check_group_membership(context.bot, user_id)
    
    if not verified:
        await query.answer("⚠️ Masih belum join kedua grup!", show_alert=True)
        return
    
    # Delete old message
    try:
        await context.bot.delete_message(chat_id, message_id)
    except:
        pass
    
    await asyncio.sleep(0.3)
    
    # Get or create user
    db_user = get_user(user_id)
    if not db_user:
        from helpers import format_dashboard
        db_user = create_user(
            user_id,
            query.from_user.first_name,
            query.from_user.username,
            is_owner(user_id)
        )
        
        # Show dashboard - MARKDOWN ONLY
        dashboard = format_dashboard(db_user)
        
        try:
            photos = await context.bot.get_user_profile_photos(user_id, limit=1)
            if photos.total_count > 0:
                photo = photos.photos[0][0]
                await context.bot.send_photo(
                    chat_id=user_id,
                    photo=photo.file_id,
                    caption=dashboard,
                    parse_mode="Markdown"
                )
            else:
                await context.bot.send_message(
                    chat_id=user_id,
                    text=dashboard,
                    parse_mode="Markdown"
                )
        except:
            await context.bot.send_message(
                chat_id=user_id,
                text=dashboard,
                parse_mode="Markdown"
            )
