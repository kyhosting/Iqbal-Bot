"""VIP Commands Handler - COMPLETE FIX"""
import os
import re
import pandas as pd
from telegram import Update
from telegram.ext import ContextTypes
from file_converters import (
    count_contacts_in_vcf, count_contacts_in_txt,
    split_vcf_unlimited, merge_vcf_files_unlimited,
    create_vcf_file_unlimited, extract_phone_numbers_unlimited,
    hapus_spasi_antar_nomor_unlimited, read_vcf_unlimited, write_vcf_unlimited
)
from helpers import get_user, increment_operation

vip_sessions = {}

def get_session(user_id):
    if user_id not in vip_sessions:
        vip_sessions[user_id] = {'command': None, 'step': 0, 'files': [], 'data': {}}
    return vip_sessions[user_id]

def clear_session(user_id):
    if user_id in vip_sessions:
        del vip_sessions[user_id]

async def handle_vip_command(update: Update, context: ContextTypes.DEFAULT_TYPE, command: str):
    user_id = update.effective_user.id
    db_user = get_user(user_id)
    if not db_user or db_user['role'] not in ['vip', 'trial', 'owner']:
        await update.message.reply_text("🔒 Fitur VIP saja! @Iqbaldev", parse_mode="Markdown")
        return
    
    session = get_session(user_id)
    session['command'] = command
    session['step'] = 1
    
    titles = {
        'rapikatntxt': ("🚧 RAPIKAN TXT", "Kirim file TXT"),
        'msgtotxt': ("📨 MSG TO TXT", "Kirim nomor"),
        'txttovcf': ("🏷️ TXT TO VCF", "Kirim file TXT"),
        'xlstovcf': ("🚀 XLS TO VCF", "Kirim Excel"),
        'vcftotxt': ("♻️ VCF TO TXT", "Kirim file VCF"),
        'gabungfile': ("⛓️ GABUNG FILE ⛓️", "Kirim file 1 (VCF/TXT/XLS)"),
        'gabungtxt': ("⛓️ GABUNG TXT ⛓️", "Kirim file TXT 1"),
        'hitung': ("⛓️ HITUNG KONTAK ⛓️", "Kirim file VCF/TXT"),
        'cek_nama': ("⛓️ CEK NAMA ⛓️", "Kirim file VCF"),
        'rename_file': ("⛓️ RENAME FILE ⛓️", "Kirim file"),
        'rename_kontak': ("⛓️ RENAME KONTAK ⛓️", "Kirim file VCF"),
        'admin': ("⛓️ CREATE ADMIN ⛓️", "Kirim nomor (spasi)"),
    }
    
    if command in titles:
        title, inst = titles[command]
        await update.message.reply_text(f"*{title}*\n\n{inst}\n\nKetik batal untuk batal", parse_mode="Markdown")

async def handle_file_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
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
            await update.message.reply_text("✅ Selesai", parse_mode="Markdown")
            os.remove(file_path)
            increment_operation(user_id)
            clear_session(user_id)
        elif cmd == 'msgtotxt':
            session['files'].append(file_path)
            await update.message.reply_text("Nama file output?")
        elif cmd == 'txttovcf':
            session['files'].append(file_path)
            await update.message.reply_text("Nama kontak?")
        elif cmd == 'xlstovcf':
            session['files'].append(file_path)
            await update.message.reply_text("Nama kontak?")
        elif cmd == 'vcftotxt':
            out = file_path.replace('.vcf', '.txt')
            extract_phone_numbers_unlimited(file_path, out)
            await update.message.reply_document(out)
            await update.message.reply_text("✅ Selesai", parse_mode="Markdown")
            os.remove(file_path) if os.path.exists(file_path) else None
            os.remove(out) if os.path.exists(out) else None
            increment_operation(user_id)
            clear_session(user_id)
        elif cmd in ['gabungfile', 'gabungtxt']:
            session['files'].append(file_path)
            await update.message.reply_text(f"File {len(session['files'])} OK. Kirim lagi atau ketik done")
        elif cmd == 'hitung':
            total = count_contacts_in_vcf(file_path) if file_name.endswith('.vcf') else count_contacts_in_txt(file_path)
            await update.message.reply_text(f"📊 Total: {total}")
            os.remove(file_path) if os.path.exists(file_path) else None
            increment_operation(user_id)
            clear_session(user_id)
        elif cmd == 'cek_nama':
            kontak = read_vcf_unlimited(file_path)
            nama = [re.search(r'FN:(.+?)(?:\n|$)', c).group(1) for c in kontak if isinstance(c, str) and re.search(r'FN:(.+?)(?:\n|$)', c)][:100]
            msg = "📋 Nama Kontak\n\n" + "\n".join([f"{i}. {n}" for i, n in enumerate(nama, 1)])
            await update.message.reply_text(msg)
            os.remove(file_path) if os.path.exists(file_path) else None
            increment_operation(user_id)
            clear_session(user_id)
        elif cmd == 'rename_file':
            session['files'].append(file_path)
            await update.message.reply_text("Nama baru?")
        elif cmd == 'rename_kontak':
            session['files'].append(file_path)
            await update.message.reply_text("Prefix kontak?")
    except Exception as e:
        await update.message.reply_text(f"❌ {str(e)}")
        clear_session(user_id)

