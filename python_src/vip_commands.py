"""VIP Commands Handler - FIXED & COMPLETE"""
import os
import re
import asyncio
import pandas as pd
from telegram import Update
from telegram.ext import ContextTypes
from file_converters import (
    count_contacts_in_vcf, count_contacts_in_txt,
    split_vcf_unlimited, merge_vcf_files_unlimited,
    create_vcf_file_unlimited, extract_phone_numbers_unlimited,
    hapus_spasi_antar_nomor_unlimited,
    read_vcf_unlimited, write_vcf_unlimited
)
from helpers import get_user, increment_operation

# Global sessions untuk tracking user state
vip_sessions = {}

def get_session(user_id):
    """Get or create session for user"""
    if user_id not in vip_sessions:
        vip_sessions[user_id] = {
            'command': None,
            'step': 0,
            'files': [],
            'data': {}
        }
    return vip_sessions[user_id]

def clear_session(user_id):
    """Clear user session"""
    if user_id in vip_sessions:
        del vip_sessions[user_id]

async def handle_vip_command(update: Update, context: ContextTypes.DEFAULT_TYPE, command: str):
    """Main dispatcher untuk VIP commands"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    
    # Check access
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur ini hanya untuk VIP!*\n\nKontakt @Iqbaldev untuk mendapat akses", parse_mode="Markdown")
        return
    
    session = get_session(user_id)
    session['command'] = command
    session['step'] = 1
    
    commands_flow = {
        'rapikatntxt': ("🚧 RAPIKAN TXT", "📤 Kirim file TXT yang akan dirapihkan"),
        'msgtotxt': ("📨 MSG TO TXT", "📝 Kirim nomor telepon untuk dikonversi"),
        'txttovcf': ("🏷️ TXT TO VCF", "📤 Kirim file TXT yang akan dikonversi"),
        'xlstovcf': ("🚀 XLS TO VCF", "📤 Kirim file Excel (XLSX)"),
        'vcftotxt': ("♻️ VCF TO TXT", "📤 Kirim file VCF"),
        'gabungfile': ("⛓️ ɢᴀʙᴜɴɢ ꜰɪʟᴇ ⛓️", "📤 Kirim file pertama (VCF/TXT/XLS)"),
        'gabungtxt': ("⛓️ ɢᴀʙᴜɴɢ ᴛxᴛ ⛓️", "📤 Kirim file TXT pertama"),
        'hitung': ("⛓️ ʜɪᴛᴜɴɢ ᴋᴏɴᴛᴀᴋ ⛓️", "📤 Kirim file VCF/TXT"),
        'cek_nama': ("⛓️ ᴄᴇᴋ ɴᴀᴍᴀ ᴋᴏɴᴛᴀᴋ ⛓️", "📤 Kirim file VCF"),
        'rename_file': ("⛓️ ʀᴇɴᴀᴍᴇ ꜰɪʟᴇ ⛓️", "📤 Kirim file yang akan di-rename"),
        'rename_kontak': ("⛓️ ʀᴇɴᴀᴍᴇ ᴋᴏɴᴛᴀᴋ ⛓️", "📤 Kirim file VCF"),
        'admin': ("⛓️ ᴄʀᴇᴀᴛᴇ ᴀᴅᴍɪɴ ⛓️", "📝 Kirim nomor admin (pisahkan dengan spasi)"),
    }
    
    if command in commands_flow:
        title, instruction = commands_flow[command]
        await update.message.reply_text(
            f"*{title}*\n\n{instruction}\n\nKetik `batal` untuk membatalkan",
            parse_mode="Markdown"
        )

async def handle_file_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle file uploads dari user"""
    user_id = update.effective_user.id
    session = get_session(user_id)
    
    if 'command' not in session or not session['command']:
        return
    
    command = session['command']
    file_obj = update.message.document
    file_name = file_obj.file_name
    
    try:
        # Download file
        file = await context.bot.get_file(file_obj.file_id)
        file_path = f"/tmp/{file_name}"
        await file.download_to_drive(file_path)
        
        # Process based on command
        if command == 'rapikatntxt':
            await process_rapikan_txt(update, context, file_path)
        elif command == 'msgtotxt':
            session['files'].append(file_path)
            await update.message.reply_text("📄 Masukkan nama file output")
        elif command == 'txttovcf':
            session['files'].append(file_path)
            await update.message.reply_text("🏷️ Masukkan nama kontak")
        elif command == 'xlstovcf':
            session['files'].append(file_path)
            await update.message.reply_text("🏷️ Masukkan nama kontak")
        elif command == 'vcftotxt':
            await process_vcf_to_txt(update, context, file_path)
        elif command == 'gabungfile':
            session['files'].append(file_path)
            await update.message.reply_text(
                f"✅ File {len(session['files'])} diterima\n\nKirim file lagi atau ketik `done` untuk selesai"
            )
        elif command == 'gabungtxt':
            session['files'].append(file_path)
            await update.message.reply_text(
                f"✅ File {len(session['files'])} diterima\n\nKirim file lagi atau ketik `done` untuk selesai"
            )
        elif command == 'hitung':
            await process_hitung(update, context, file_path, file_name)
        elif command == 'cek_nama':
            await process_cek_nama(update, context, file_path)
        elif command == 'rename_file':
            session['files'].append(file_path)
            await update.message.reply_text("📝 Masukkan nama file baru (tanpa extension)")
        elif command == 'rename_kontak':
            session['files'].append(file_path)
            await update.message.reply_text("🏷️ Masukkan prefix untuk semua kontak")
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        clear_session(user_id)

