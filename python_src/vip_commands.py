"""Complete VIP Commands untuk Iqbal CV Bot - All 18 Features IMPLEMENTED"""
import os
import re
import asyncio
import pandas as pd
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import ContextTypes, ConversationHandler
from file_converters import (
    txt_to_vcf, vcf_to_txt, xls_to_vcf, clean_txt, 
    count_contacts_in_vcf, count_contacts_in_txt,
    split_vcf_unlimited, merge_vcf_files_unlimited,
    create_vcf_file_unlimited, extract_phone_numbers_unlimited,
    hapus_spasi_antar_nomor_unlimited, split_cut_vcf_unlimited,
    read_vcf_unlimited, write_vcf_unlimited, remove_numbers, remove_emojis
)
from helpers import get_user, increment_operation

# Global sessions
vip_sessions = {}
session_lanjutan = {"split_counter": 1, "file_counter": 1}

def get_session(user_id):
    if user_id not in vip_sessions:
        vip_sessions[user_id] = {}
    return vip_sessions[user_id]

# ========== STEP HANDLERS UNTUK CONVERSATION ==========
STEP_FILE = 1
STEP_NAME = 2
STEP_COUNT = 3
STEP_CONTINUE = 4

async def cancel_session(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel any operation"""
    user_id = update.effective_user.id
    if user_id in vip_sessions:
        del vip_sessions[user_id]
    await update.message.reply_text("❌ *Dibatalkan ya Kak* 😊", parse_mode="Markdown")
    return ConversationHandler.END

# ========== RAPIKAN TXT ==========
async def rapikan_txt_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start RAPIKAN TXT"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    session = get_session(user_id)
    session['command'] = 'rapikan_txt'
    session['step'] = 1
    
    await update.message.reply_text(
        "*🚧 RAPIKAN TXT*\n\n"
        "📤 Silakan kirim file TXT yang akan dirapihkan (hapus spasi & duplikat)\n\n"
        "Ketik `Batal` untuk membatalkan",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def rapikan_txt_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle RAPIKAN TXT file"""
    user_id = update.effective_user.id
    
    if update.message.text and update.message.text.lower() == 'batal':
        return await cancel_session(update, context)
    
    if not update.message.document:
        await update.message.reply_text("⚠️ Harus file ya Kak!")
        return STEP_FILE
    
    file_obj = update.message.document
    if not file_obj.file_name.endswith('.txt'):
        await update.message.reply_text("⚠️ Hanya file TXT!")
        return STEP_FILE
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        file = await context.bot.get_file(file_obj.file_id)
        file_path = f"/tmp/{file_obj.file_name}"
        await file.download_to_drive(file_path)
        
        # Process
        hapus_spasi_antar_nomor_unlimited(file_path)
        
        # Send result
        await update.message.reply_document(file_path)
        await update.message.reply_text(
            "✅ *Proses Selesai*\n\nFile TXT telah berhasil dirapihkan",
            parse_mode="Markdown"
        )
        
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
        await processing.delete()
        
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}", parse_mode="Markdown")
        return ConversationHandler.END

# ========== MSG TO TXT ==========
async def msg_txt_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start MSG TO TXT"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    session = get_session(user_id)
    session['command'] = 'msg_txt'
    
    await update.message.reply_text(
        "*📨 MSG to TXT*\n\n"
        "📝 Masukkan nomor telepon yang akan dikonversi ke file TXT",
        parse_mode="Markdown"
    )
    return STEP_NAME

