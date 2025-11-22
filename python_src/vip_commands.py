"""VIP Commands Handler - TXT TO VCF, VCF TO TXT, BAGI LANJUTAN, POTONG LANJUTAN"""
import os
import re
import asyncio
import pandas as pd
from telegram import Update
from telegram.ext import ContextTypes
from file_converters import (
    count_contacts_in_vcf, count_contacts_in_txt,
    create_vcf_file_unlimited, extract_phone_numbers_unlimited,
    hapus_spasi_antar_nomor_unlimited, read_vcf_unlimited, write_vcf_unlimited,
    rename_contacts
)
from helpers import get_user, increment_operation

vip_sessions = {}

def get_session(user_id):
    if user_id not in vip_sessions:
        vip_sessions[user_id] = {
            'command': None, 
            'step': 0, 
            'files': [], 
            'data': {},
            'split_counter': 1,
            'file_counter': 1
        }
    return vip_sessions[user_id]

def clear_session(user_id):
    if user_id in vip_sessions:
        del vip_sessions[user_id]

async def handle_vip_command(update: Update, context: ContextTypes.DEFAULT_TYPE, command: str):
    """Start VIP command"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur VIP saja!* @Iqbaldev", parse_mode="Markdown")
        return
    
    session = get_session(user_id)
    session['command'] = command
    session['step'] = 1
    
    titles = {
        'rapikatntxt': ("🚧 *RAPIKAN TXT*", "Kirim file TXT"),
        'msgtotxt': ("📨 *MSG TO TXT*", "Kirim nomor"),
        'txttovcf': ("🏷️ *TXT TO VCF*", "Kirim file TXT (.txt)"),
        'xlstovcf': ("🚀 *XLS TO VCF*", "Kirim Excel (.xls/.xlsx)"),
        'vcftotxt': ("♻️ *VCF TO TXT*", "Kirim file VCF (.vcf)"),
        'gabungfile': ("⛓️ *GABUNG FILE*", "Kirim file 1 (VCF/TXT/XLS)"),
        'gabungtxt': ("⛓️ *GABUNG TXT*", "Kirim file TXT 1"),
        'hitung': ("⛓️ *HITUNG KONTAK*", "Kirim file VCF/TXT"),
        'cek_nama': ("⛓️ *CEK NAMA*", "Kirim file VCF"),
        'rename_file': ("⛓️ *RENAME FILE*", "Kirim file"),
        'rename_kontak': ("⛓️ *RENAME KONTAK*", "Kirim file VCF"),
        'admin': ("⛓️ *CREATE ADMIN*", "Kirim nomor (spasi)"),
        'bagi_lanjutan': ("🪓 *BAGI LANJUTAN*", "Siap proses split file"),
        'potong_lanjutan': ("📊 *POTONG LANJUTAN*", "Siap proses cut file"),
    }
    
    if command in titles:
        title, inst = titles[command]
        msg = f"{title}\n\n{inst}\n\n_Ketik `batal` untuk batalkan_"
        await update.message.reply_text(msg, parse_mode="Markdown")

async def handle_file_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle file uploads"""
    user_id = update.effective_user.id
    session = get_session(user_id)
    if 'command' not in session or not session['command']:
        return
    
    file_obj = update.message.document
    file_name = file_obj.file_name
    file = await context.bot.get_file(file_obj.file_id)
    file_path = f"/tmp/{file_name}"
    await file.download_to_drive(file_path)
    
    try:
        cmd = session['command']
        if cmd == 'rapikatntxt':
            hapus_spasi_antar_nomor_unlimited(file_path)
            await update.message.reply_document(file_path)
            await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
            os.remove(file_path)
            increment_operation(user_id)
            clear_session(user_id)
        elif cmd == 'msgtotxt':
            session['files'].append(file_path)
            await update.message.reply_text("📝 *Nama file output?*", parse_mode="Markdown")
        elif cmd == 'txttovcf':
            session['files'].append(file_path)
            session['step'] = 2
            await update.message.reply_text("📝 *Nama file output?*", parse_mode="Markdown")
        elif cmd == 'xlstovcf':
            session['files'].append(file_path)
            session['step'] = 2
            await update.message.reply_text("👤 *Nama kontak?*", parse_mode="Markdown")
        elif cmd == 'vcftotxt':
            session['files'].append(file_path)
            session['step'] = 2
            await update.message.reply_text("📝 *Nama file output?*", parse_mode="Markdown")
        elif cmd in ['gabungfile', 'gabungtxt']:
            session['files'].append(file_path)
            # Single summary message - hanya update untuk tracking
            msg = f"📦 *File Received: {len(session['files'])}*\n\n"
            msg += f"Tipe: {file_name.split('.')[-1].upper()}\n\n"
            msg += f"Total: {len(session['files'])} file\n\n"
            msg += f"_Kirim file lagi atau ketik `done` untuk selesai_"
            # Store message ID untuk update nanti jika perlu
            await update.message.reply_text(msg, parse_mode="Markdown")
        elif cmd == 'hitung':
            total = count_contacts_in_vcf(file_path) if file_name.endswith('.vcf') else count_contacts_in_txt(file_path)
            await update.message.reply_text(f"📊 *Total: {total} kontak*", parse_mode="Markdown")
            os.remove(file_path) if os.path.exists(file_path) else None
            increment_operation(user_id)
            clear_session(user_id)
        elif cmd == 'cek_nama':
            kontak = read_vcf_unlimited(file_path)
            nama = []
            for c in kontak:
                if isinstance(c, str):
                    match = re.search(r'FN:(.+?)(?:\n|$)', c)
                    if match:
                        nama.append(match.group(1))
            nama = nama[:100]
            msg = "📋 *Daftar Nama Kontak*\n\n" + "\n".join([f"{i}. {n}" for i, n in enumerate(nama, 1)])
            await update.message.reply_text(msg, parse_mode="Markdown")
            os.remove(file_path) if os.path.exists(file_path) else None
            increment_operation(user_id)
            clear_session(user_id)
        elif cmd == 'rename_file':
            session['files'].append(file_path)
            session['step'] = 2
            await update.message.reply_text("📝 *Nama file baru?*", parse_mode="Markdown")
        elif cmd == 'rename_kontak':
            session['files'].append(file_path)
            session['step'] = 2
            await update.message.reply_text("🔤 *Prefix kontak?*\n\n_Misal: CLIENT, KONTAK_", parse_mode="Markdown")
        elif cmd == 'bagi_lanjutan':
            session['files'].append(file_path)
            session['step'] = 2
            session['split_counter'] = 1
            session['file_counter'] = 1
            await update.message.reply_text("📎 *Nama file output?*", parse_mode="Markdown")
        elif cmd == 'potong_lanjutan':
            session['files'].append(file_path)
            session['step'] = 2
            session['split_counter'] = 1
            session['file_counter'] = 1
            await update.message.reply_text("📎 *Nama file output?*", parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ *Error: {str(e)}*", parse_mode="Markdown")
        clear_session(user_id)

async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text input"""
    user_id = update.effective_user.id
    text = update.message.text.strip()
    session = get_session(user_id)
    
    if text.lower() == 'batal':
        await update.message.reply_text("❌ *Dibatalkan* 😊", parse_mode="Markdown")
        clear_session(user_id)
        return
    
    cmd = session.get('command')
    files = session.get('files', [])
    
    try:
        if cmd == 'msgtotxt':
            if session['step'] == 1:
                session['data']['numbers'] = text
                session['step'] = 2
                await update.message.reply_text("📝 *Nama file output?*", parse_mode="Markdown")
            else:
                fname = f"/tmp/{text}.txt"
                with open(fname, 'w') as f:
                    f.write(session['data']['numbers'])
                await update.message.reply_document(fname)
                await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
                os.remove(fname)
                increment_operation(user_id)
                clear_session(user_id)
        
        elif cmd == 'txttovcf':
            if session['step'] == 2:
                session['data']['output_filename'] = text
                session['step'] = 3
                await update.message.reply_text("👤 *Nama kontak?*\n\n_Misal: Klien, Kontak_", parse_mode="Markdown")
            elif session['step'] == 3:
                cont_all = []
                with open(files[0], 'r') as f:
                    for line in f:
                        num = line.strip().replace("+", "")
                        if num and num.replace(" ", "").isnumeric():
                            cont_all.append(num)
                if cont_all:
                    fname = f"/tmp/{session['data']['output_filename']}.vcf"
                    create_vcf_file_unlimited(cont_all, text, fname)
                    await update.message.reply_document(fname)
                    await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
                    os.remove(fname)
                    os.remove(files[0])
                    increment_operation(user_id)
                    clear_session(user_id)
                else:
                    await update.message.reply_text("❌ *Nomor tidak ditemukan!*", parse_mode="Markdown")
        
        elif cmd == 'xlstovcf':
            if session['step'] == 2:
                cont_all = []
                df = pd.read_excel(files[0])
                for num in df.values.flatten().tolist():
                    num_str = str(num).replace("+", "").strip()
                    if num_str and num_str.replace(" ", "").isnumeric():
                        cont_all.append(num_str)
                if cont_all:
                    fname = f"/tmp/output_{text}.vcf"
                    create_vcf_file_unlimited(cont_all, text, fname)
                    await update.message.reply_document(fname)
                    await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
                    os.remove(fname)
                    os.remove(files[0])
                    increment_operation(user_id)
                    clear_session(user_id)
                else:
                    await update.message.reply_text("❌ *Nomor tidak ditemukan!*", parse_mode="Markdown")
        
        elif cmd in ['gabungfile', 'gabungtxt']:
            if text.lower() == 'done':
                if len(files) >= 2:
                    session['step'] = 2
                    await update.message.reply_text("📝 *Nama file output?*", parse_mode="Markdown")
                else:
                    await update.message.reply_text("⚠️ *Minimal 2 file diperlukan!*", parse_mode="Markdown")
            else:
                fname = f"/tmp/{text}.vcf" if cmd == 'gabungfile' and files[0].endswith('.vcf') else f"/tmp/{text}.txt"
                if cmd == 'gabungfile' and files[0].endswith('.vcf'):
                    with open(fname, 'w') as outfile:
                        for f in files:
                            if os.path.exists(f):
                                with open(f, 'r') as infile:
                                    outfile.write(infile.read())
                                    outfile.write("\n")
                else:
                    nums = set()
                    for f in files:
                        if os.path.exists(f):
                            with open(f, 'r') as fh:
                                for line in fh:
                                    if line.strip():
                                        nums.add(line.strip())
                    with open(fname, 'w') as fh:
                        for n in sorted(nums):
                            fh.write(n + '\n')
                
                await update.message.reply_document(fname)
                await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
                for f in files:
                    os.remove(f) if os.path.exists(f) else None
                os.remove(fname)
                increment_operation(user_id)
                clear_session(user_id)
        
        elif cmd == 'rename_file':
            if session['step'] == 2 and files:
                old = files[0]
                ext = os.path.splitext(old)[1]
                new = f"/tmp/{text}{ext}"
                os.rename(old, new)
                await update.message.reply_document(new)
                await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
                os.remove(new)
                increment_operation(user_id)
                clear_session(user_id)
        
        elif cmd == 'rename_kontak':
            if session['step'] == 2 and files and files[0].endswith('.vcf'):
                kontak = read_vcf_unlimited(files[0])
                new_k = []
                for i, c in enumerate(kontak, 1):
                    if isinstance(c, str):
                        c = re.sub(r'FN:.+', f'FN:{text}-{str(i).zfill(4)}', c)
                    new_k.append(c)
                fname = f"/tmp/rename_{text}.vcf"
                write_vcf_unlimited(new_k, fname)
                await update.message.reply_document(fname)
                await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
                os.remove(fname)
                os.remove(files[0])
                increment_operation(user_id)
                clear_session(user_id)
        
        elif cmd == 'admin':
            nums = text.split()
            fname = f"/tmp/ADMIN.vcf"
            with open(fname, "w") as f:
                for i, phone in enumerate(nums, 1):
                    f.write(f"BEGIN:VCARD\nVERSION:3.0\nFN:ADMIN-{str(i).zfill(4)}\nTEL;TYPE=CELL:{phone}\nEND:VCARD\n\n")
            await update.message.reply_document(fname)
            await update.message.reply_text("✅ *Selesai!*", parse_mode="Markdown")
            os.remove(fname)
            increment_operation(user_id)
            clear_session(user_id)
        
        # BAGI LANJUTAN - Split with continuation
        elif cmd == 'bagi_lanjutan':
            if session['step'] == 2:
                session['data']['output_name'] = text
                session['step'] = 3
                await update.message.reply_text("🔢 *Angka awal penomoran kontak?*\n\n_Default: 1_", parse_mode="Markdown")
            elif session['step'] == 3:
                if text.isnumeric():
                    session['split_counter'] = int(text)
                    session['step'] = 4
                    await update.message.reply_text("🔢 *Angka awal nama file?*\n\n_Default: 1_", parse_mode="Markdown")
                else:
                    await update.message.reply_text("⚠️ *Harus angka!*", parse_mode="Markdown")
            elif session['step'] == 4:
                if text.isnumeric():
                    session['file_counter'] = int(text)
                    session['step'] = 5
                    await update.message.reply_text("🪓 *Jumlah file (bagian) yg diinginkan?*", parse_mode="Markdown")
                else:
                    await update.message.reply_text("⚠️ *Harus angka!*", parse_mode="Markdown")
            elif session['step'] == 5:
                if not text.isnumeric() or int(text) <= 0:
                    await update.message.reply_text("⚠️ *Harus angka positif!*", parse_mode="Markdown")
                    return
                bagian = int(text)
                contacts = list(read_vcf_unlimited(files[0]))
                total_contacts = len(contacts)
                contacts_per_file = (total_contacts + bagian - 1) // bagian
                
                dump_ = []
                global_index = session['split_counter']
                file_index = session['file_counter']
                output_name = session['data']['output_name']
                
                for i in range(bagian):
                    start = i * contacts_per_file
                    end = min(start + contacts_per_file, total_contacts)
                    chunk = rename_contacts(contacts[start:end], start_index=global_index)
                    filename = f"/tmp/{output_name}-{file_index}.vcf"
                    write_vcf_unlimited(chunk, filename)
                    dump_.append(filename)
                    global_index += len(chunk)
                    file_index += 1
                
                for f in dump_:
                    await update.message.reply_document(f)
                    os.remove(f)
                
                session['split_counter'] = global_index
                session['file_counter'] = file_index
                os.remove(files[0])
                
                await update.message.reply_text("✅ *Selesai bagian ini!*\n\nKetik `lanjut` untuk file berikutnya atau `done` untuk selesai", parse_mode="Markdown")
                session['files'] = []
                session['step'] = 1
        
        # POTONG LANJUTAN - Cut with continuation
        elif cmd == 'potong_lanjutan':
            if session['step'] == 2:
                session['data']['output_name'] = text
                session['step'] = 3
                await update.message.reply_text("🔢 *Angka awal penomoran kontak?*\n\n_Default: 1_", parse_mode="Markdown")
            elif session['step'] == 3:
                if text.isnumeric():
                    session['split_counter'] = int(text)
                    session['step'] = 4
                    await update.message.reply_text("🔢 *Angka awal nama file?*\n\n_Default: 1_", parse_mode="Markdown")
                else:
                    await update.message.reply_text("⚠️ *Harus angka!*", parse_mode="Markdown")
            elif session['step'] == 4:
                if text.isnumeric():
                    session['file_counter'] = int(text)
                    session['step'] = 5
                    await update.message.reply_text("📄 *Jumlah kontak per file?*", parse_mode="Markdown")
                else:
                    await update.message.reply_text("⚠️ *Harus angka!*", parse_mode="Markdown")
            elif session['step'] == 5:
                if not text.isnumeric():
                    await update.message.reply_text("⚠️ *Harus angka!*", parse_mode="Markdown")
                    return
                kontak_per_file = int(text)
                contacts = list(read_vcf_unlimited(files[0]))
                
                dump_ = []
                global_index = session['split_counter']
                file_index = session['file_counter']
                output_name = session['data']['output_name']
                
                for i, contact in enumerate(contacts, start=global_index):
                    if (i - global_index) % kontak_per_file == 0:
                        if dump_ and os.path.exists(dump_[-1]):
                            pass
                        filename = f"/tmp/{output_name}-{file_index}.vcf"
                        dump_.append(filename)
                        file_index += 1
                    
                    if isinstance(contact, str):
                        contact = re.sub(r'FN:.+', f'FN:{output_name}-{str(i).zfill(4)}', contact)
                    
                    with open(dump_[-1], 'a') as f:
                        f.write(contact if isinstance(contact, str) else str(contact))
                
                for f in dump_:
                    if os.path.exists(f):
                        await update.message.reply_document(f)
                
                session['split_counter'] = global_index + len(contacts)
                session['file_counter'] = file_index
                os.remove(files[0])
                
                await update.message.reply_text("✅ *Selesai potong ini!*\n\nKetik `lanjut` untuk file berikutnya atau `done` untuk selesai", parse_mode="Markdown")
                session['files'] = []
                session['step'] = 1
    
    except Exception as e:
        await update.message.reply_text(f"❌ *Error: {str(e)}*", parse_mode="Markdown")
        clear_session(user_id)

async def handle_extract_nomor(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Extract phone numbers from file"""
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 *Fitur VIP saja!*", parse_mode="Markdown")
        return
    
    session = get_session(user_id)
    session['command'] = 'extract_nomor'
    session['step'] = 1
    
    await update.message.reply_text(
        "⛓️ *EKSTRAK NOMOR*\n\n"
        "Support format:\n"
        "• VCF (Contact)\n"
        "• TXT (Text)\n"
        "• XLS/XLSX (Excel)\n"
        "• CSV (Data)\n\n"
        "_Kirim file untuk ekstrak nomor_",
        parse_mode="Markdown"
    )
