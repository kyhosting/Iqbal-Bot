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
        # Send inline button for joining
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Join Grup 1", url=f"https://t.me/{CONFIG['groups']['main']}"),
                InlineKeyboardButton("✅ Join Grup 2", url=f"https://t.me/{CONFIG['groups']['cv']}")
            ],
            [
                InlineKeyboardButton("✅ Sudah Join", callback_data="verify_again")
            ]
        ])
        
        await bot.send_message(
            chat_id=chat_id,
            text="⚠️ *Wajib join 2 grup untuk akses*\n\nSilakan join kedua grup, kemudian klik 'Sudah Join'",
            parse_mode="Markdown",
            reply_markup=keyboard
        )
        return False
    
    return True

async def handle_verify_again(bot, update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle verify again callback"""
    query = update.callback_query
    user_id = query.from_user.id
    chat_id = query.message.chat.id
    message_id = query.message.message_id
    
    await query.answer()
    
    verified = await check_group_membership(bot, user_id)
    
    if not verified:
        await query.answer("⚠️ Masih belum join kedua grup!", show_alert=True)
        return
    
    # Delete old message
    try:
        await bot.delete_message(chat_id, message_id)
    except:
        pass
    
    await asyncio.sleep(0.3)
    
    # Get or create user
    db_user = get_user(user_id)
    if not db_user:
        from helpers import format_dashboard, get_main_keyboard
        db_user = create_user(
            user_id,
            query.from_user.first_name,
            query.from_user.username,
            is_owner(user_id)
        )
        
        # Show dashboard
        dashboard = format_dashboard(db_user)
        keyboard = get_main_keyboard()
        
        try:
            photos = await bot.get_user_profile_photos(user_id, limit=1)
            if photos.total_count > 0:
                photo = photos.photos[0][0]
                await bot.send_photo(
                    chat_id=user_id,
                    photo=photo.file_id,
                    caption=dashboard,
                    parse_mode="Markdown",
                    reply_markup=keyboard
                )
            else:
                await bot.send_message(
                    chat_id=user_id,
                    text=dashboard,
                    parse_mode="Markdown",
                    reply_markup=keyboard
                )
        except:
            await bot.send_message(
                chat_id=user_id,
                text=dashboard,
                parse_mode="Markdown",
                reply_markup=keyboard
            )