async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text
    session = get_session(user_id)
    
    if text.lower() == 'batal':
        await update.message.reply_text("❌ Batal", parse_mode="Markdown")
        clear_session(user_id)
        return
    
    cmd = session.get('command')
    files = session.get('files', [])
    
    try:
        if cmd == 'msgtotxt':
            if session['step'] == 1:
                session['data']['numbers'] = text
                session['step'] = 2
                await update.message.reply_text("Nama file?")
            else:
                fname = f"{text}.txt"
                with open(fname, 'w') as f:
                    f.write(session['data']['numbers'])
                await update.message.reply_document(fname)
                await update.message.reply_text("✅ OK")
                os.remove(fname)
                increment_operation(user_id)
                clear_session(user_id)
        elif cmd == 'txttovcf':
            if session['step'] == 1:
                cont_all = []
                with open(files[0], 'r') as f:
                    for line in f:
                        num = line.strip().replace("+", "")
                        if num and num.replace(" ", "").isnumeric():
                            cont_all.append(num)
                if cont_all:
                    fname = f"output_{text}.vcf"
                    create_vcf_file_unlimited(cont_all, text, fname)
                    await update.message.reply_document(fname)
                    await update.message.reply_text("✅ OK")
                    os.remove(fname)
                    os.remove(files[0])
                    increment_operation(user_id)
                    clear_session(user_id)
        elif cmd == 'xlstovcf':
            if session['step'] == 1:
                cont_all = []
                df = pd.read_excel(files[0])
                for num in df.values.flatten().tolist():
                    num_str = str(num).replace("+", "").strip()
                    if num_str and num_str.replace(" ", "").isnumeric():
                        cont_all.append(num_str)
                if cont_all:
                    fname = f"output_{text}.vcf"
                    create_vcf_file_unlimited(cont_all, text, fname)
                    await update.message.reply_document(fname)
                    await update.message.reply_text("✅ OK")
                    os.remove(fname)
                    os.remove(files[0])
                    increment_operation(user_id)
                    clear_session(user_id)
        elif cmd in ['gabungfile', 'gabungtxt']:
            if text.lower() == 'done':
                if len(files) >= 2:
                    await update.message.reply_text("Nama output?")
                else:
                    await update.message.reply_text("Min 2 file")
            else:
                fname = f"{text}.vcf" if cmd == 'gabungfile' and files[0].endswith('.vcf') else f"{text}.txt"
                if cmd == 'gabungfile' and files[0].endswith('.vcf'):
                    merge_vcf_files_unlimited(files, fname)
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
                await update.message.reply_text("✅ OK")
                for f in files:
                    os.remove(f) if os.path.exists(f) else None
                os.remove(fname)
                increment_operation(user_id)
                clear_session(user_id)
        elif cmd == 'rename_file':
            if files:
                old = files[0]
                ext = os.path.splitext(old)[1]
                new = f"{text}{ext}"
                os.rename(old, new)
                await update.message.reply_document(new)
                await update.message.reply_text("✅ OK")
                os.remove(new)
                increment_operation(user_id)
                clear_session(user_id)
        elif cmd == 'rename_kontak':
            if files and files[0].endswith('.vcf'):
                kontak = read_vcf_unlimited(files[0])
                new_k = []
                for i, c in enumerate(kontak, 1):
                    if isinstance(c, str):
                        c = re.sub(r'FN:.+', f'FN:{text}-{str(i).zfill(4)}', c)
                    new_k.append(c)
                fname = f"rename_{text}.vcf"
                write_vcf_unlimited(new_k, fname)
                await update.message.reply_document(fname)
                await update.message.reply_text("✅ OK")
                os.remove(fname)
                os.remove(files[0])
                increment_operation(user_id)
                clear_session(user_id)
        elif cmd == 'admin':
            nums = text.split()
            fname = 'ADMIN.vcf'
            with open(fname, "w") as f:
                for i, phone in enumerate(nums, 1):
                    f.write(f"BEGIN:VCARD\nVERSION:3.0\nFN:ADMIN-{str(i).zfill(4)}\nTEL;TYPE=CELL:{phone}\nEND:VCARD\n\n")
            await update.message.reply_document(fname)
            await update.message.reply_text("✅ OK")
            os.remove(fname)
            increment_operation(user_id)
            clear_session(user_id)
    except Exception as e:
        await update.message.reply_text(f"❌ {str(e)}")
        clear_session(user_id)