async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text input untuk multi-step commands"""
    user_id = update.effective_user.id
    text = update.message.text
    session = get_session(user_id)
    
    if text.lower() == 'batal':
        await update.message.reply_text("❌ *Dibatalkan ya Kak* 😊", parse_mode="Markdown")
        clear_session(user_id)
        return
    
    command = session.get('command')
    files = session.get('files', [])
    
    try:
        if command == 'msgtotxt':
            if session['step'] == 1:
                session['data']['numbers'] = text
                session['step'] = 2
                await update.message.reply_text("📄 Masukkan nama file")
            else:
                file_name = f"{text}.txt"
                with open(file_name, 'w') as f:
                    f.write(session['data']['numbers'])
                await update.message.reply_document(file_name)
                await update.message.reply_text("✅ *Konversi Berhasil*", parse_mode="Markdown")
                os.remove(file_name)
                increment_operation(user_id)
                clear_session(user_id)
                
        elif command == 'txttovcf':
            if session['step'] == 1:
                session['data']['contact_name'] = text
                session['step'] = 2
                if files:
                    cont_all = []
                    with open(files[0], 'r') as f:
                        for line in f:
                            num = line.strip().replace("+", "")
                            if num and num.replace(" ", "").isnumeric():
                                cont_all.append(num)
                    
                    if cont_all:
                        output_file = f"output_{text}.vcf"
                        create_vcf_file_unlimited(cont_all, text, output_file)
                        await update.message.reply_document(output_file)
                        await update.message.reply_text("✅ *Konversi Berhasil*", parse_mode="Markdown")
                        if os.path.exists(output_file):
                            os.remove(output_file)
                        if os.path.exists(files[0]):
                            os.remove(files[0])
                        increment_operation(user_id)
                        clear_session(user_id)
                    else:
                        await update.message.reply_text("❌ Tidak ada nomor")
                        clear_session(user_id)
                        
        elif command == 'xlstovcf':
            if session['step'] == 1:
                session['data']['contact_name'] = text
                session['step'] = 2
                if files:
                    cont_all = []
                    df = pd.read_excel(files[0])
                    ls_cont = df.values.flatten().tolist()
                    for num in ls_cont:
                        num_str = str(num).replace("+", "").strip()
                        if num_str and num_str.replace(" ", "").isnumeric():
                            cont_all.append(num_str)
                    
                    if cont_all:
                        output_file = f"output_{text}.vcf"
                        create_vcf_file_unlimited(cont_all, text, output_file)
                        await update.message.reply_document(output_file)
                        await update.message.reply_text("✅ *Konversi Berhasil*", parse_mode="Markdown")
                        if os.path.exists(output_file):
                            os.remove(output_file)
                        if os.path.exists(files[0]):
                            os.remove(files[0])
                        increment_operation(user_id)
                        clear_session(user_id)
                    else:
                        await update.message.reply_text("❌ Tidak ada nomor")
                        clear_session(user_id)
                        
        elif command == 'gabungfile':
            if text.lower() == 'done':
                if len(files) >= 2:
                    await update.message.reply_text("📄 Nama file output?")
                else:
                    await update.message.reply_text("❌ Minimal 2 file")
            else:
                # Gabung file logic
                output_file = f"{text}.vcf"
                first_file = files[0] if files else None
                
                if first_file and first_file.endswith('.vcf'):
                    merge_vcf_files_unlimited(files, output_file)
                else:
                    # Gabung TXT files
                    output_file = f"{text}.txt"
                    all_numbers = set()
                    for fpath in files:
                        if os.path.exists(fpath):
                            with open(fpath, 'r') as f:
                                for line in f:
                                    line = line.strip()
                                    if line:
                                        all_numbers.add(line)
                    
                    with open(output_file, 'w') as f:
                        for number in sorted(all_numbers):
                            f.write(number + '\n')
                
                await update.message.reply_document(output_file)
                await update.message.reply_text("✅ *Gabung Berhasil*", parse_mode="Markdown")
                for f in files:
                    if os.path.exists(f):
                        os.remove(f)
                if os.path.exists(output_file):
                    os.remove(output_file)
                increment_operation(user_id)
                clear_session(user_id)
                
        elif command == 'gabungtxt':
            if text.lower() == 'done':
                if len(files) >= 2:
                    await update.message.reply_text("📄 Nama file output?")
                else:
                    await update.message.reply_text("❌ Minimal 2 file")
            else:
                output_file = f"{text}.txt"
                all_numbers = set()
                for fpath in files:
                    if os.path.exists(fpath):
                        with open(fpath, 'r') as f:
                            for line in f:
                                line = line.strip()
                                if line:
                                    all_numbers.add(line)
                
                with open(output_file, 'w') as f:
                    for number in sorted(all_numbers):
                        f.write(number + '\n')
                
                await update.message.reply_document(output_file)
                await update.message.reply_text("✅ *Gabung Berhasil*", parse_mode="Markdown")
                for f in files:
                    if os.path.exists(f):
                        os.remove(f)
                if os.path.exists(output_file):
                    os.remove(output_file)
                increment_operation(user_id)
                clear_session(user_id)
                
        elif command == 'rename_file':
            if session['step'] == 1:
                new_name = text
                if files:
                    old_path = files[0]
                    ext = os.path.splitext(old_path)[1]
                    new_path = f"{new_name}{ext}"
                    os.rename(old_path, new_path)
                    await update.message.reply_document(new_path)
                    await update.message.reply_text("✅ *Rename Berhasil*", parse_mode="Markdown")
                    if os.path.exists(new_path):
                        os.remove(new_path)
                    increment_operation(user_id)
                    clear_session(user_id)
                    
        elif command == 'rename_kontak':
            if session['step'] == 1:
                prefix = text
                if files and files[0].endswith('.vcf'):
                    kontak = read_vcf_unlimited(files[0])
                    new_kontak = []
                    
                    for i, c in enumerate(kontak, 1):
                        if isinstance(c, str):
                            c = re.sub(r'FN:.+', f'FN:{prefix}-{str(i).zfill(4)}', c)
                        new_kontak.append(c)
                    
                    output_file = f"rename_{prefix}.vcf"
                    write_vcf_unlimited(new_kontak, output_file)
                    await update.message.reply_document(output_file)
                    await update.message.reply_text("✅ *Rename Berhasil*", parse_mode="Markdown")
                    if os.path.exists(output_file):
                        os.remove(output_file)
                    if os.path.exists(files[0]):
                        os.remove(files[0])
                    increment_operation(user_id)
                    clear_session(user_id)
                
        elif command == 'admin':
            numbers = text.split()
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
            await update.message.reply_text("✅ *File ADMIN Berhasil Dibuat*", parse_mode="Markdown")
            if os.path.exists(file_name):
                os.remove(file_name)
            increment_operation(user_id)
            clear_session(user_id)
            
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        clear_session(user_id)

# Individual process functions
async def process_rapikan_txt(update: Update, context: ContextTypes.DEFAULT_TYPE, file_path: str):
    """Process RAPIKAN TXT"""
    try:
        hapus_spasi_antar_nomor_unlimited(file_path)
        await update.message.reply_document(file_path)
        await update.message.reply_text("✅ *Proses Selesai*", parse_mode="Markdown")
        if os.path.exists(file_path):
            os.remove(file_path)
        increment_operation(update.effective_user.id)
        clear_session(update.effective_user.id)
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        clear_session(update.effective_user.id)

async def process_vcf_to_txt(update: Update, context: ContextTypes.DEFAULT_TYPE, file_path: str):
    """Process VCF TO TXT"""
    try:
        output_file = file_path.replace('.vcf', '.txt')
        extract_phone_numbers_unlimited(file_path, output_file)
        await update.message.reply_document(output_file)
        await update.message.reply_text("✅ *Konversi Berhasil*", parse_mode="Markdown")
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(output_file):
            os.remove(output_file)
        increment_operation(update.effective_user.id)
        clear_session(update.effective_user.id)
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        clear_session(update.effective_user.id)

async def process_hitung(update: Update, context: ContextTypes.DEFAULT_TYPE, file_path: str, file_name: str):
    """Process HITUNG KONTAK"""
    try:
        if file_name.endswith('.vcf'):
            total = count_contacts_in_vcf(file_path)
        elif file_name.endswith('.txt'):
            total = count_contacts_in_txt(file_path)
        else:
            total = 0
        
        await update.message.reply_text(f"📊 *Total Kontak: {total}*", parse_mode="Markdown")
        if os.path.exists(file_path):
            os.remove(file_path)
        increment_operation(update.effective_user.id)
        clear_session(update.effective_user.id)
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        clear_session(update.effective_user.id)

async def process_cek_nama(update: Update, context: ContextTypes.DEFAULT_TYPE, file_path: str):
    """Process CEK NAMA KONTAK"""
    try:
        kontak = read_vcf_unlimited(file_path)
        daftar_nama = []
        
        for c in kontak:
            if isinstance(c, str):
                match = re.search(r'FN:(.+?)(?:\n|$)', c)
                if match:
                    daftar_nama.append(match.group(1).strip())
        
        if daftar_nama:
            hasil = "*📋 Daftar Nama Kontak*\n\n"
            for i, nama in enumerate(daftar_nama[:100], 1):
                hasil += f"`{i}.` {nama}\n"
            await update.message.reply_text(hasil, parse_mode="Markdown")
        else:
            await update.message.reply_text("❌ Tidak ada nama kontak")
        
        if os.path.exists(file_path):
            os.remove(file_path)
        increment_operation(update.effective_user.id)
        clear_session(update.effective_user.id)
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
        clear_session(update.effective_user.id)
