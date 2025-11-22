"""File conversion utilities - UNLIMITED VERSION untuk Iqbal CV Bot"""
import os
import re
from openpyxl import load_workbook
from datetime import datetime, timedelta

# ========== UNLIMITED FILE HANDLING FUNCTIONS ==========

def remove_numbers(name):
    """Remove numbers from string"""
    return re.sub(r'\d+', '', name).strip()

def remove_emojis(text):
    """Remove emojis dari text"""
    emoji_pattern = re.compile(
        "[" 
        u"\U0001F600-\U0001F64F"  # Emoticons
        u"\U0001F300-\U0001F5FF"  # Symbols & Pictographs
        u"\U0001F680-\U0001F6FF"  # Transport & Map Symbols
        u"\U0001F1E0-\U0001F1FF"  # Flags (iOS)
        u"\U00002702-\U000027B0"  # Dingbats
        u"\U000024C2-\U0001F251" 
        "]+", flags=re.UNICODE
    )
    return emoji_pattern.sub(r'', text)

def read_vcf_streaming(file_path):
    """Generator untuk membaca VCF file besar - memory efficient"""
    current_vcard = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            current_vcard.append(line)
            if line.strip() == "END:VCARD":
                try:
                    vcard_text = ''.join(current_vcard)
                    # Simple parsing tanpa vobject
                    yield vcard_text
                except Exception as e:
                    pass
                finally:
                    current_vcard = []

def read_vcf_unlimited(file_path):
    """Membaca VCF file besar tanpa batas - memory efficient"""
    contacts = []
    for vcard_text in read_vcf_streaming(file_path):
        contacts.append(vcard_text)
    return contacts

def write_vcf_unlimited(contacts, file_path):
    """Menulis VCF file besar tanpa batas - memory efficient"""
    with open(file_path, 'w', encoding='utf-8') as file:
        for i, contact in enumerate(contacts):
            if isinstance(contact, str):
                file.write(contact)
            else:
                file.write(str(contact))
            if i % 1000 == 0:
                file.flush()

def count_contacts_in_vcf_unlimited(file_path):
    """Menghitung kontak dalam file besar tanpa load ke memory"""
    count = 0
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            if line.strip() == "END:VCARD":
                count += 1
    return count

def count_contacts_in_txt_unlimited(file_path):
    """Menghitung nomor dalam file TXT besar"""
    count = 0
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            if re.search(r'\d', line.strip()):
                count += 1
    return count

def rename_contacts(contacts, start_index=1):
    """Rename semua kontak dengan numbering"""
    renamed = []
    for index, contact in enumerate(contacts, start=start_index):
        if isinstance(contact, str):
            # Simple string-based renaming
            lines = contact.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith('FN:'):
                    clean_name = remove_emojis(line[3:])
                    new_lines.append(f'FN:{clean_name.strip()} {str(index).zfill(4)}')
                else:
                    new_lines.append(line)
            renamed.append('\n'.join(new_lines))
        else:
            renamed.append(contact)
    return renamed

def split_vcf_unlimited(input_file, newna, contacts_per_file=100):
    """Split VCF file besar tanpa batas - memory efficient"""
    contacts_list = read_vcf_unlimited(input_file)
    
    file_count = 0
    dump_ = []
    current_chunk = []
    global_index = 1
    
    for i, contact in enumerate(contacts_list):
        current_chunk.append(contact)
        
        if len(current_chunk) >= contacts_per_file:
            file_count += 1
            output_file = f'{newna}-{file_count}.vcf'
            
            renamed_chunk = rename_contacts(current_chunk, start_index=global_index)
            write_vcf_unlimited(renamed_chunk, output_file)
            dump_.append(output_file)
            
            global_index += len(current_chunk)
            current_chunk = []
    
    if current_chunk:
        file_count += 1
        output_file = f'{newna}-{file_count}.vcf'
        renamed_chunk = rename_contacts(current_chunk, start_index=global_index)
        write_vcf_unlimited(renamed_chunk, output_file)
        dump_.append(output_file)
    
    return dump_