async def msg_txt_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle MSG TO TXT input"""
    user_id = update.effective_user.id
    
    if update.message.text.lower() == 'batal':
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    session['numbers'] = update.message.text
    
    await update.message.reply_text("📄 Masukkan nama untuk file baru")
    return STEP_FILE

async def msg_txt_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle MSG TO TXT filename"""
    user_id = update.effective_user.id
    
    if update.message.text.lower() == 'batal':
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    try:
        file_name = f"{update.message.text}.txt"
        with open(file_name, 'w') as f:
            f.write(session.get('numbers', ''))
        
        await update.message.reply_document(file_name)
        await update.message.reply_text(
            "✅ *Konversi Berhasil*\n\nPesan telah berhasil dikonversi ke file TXT",
            parse_mode="Markdown"
        )
        
        if os.path.exists(file_name):
            os.remove(file_name)
        
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== TXT TO VCF ==========
async def txt_vcf_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start TXT TO VCF"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    session = get_session(user_id)
    session['command'] = 'txt_vcf'
    
    await update.message.reply_text(
        "*🏷️ TXT TO VCF*\n\n"
        "📤 Kirim file TXT yang akan dikonversi",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def txt_vcf_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle TXT TO VCF file"""
    user_id = update.effective_user.id
    
    if update.message.text and update.message.text.lower() == 'batal':
        return await cancel_session(update, context)
    
    if not update.message.document or not update.message.document.file_name.endswith('.txt'):
        await update.message.reply_text("⚠️ Hanya file TXT!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['input_file'] = file_path
    session['input_name'] = file_obj.file_name.replace('.txt', '')
    
    await update.message.reply_text(
        "📄 Masukkan nama untuk file baru\nKlik 'Skip' untuk menggunakan nama file asli",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_NAME

async def txt_vcf_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle TXT TO VCF name"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    new_name = session['input_name'] if update.message.text == "⭕️ Skip ⭕️" else update.message.text
    session['output_name'] = new_name
    
    await update.message.reply_text(
        "🏷️ Masukkan nama untuk kontak",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_COUNT

async def txt_vcf_contact_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle TXT TO VCF contact name"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    input_file = session['input_file']
    output_name = session['output_name']
    contact_name = session['output_name'] if update.message.text == "⭕️ Skip ⭕️" else update.message.text
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        # Read numbers dari TXT
        cont_all = []
        with open(input_file, 'r') as f:
            lines = f.read().split()
            for num in lines:
                num_clean = num.replace("+", "").strip()
                if num_clean.isnumeric():
                    cont_all.append(num_clean)
        
        if not cont_all:
            await update.message.reply_text("❌ *Data Tidak Ditemukan*\n\nTidak ada kontak yang dapat diproses", parse_mode="Markdown")
        else:
            # Create VCF
            vcf_file = f"{output_name}.vcf"
            create_vcf_file_unlimited(cont_all, contact_name, vcf_file, start_index=1)
            
            await update.message.reply_document(vcf_file)
            await update.message.reply_text(
                "✅ *Konversi Berhasil*\n\nFile TXT telah berhasil dikonversi ke VCF",
                parse_mode="Markdown"
            )
            
            if os.path.exists(vcf_file):
                os.remove(vcf_file)
        
        if os.path.exists(input_file):
            os.remove(input_file)
        
        await processing.delete()
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== XLS TO VCF ==========
async def xls_vcf_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start XLS TO VCF"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    session = get_session(user_id)
    session['command'] = 'xls_vcf'
    
    await update.message.reply_text(
        "*🚀 XLS to VCF*\n\n"
        "📤 Kirim file Excel (XLS/XLSX) yang akan dikonversi",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def xls_vcf_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle XLS TO VCF file"""
    user_id = update.effective_user.id
    
    if update.message.text and update.message.text.lower() == 'batal':
        return await cancel_session(update, context)
    
    if not update.message.document or not (update.message.document.file_name.endswith('.xls') or update.message.document.file_name.endswith('.xlsx')):
        await update.message.reply_text("⚠️ Hanya file XLS/XLSX!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['input_file'] = file_path
    session['input_name'] = file_obj.file_name.replace('.xlsx', '').replace('.xls', '')
    
    await update.message.reply_text(
        "📄 Masukkan nama untuk file baru\nKlik 'Skip' untuk menggunakan nama file asli",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_NAME

async def xls_vcf_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle XLS TO VCF name"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    new_name = session['input_name'] if update.message.text == "⭕️ Skip ⭕️" else update.message.text
    session['output_name'] = new_name
    
    await update.message.reply_text(
        "🏷️ Masukkan nama untuk kontak",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_COUNT

async def xls_vcf_contact_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle XLS TO VCF contact name"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    input_file = session['input_file']
    output_name = session['output_name']
    contact_name = session['output_name'] if update.message.text == "⭕️ Skip ⭕️" else update.message.text
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        cont_all = []
        df = pd.read_excel(input_file)
        ls_cont = df.values.flatten().tolist()
        for num in ls_cont:
            num_str = str(num).replace("+", "")
            if num_str.isnumeric():
                cont_all.append(num_str)
        
        if not cont_all:
            await update.message.reply_text("❌ *Data Tidak Ditemukan*", parse_mode="Markdown")
        else:
            vcf_file = f"{output_name}.vcf"
            create_vcf_file_unlimited(cont_all, contact_name, vcf_file, start_index=1)
            
            await update.message.reply_document(vcf_file)
            await update.message.reply_text(
                "✅ *Konversi Berhasil*\n\nFile Excel telah berhasil dikonversi ke VCF",
                parse_mode="Markdown"
            )
            
            if os.path.exists(vcf_file):
                os.remove(vcf_file)
        
        if os.path.exists(input_file):
            os.remove(input_file)
        
        await processing.delete()
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== VCF TO TXT ==========
async def vcf_txt_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start VCF TO TXT"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    await update.message.reply_text(
        "*♻️ VCF TO TXT*\n\n"
        "📤 Kirim file VCF yang akan dikonversi",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def vcf_txt_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle VCF TO TXT file"""
    user_id = update.effective_user.id
    
    if update.message.text and update.message.text.lower() == 'batal':
        return await cancel_session(update, context)
    
    if not update.message.document or not update.message.document.file_name.endswith('.vcf'):
        await update.message.reply_text("⚠️ Hanya file VCF!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['input_file'] = file_path
    session['input_name'] = file_obj.file_name.replace('.vcf', '')
    
    await update.message.reply_text(
        "📄 Masukkan nama untuk file baru\nKlik 'Skip' untuk menggunakan nama file asli",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_NAME

async def vcf_txt_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle VCF TO TXT name"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    input_file = session['input_file']
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        if update.message.text == "⭕️ Skip ⭕️":
            output_file = f"{session['input_name']}.txt"
        else:
            output_file = f"{update.message.text}.txt"
        
        extract_phone_numbers_unlimited(input_file, output_file)
        
        await update.message.reply_document(output_file)
        await update.message.reply_text(
            "✅ *Konversi Berhasil*\n\nFile VCF telah berhasil dikonversi ke TXT",
            parse_mode="Markdown"
        )
        
        if os.path.exists(output_file):
            os.remove(output_file)
        if os.path.exists(input_file):
            os.remove(input_file)
        
        await processing.delete()
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== BAGI VCF ==========
async def bagi_vcf_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start BAGI VCF"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    await update.message.reply_text(
        "*🪓 BAGI VCF*\n\n"
        "📤 Kirim file VCF yang akan dibagi",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def bagi_vcf_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle BAGI VCF file"""
    user_id = update.effective_user.id
    
    if not update.message.document or not update.message.document.file_name.endswith('.vcf'):
        await update.message.reply_text("⚠️ Hanya file VCF!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['input_file'] = file_path
    session['input_name'] = file_obj.file_name.replace('.vcf', '')
    
    await update.message.reply_text(
        "📄 Masukkan nama untuk file baru\nKlik 'Skip' untuk menggunakan nama file asli",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_NAME

async def bagi_vcf_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle BAGI VCF name"""
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(update.effective_user.id)
    session['output_name'] = session['input_name'] if update.message.text == "⭕️ Skip ⭕️" else update.message.text
    
    await update.message.reply_text(
        "🔢 Masukkan jumlah bagian file yang diinginkan",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_COUNT

async def bagi_vcf_count(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle BAGI VCF count"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    if not update.message.text.isnumeric() or update.message.text == "0":
        await update.message.reply_text("⚠️ Harus angka yang valid!")
        return STEP_COUNT
    
    session = get_session(user_id)
    input_file = session['input_file']
    output_name = session['output_name']
    num_parts = int(update.message.text)
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        result_files = split_cut_vcf_unlimited(input_file, output_name, num_parts)
        
        for file_path in result_files:
            if os.path.exists(file_path):
                await update.message.reply_document(file_path)
                os.remove(file_path)
        
        await update.message.reply_text(
            "✅ *Proses Selesai*\n\nFile VCF telah berhasil dibagi",
            parse_mode="Markdown"
        )
        
        if os.path.exists(input_file):
            os.remove(input_file)
        
        await processing.delete()
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== HITUNG KONTAK ==========
async def hitung_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start HITUNG KONTAK"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    await update.message.reply_text(
        "*🔢 HITUNG KONTAK*\n\n"
        "📤 Kirim file VCF atau TXT untuk dihitung jumlah kontaknya",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def hitung_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle HITUNG KONTAK file"""
    user_id = update.effective_user.id
    
    if not update.message.document:
        await update.message.reply_text("⚠️ Harus file ya Kak!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    try:
        if file_obj.file_name.endswith('.vcf'):
            total = count_contacts_in_vcf(file_path)
            jenis = "VCF"
        elif file_obj.file_name.endswith('.txt'):
            total = count_contacts_in_txt(file_path)
            jenis = "TXT"
        else:
            await update.message.reply_text("❌ Format File Tidak Valid\n\nHanya file VCF atau TXT yang didukung")
            return ConversationHandler.END
        
        await update.message.reply_text(
            f"📊 *Total Kontak*\n\nFile `{jenis}` berisi `{total}` kontak",
            parse_mode="Markdown"
        )
        
        if os.path.exists(file_path):
            os.remove(file_path)
        
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== CEK NAMA KONTAK ==========
async def cek_nama_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start CEK NAMA KONTAK"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    await update.message.reply_text(
        "*🔍 CEK NAMA KONTAK*\n\n"
        "📤 Kirim file VCF untuk dicek nama kontaknya",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def cek_nama_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle CEK NAMA KONTAK file"""
    user_id = update.effective_user.id
    
    if not update.message.document or not update.message.document.file_name.endswith('.vcf'):
        await update.message.reply_text("⚠️ Hanya file VCF!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    try:
        kontak = read_vcf_unlimited(file_path)
        daftar_nama = []
        
        for c in kontak:
            if isinstance(c, str):
                match = re.search(r'FN:(.+?)(?:\n|$)', c)
                if match:
                    daftar_nama.append(match.group(1).strip())
        
        if not daftar_nama:
            await update.message.reply_text("❌ *Data Tidak Ditemukan*\n\nTidak ada nama kontak dalam file ini", parse_mode="Markdown")
        else:
            hasil = "*📋 Daftar Nama Kontak*\n\n"
            for i, nama in enumerate(daftar_nama[:100], 1):
                hasil += f"`{i}.` {nama}\n"
            
            await update.message.reply_text(hasil, parse_mode="Markdown")
        
        if os.path.exists(file_path):
            os.remove(file_path)
        
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== STATUS ==========
async def status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show user status"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    
    if not db_user:
        await update.message.reply_text("❌ *User belum terdaftar*", parse_mode="Markdown")
        return
    
    nama = update.effective_user.first_name or "User"
    username = f"@{update.effective_user.username}" if update.effective_user.username else "-"
    
    status_msg = (
        f"*💎 STATUS AKUN*\n\n"
        f"*🆔 ID:* `{user_id}`\n"
        f"*👤 Nama:* `{nama}`\n"
        f"*📱 Username:* `{username}`\n"
        f"*👑 Role:* `{db_user.get('role', 'user').upper()}`\n"
        f"*✅ Status:* `AKTIF`\n"
        f"*📊 Total Operasi:* `{db_user.get('total_operation', 0)}`"
    )
    
    await update.message.reply_text(status_msg, parse_mode="Markdown")

# ========== ADMIN ==========
async def admin_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start ADMIN"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    await update.message.reply_text(
        "*📨 ADMIN*\n\n"
        "📝 Masukkan nomor admin (pisahkan dengan spasi)",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def admin_numbers(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle ADMIN numbers"""
    user_id = update.effective_user.id
    
    if update.message.text.lower() == 'batal':
        return await cancel_session(update, context)
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        numbers = update.message.text.split()
        file_name = 'ADMIN.vcf'
        
        with open(file_name, "w") as f:
            for index, phone in enumerate(numbers, start=1):
                vcf_entry = f"""BEGIN:VCARD
VERSION:3.0
FN:ADMIN-{str(index).zfill(4)}
TEL;TYPE=CELL:{phone}
END:VCARD
"""
                f.write(vcf_entry + "\n")
        
        await update.message.reply_document(file_name)
        await update.message.reply_text(
            "✅ *File ADMIN Berhasil Dibuat*\n\nFile kontak ADMIN telah siap digunakan",
            parse_mode="Markdown"
        )
        
        if os.path.exists(file_name):
            os.remove(file_name)
        
        await processing.delete()
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== GABUNG VCF ==========
async def gabung_vcf_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start GABUNG VCF"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    session = get_session(user_id)
    session['files'] = []
    
    await update.message.reply_text(
        "*🗄️ GABUNG VCF*\n\n"
        "📤 Kirim file VCF pertama",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def gabung_vcf_files(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle GABUNG VCF files"""
    user_id = update.effective_user.id
    
    if not update.message.document or not update.message.document.file_name.endswith('.vcf'):
        await update.message.reply_text("⚠️ Hanya file VCF!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['files'].append(file_path)
    
    await update.message.reply_text(
        f"✅ File diterima ({len(session['files'])} file)\n\n"
        "📤 Kirim file VCF berikutnya atau ketik 'Selesai' untuk melanjutkan",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("✅ Selesai"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_CONTINUE

async def gabung_vcf_continue(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle GABUNG VCF continue"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    if update.message.text == "✅ Selesai":
        session = get_session(user_id)
        
        if len(session.get('files', [])) < 2:
            await update.message.reply_text("❌ Minimal 2 file VCF untuk digabung")
            return STEP_CONTINUE
        
        await update.message.reply_text("📄 Masukkan nama untuk file gabungan")
        return STEP_NAME
    
    # File tambahan
    if not update.message.document or not update.message.document.file_name.endswith('.vcf'):
        await update.message.reply_text("⚠️ Hanya file VCF!")
        return STEP_CONTINUE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['files'].append(file_path)
    
    await update.message.reply_text(
        f"✅ File diterima ({len(session['files'])} file)\n\n"
        "📤 Kirim file VCF berikutnya atau ketik 'Selesai' untuk melanjutkan",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("✅ Selesai"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_CONTINUE

async def gabung_vcf_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle GABUNG VCF name"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        output_file = f"{update.message.text}.vcf"
        merge_vcf_files_unlimited(session['files'], update.message.text)
        
        await update.message.reply_document(output_file)
        await update.message.reply_text(
            f"✅ *Penggabungan Berhasil*\n\n*📊 Statistik:*\n• *File digabung:* `{len(session['files'])}`\n• *Format:* `VCF`",
            parse_mode="Markdown"
        )
        
        # Cleanup
        for f in session['files']:
            if os.path.exists(f):
                os.remove(f)
        if os.path.exists(output_file):
            os.remove(output_file)
        
        await processing.delete()
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== GABUNG TXT ==========
async def gabung_txt_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start GABUNG TXT"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    session = get_session(user_id)
    session['files'] = []
    
    await update.message.reply_text(
        "*🗄️ GABUNG TXT*\n\n"
        "📤 Kirim file TXT pertama",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def gabung_txt_files(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle GABUNG TXT files"""
    user_id = update.effective_user.id
    
    if not update.message.document or not update.message.document.file_name.endswith('.txt'):
        await update.message.reply_text("⚠️ Hanya file TXT!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['files'].append(file_path)
    
    await update.message.reply_text(
        f"✅ File diterima ({len(session['files'])} file)\n\n"
        "📤 Kirim file TXT berikutnya atau ketik 'Selesai' untuk melanjutkan",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("✅ Selesai"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_CONTINUE

async def gabung_txt_continue(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle GABUNG TXT continue"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    if update.message.text == "✅ Selesai":
        session = get_session(user_id)
        
        if len(session.get('files', [])) < 2:
            await update.message.reply_text("❌ Minimal 2 file TXT untuk digabung")
            return STEP_CONTINUE
        
        await update.message.reply_text("📄 Masukkan nama untuk file gabungan")
        return STEP_NAME
    
    # File tambahan
    if not update.message.document or not update.message.document.file_name.endswith('.txt'):
        await update.message.reply_text("⚠️ Hanya file TXT!")
        return STEP_CONTINUE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['files'].append(file_path)
    
    await update.message.reply_text(
        f"✅ File diterima ({len(session['files'])} file)\n\n"
        "📤 Kirim file TXT berikutnya atau ketik 'Selesai' untuk melanjutkan",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("✅ Selesai"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_CONTINUE

async def gabung_txt_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle GABUNG TXT name"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(user_id)
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        output_file = f"{update.message.text}.txt"
        all_numbers = set()
        
        for file_path in session['files']:
            with open(file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        all_numbers.add(line)
        
        with open(output_file, 'w') as f:
            for number in sorted(all_numbers):
                f.write(number + '\n')
        
        await update.message.reply_document(output_file)
        await update.message.reply_text(
            f"✅ *Penggabungan Berhasil*\n\n*📊 Statistik:*\n• *File digabung:* `{len(session['files'])}`\n• *Format:* `TXT`",
            parse_mode="Markdown"
        )
        
        # Cleanup
        for f in session['files']:
            if os.path.exists(f):
                os.remove(f)
        if os.path.exists(output_file):
            os.remove(output_file)
        
        await processing.delete()
        increment_operation(user_id)
        return ConversationHandler.END
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

# ========== POTONG VCF ==========
async def potong_vcf_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start POTONG VCF"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*", parse_mode="Markdown")
        return ConversationHandler.END
    
    session = get_session(user_id)
    session['split_counter'] = 1
    session['file_counter'] = 1
    
    await update.message.reply_text(
        "*📊 POTONG VCF*\n\n"
        "📤 Kirim file VCF yang akan dipotong",
        parse_mode="Markdown"
    )
    return STEP_FILE

async def potong_vcf_file(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle POTONG VCF file"""
    user_id = update.effective_user.id
    
    if not update.message.document or not update.message.document.file_name.endswith('.vcf'):
        await update.message.reply_text("⚠️ Hanya file VCF!")
        return STEP_FILE
    
    file_obj = update.message.document
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_obj.file_name}"
    await file.download_to_drive(file_path)
    
    session = get_session(user_id)
    session['input_file'] = file_path
    session['input_name'] = file_obj.file_name.replace('.vcf', '')
    
    await update.message.reply_text(
        "📎 Masukkan nama file output (tanpa ekstensi)",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("⭕️ Skip ⭕️"), KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_NAME

async def potong_vcf_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle POTONG VCF name"""
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    session = get_session(update.effective_user.id)
    session['output_name'] = session['input_name'] if update.message.text == "⭕️ Skip ⭕️" else update.message.text
    
    await update.message.reply_text(
        "🔢 Masukkan jumlah kontak per file",
        reply_markup=ReplyKeyboardMarkup([[KeyboardButton("❌ Batal ❌")]], resize_keyboard=True)
    )
    return STEP_COUNT

async def potong_vcf_count(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle POTONG VCF count"""
    user_id = update.effective_user.id
    
    if update.message.text == "❌ Batal ❌":
        return await cancel_session(update, context)
    
    if not update.message.text.isnumeric() or int(update.message.text) <= 0:
        await update.message.reply_text("⚠️ Harus angka yang valid!")
        return STEP_COUNT
    
    session = get_session(user_id)
    input_file = session['input_file']
    output_name = session['output_name']
    kontak_per_file = int(update.message.text)
    
    try:
        processing = await update.message.reply_text("🔄 *Memproses...*", parse_mode="Markdown")
        
        # Split logic dengan renaming
        contacts_list = read_vcf_unlimited(input_file)
        total_contacts = len(contacts_list)
        file_count = (total_contacts + kontak_per_file - 1) // kontak_per_file
        
        dump_ = []
        global_index = session['split_counter']
        
        for i in range(file_count):
            start = i * kontak_per_file
            end = min(start + kontak_per_file, total_contacts)
            
            # Rename contacts
            chunk = contacts_list[start:end]
            for j, c in enumerate(chunk):
                lines = c.split('\n')
                for idx, line in enumerate(lines):
                    if line.startswith('FN:'):
                        clean_name = remove_emojis(line[3:])
                        lines[idx] = f'FN:{clean_name.strip()} {str(global_index + j).zfill(4)}'
                chunk[j] = '\n'.join(lines)
            
            filename = f"{output_name}-{session['file_counter']}.vcf"
            write_vcf_unlimited(chunk, filename)
            dump_.append(filename)
            
            global_index += len(chunk)
            session['file_counter'] += 1
        
        for f in dump_:
            if os.path.exists(f):
                await update.message.reply_document(f)
                os.remove(f)
        
        await update.message.reply_text(
            f"✅ *Pemotongan Selesai*\n\nTerkirim hingga kontak `{global_index - 1:04d}`\\.\nLanjutkan dengan file berikutnya?",
            parse_mode="Markdown",
            reply_markup=ReplyKeyboardMarkup([[KeyboardButton("➕ Lanjut"), KeyboardButton("✅ Selesai")]], resize_keyboard=True)
        )
        
        session['split_counter'] = global_index
        
        if os.path.exists(input_file):
            os.remove(input_file)
        
        await processing.delete()
        increment_operation(user_id)
        
        return STEP_CONTINUE
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        return ConversationHandler.END

async def potong_vcf_continue(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle POTONG VCF continue"""
    if update.message.text == "➕ Lanjut":
        await update.message.reply_text(
            "*📊 POTONG VCF*\n\n"
            "📤 Kirim file VCF berikutnya",
            parse_mode="Markdown"
        )
        return STEP_FILE
    else:
        await update.message.reply_text("✅ *Semua Proses Telah Selesai*", parse_mode="Markdown")
        return ConversationHandler.END