def merge_vcf_files_unlimited(file_paths, output_file_path):
    """Merge multiple VCF files tanpa batas - streaming"""
    with open(f"{output_file_path}.vcf", 'w', encoding='utf-8') as outfile:
        for file_path in file_paths:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
                    outfile.write("\n")

def create_vcf_entry(phone_number, contact_name):
    """Create single VCF entry"""
    vcf_entry = f"""BEGIN:VCARD
VERSION:3.0
FN:{contact_name}
TEL;TYPE=CELL:{"+" if not str(phone_number).startswith("0") else ""}{phone_number}
END:VCARD
"""
    return vcf_entry

def create_vcf_file_unlimited(phone_numbers, ctcname, file_name, start_index=1):
    """Create VCF file untuk jumlah kontak sangat besar"""
    with open(file_name, "w", encoding='utf-8') as file:
        for i, phone_number in enumerate(phone_numbers, start=start_index):
            clean_number = re.sub(r'[^\d+]', '', str(phone_number))
            if clean_number and len(clean_number) >= 8:
                vcf_entry = create_vcf_entry(clean_number, f"{ctcname}-{str(i).zfill(4)}")
                file.write(vcf_entry + "\n")
            
            if i % 1000 == 0:
                file.flush()
    
    return file_name

def extract_numbers_from_file_unlimited(file_path):
    """Extract numbers dari file besar"""
    numbers = []
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            found_numbers = re.findall(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', line)
            numbers.extend(found_numbers)
    return numbers

def extract_phone_numbers_unlimited(vcf_file_path, output_txt_file_path):
    """Extract nomor dari VCF besar - streaming"""
    contacts_list = read_vcf_unlimited(vcf_file_path)
    
    with open(output_txt_file_path, 'w', encoding='utf-8') as txt_file:
        count = 0
        for vcard in contacts_list:
            # Simple extraction
            tel_matches = re.findall(r'TEL[^:]*:(.+?)(?:\n|$)', vcard)
            for tel in tel_matches:
                txt_file.write(tel.strip() + '\n')
                count += 1
            
            if count % 1000 == 0:
                txt_file.flush()
    
    return count

def hapus_spasi_antar_nomor_unlimited(file_path):
    """Clean file TXT besar"""
    temp_file = file_path + ".temp"
    
    with open(file_path, 'r', encoding='utf-8') as infile, \
         open(temp_file, 'w', encoding='utf-8') as outfile:
        
        for line in infile:
            # Hapus spasi, tanda baca
            cleaned_line = ''.join(line.split())
            cleaned_line = re.sub(r'[\(\)\-\/]', '', cleaned_line)
            if cleaned_line:
                outfile.write(cleaned_line + '\n')
    
    os.replace(temp_file, file_path)

# ========== COMPATIBILITY FUNCTIONS ==========

def read_vcf(file_path):
    return read_vcf_unlimited(file_path)

def write_vcf(contacts, file_path):
    return write_vcf_unlimited(contacts, file_path)

def count_contacts_in_vcf(file_path):
    return count_contacts_in_vcf_unlimited(file_path)

def count_contacts_in_txt(file_path):
    return count_contacts_in_txt_unlimited(file_path)

def split_vcf(input_file, newna, contacts_per_file=100):
    return split_vcf_unlimited(input_file, newna, contacts_per_file)

def merge_vcf_files(file_paths, output_file_path):
    return merge_vcf_files_unlimited(file_paths, output_file_path)

def create_vcf_file(phone_numbers, ctcname, file_name, start_index=1):
    return create_vcf_file_unlimited(phone_numbers, ctcname, file_name, start_index)

def extract_numbers_from_file(file_path):
    return extract_numbers_from_file_unlimited(file_path)

def extract_phone_numbers(vcf_file_path, output_txt_file_path):
    return extract_phone_numbers_unlimited(vcf_file_path, output_txt_file_path)

def hapus_spasi_antar_nomor(file_path):
    return hapus_spasi_antar_nomor_unlimited(file_path)

# ========== ORIGINAL FUNCTIONS (keep for compatibility) ==========

def create_vcf_entry_original(phone: str, name: str) -> str:
    """Create VCF contact entry"""
    # Clean phone number
    phone = re.sub(r'\D', '', phone)
    if not phone:
        return None
    
    return f"""BEGIN:VCARD
VERSION:3.0
FN:{name}
TEL;TYPE=CELL:+{phone}
END:VCARD
"""

def txt_to_vcf(txt_path: str, vcf_path: str, contact_name: str):
    """Convert TXT file to VCF"""
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract phone numbers
        numbers = re.findall(r'[\d\+\-\(\) ]+', content)
        numbers = [re.sub(r'\D', '', n) for n in numbers]
        numbers = [n for n in numbers if n and len(n) >= 7]
        
        if not numbers:
            return False, "Tidak ada nomor yang ditemukan"
        
        # Create VCF
        vcf_content = ""
        for i, num in enumerate(numbers, 1):
            name = f"{contact_name} {i}"
            vcf_entry = create_vcf_entry(num, name)
            if vcf_entry:
                vcf_content += vcf_entry + "\n"
        
        with open(vcf_path, 'w', encoding='utf-8') as f:
            f.write(vcf_content)
        
        return True, f"Berhasil convert {len(numbers)} nomor"
    except Exception as e:
        return False, str(e)

def vcf_to_txt(vcf_path: str, txt_path: str):
    """Convert VCF file to TXT"""
    try:
        numbers = []
        
        with open(vcf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract phone numbers from TEL fields
        tel_matches = re.findall(r'TEL[^:]*:(\+?\d+)', content)
        numbers = list(set(tel_matches))  # Remove duplicates
        
        if not numbers:
            return False, "Tidak ada nomor yang ditemukan"
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(numbers))
        
        return True, f"Berhasil extract {len(numbers)} nomor"
    except Exception as e:
        return False, str(e)

def xls_to_vcf(xls_path: str, vcf_path: str, contact_name: str):
    """Convert XLSX file to VCF"""
    try:
        wb = load_workbook(xls_path)
        ws = wb.active
        
        numbers = []
        for row in ws.iter_rows(min_row=1):
            for cell in row:
                if cell.value:
                    num = re.sub(r'\D', '', str(cell.value))
                    if num and len(num) >= 7:
                        numbers.append(num)
        
        if not numbers:
            return False, "Tidak ada nomor di file XLSX"
        
        vcf_content = ""
        for i, num in enumerate(numbers, 1):
            name = f"{contact_name} {i}"
            vcf_entry = create_vcf_entry(num, name)
            if vcf_entry:
                vcf_content += vcf_entry + "\n"
        
        with open(vcf_path, 'w', encoding='utf-8') as f:
            f.write(vcf_content)
        
        return True, f"Berhasil convert {len(numbers)} nomor dari XLSX"
    except Exception as e:
        return False, str(e)

def clean_txt(txt_path: str) -> tuple:
    """Clean and sort TXT file (remove duplicates, trim whitespace)"""
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Clean and deduplicate
        numbers = set()
        for line in lines:
            num = re.sub(r'\D', '', line.strip())
            if num and len(num) >= 7:
                numbers.add(num)
        
        # Sort
        numbers = sorted(numbers)
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(numbers))
        
        return True, f"Berhasil rapikan {len(numbers)} nomor"
    except Exception as e:
        return False, str(e)

def count_contacts(file_path: str) -> tuple:
    """Count contacts in VCF or TXT file"""
    try:
        if file_path.endswith('.vcf'):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            count = len(re.findall(r'BEGIN:VCARD', content))
        elif file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            count = len([l for l in lines if l.strip()])
        else:
            return False, "Format tidak didukung"
        
        return True, f"Total: {count} kontak"
    except Exception as e:
        return False, str(e)

def split_vcf(vcf_path: str, output_dir: str, chunk_size: int = 100):
    """Split VCF file into multiple files"""
    try:
        with open(vcf_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        vcards = re.split(r'(?=BEGIN:VCARD)', content)
        vcards = [v.strip() for v in vcards if v.strip()]
        
        files = []
        for i in range(0, len(vcards), chunk_size):
            chunk = vcards[i:i+chunk_size]
            file_num = (i // chunk_size) + 1
            output_file = os.path.join(output_dir, f"split_{file_num}.vcf")
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(chunk))
            
            files.append(output_file)
        
        return True, files
    except Exception as e:
        return False, str(e)
