
-- Buat Database
CREATE DATABASE IF NOT EXISTS sipatu_grosel;
USE sipatu_grosel;

-- 1. Tabel Users (Untuk Login)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Di produksi gunakan hash password!
    name VARCHAR(200),
    email VARCHAR(200),
    nik VARCHAR(20),
    role ENUM('Administrator', 'Admin', 'Pimpinan', 'Staff Kelurahan', 'Operator', 'RW', 'LMK', 'PPSU', 'RT', 'FKDM', 'POSYANDU', 'PKK', 'Karang Taruna', 'Warga') NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Citizens (Data Warga)
CREATE TABLE IF NOT EXISTS citizens (
    id VARCHAR(50) PRIMARY KEY,
    nik VARCHAR(20) UNIQUE NOT NULL,
    kk VARCHAR(20) NOT NULL,
    nama_lengkap VARCHAR(200) NOT NULL,
    jenis_kelamin ENUM('Laki-Laki', 'Perempuan'),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    agama VARCHAR(50),
    status_perkawinan VARCHAR(50),
    golongan_darah VARCHAR(5),
    pekerjaan VARCHAR(100),
    nomor_whatsapp VARCHAR(20),
    foto_wajah TEXT,
    alamat TEXT,
    rt VARCHAR(5),
    rw VARCHAR(5),
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kota VARCHAR(100),
    provinsi VARCHAR(100),
    status_ktp VARCHAR(50),
    asal_provinsi VARCHAR(100),
    kewarganegaraan VARCHAR(50),
    status_kematian VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Staff (PPSU & Pegawai)
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(50) PRIMARY KEY,
    nik VARCHAR(20) UNIQUE NOT NULL,
    nomor_anggota VARCHAR(50),
    nama_lengkap VARCHAR(200),
    jenis_kelamin ENUM('Laki-Laki', 'Perempuan'),
    alamat_lengkap TEXT,
    nomor_whatsapp VARCHAR(20),
    foto_profile TEXT,
    status ENUM('Online', 'Bertugas', 'Standby', 'Offline') DEFAULT 'Offline',
    total_tugas_berhasil INT DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    tanggal_masuk DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Reports (Laporan Warga / CRM)
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(50) PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE,
    title VARCHAR(200),
    description TEXT,
    category VARCHAR(100),
    reporter_name VARCHAR(200),
    reporter_nik VARCHAR(20),
    reporter_phone VARCHAR(20),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50),
    timestamp DATETIME,
    photo_url TEXT,
    photo_arrival TEXT,
    photo_completion TEXT,
    photo_revision TEXT,
    priority ENUM('High', 'Medium', 'Low'),
    rejection_reason TEXT,
    estimation_time VARCHAR(100),
    assigned_staff_ids JSON, -- Menyimpan array ID staff
    logs JSON, -- Menyimpan history log status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Service Requests (Layanan Surat)
CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR(50) PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE,
    rt_letter_number VARCHAR(100),
    letter_number VARCHAR(100),
    request_date DATETIME,
    completion_date DATETIME,
    type VARCHAR(100),
    applicant_nik VARCHAR(20),
    applicant_name VARCHAR(200),
    applicant_phone VARCHAR(20),
    status VARCHAR(50),
    notes TEXT,
    documents JSON, -- Array URL dokumen pendukung
    signed_letter_url TEXT,
    verification_code VARCHAR(100),
    logs JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Service Ratings (Kepuasan Masyarakat)
CREATE TABLE IF NOT EXISTS service_ratings (
    id VARCHAR(50) PRIMARY KEY,
    ticket_number VARCHAR(50),
    rating VARCHAR(50),
    service_type VARCHAR(100),
    timestamp DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Settings (Pengaturan Sistem)
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(50) PRIMARY KEY,
    system_name VARCHAR(200),
    sub_name VARCHAR(200),
    footer_text VARCHAR(200),
    app_version VARCHAR(20),
    theme_color VARCHAR(20),
    logo TEXT, -- Base64 atau URL
    login_background TEXT, -- Base64 atau URL
    anjungan_background TEXT, -- Base64 atau URL
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Tabel RW (Rukun Warga)
CREATE TABLE IF NOT EXISTS rw (
    id VARCHAR(50) PRIMARY KEY,
    no_rw VARCHAR(10) NOT NULL UNIQUE,
    ketua_rw_name VARCHAR(200),
    ketua_rw_phone VARCHAR(20),
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel RT (Rukun Tetangga)
CREATE TABLE IF NOT EXISTS rt (
    id VARCHAR(50) PRIMARY KEY,
    no_rt VARCHAR(10) NOT NULL,
    rw_id VARCHAR(50) NOT NULL, -- Foreign key to RW.id
    ketua_rt_name VARCHAR(200),
    ketua_rt_phone VARCHAR(20),
    kk_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rw_id) REFERENCES rw(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rt_rw (no_rt, rw_id)
);

-- 10. Tabel LMK (Lembaga Musyawarah Kelurahan)
CREATE TABLE IF NOT EXISTS lmk (
    id VARCHAR(50) PRIMARY KEY,
    rw_id VARCHAR(50) UNIQUE NOT NULL, -- One LMK per RW
    nama_lengkap VARCHAR(200),
    nik VARCHAR(20),
    phone VARCHAR(20),
    periode_jabatan VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rw_id) REFERENCES rw(id) ON DELETE CASCADE
);

-- Seed Demo Data

-- Seed RW
INSERT INTO rw (id, no_rw, ketua_rw_name, ketua_rw_phone, location) VALUES
('RW-01', '01', 'Budi Santoso', '081234567801', 'Jl. Panjang No. 1'),
('RW-02', '02', 'Slamet Riyadi', '081234567802', 'Jl. Kebayoran Lama No. 2'),
('RW-03', '03', 'Agus Salim', '081234567803', 'Jl. Ciledug Raya No. 3');

-- Seed RT for RW 01
INSERT INTO rt (id, no_rt, rw_id, ketua_rt_name, ketua_rt_phone, kk_count) VALUES
('RT-01-01', '001', 'RW-01', 'RT Satu', '0811111111', 45),
('RT-01-02', '002', 'RW-01', 'RT Dua', '0811111112', 50),
('RT-01-03', '003', 'RW-01', 'RT Tiga', '0811111113', 48);

-- Seed RT for RW 02
INSERT INTO rt (id, no_rt, rw_id, ketua_rt_name, ketua_rt_phone, kk_count) VALUES
('RT-02-01', '001', 'RW-02', 'RT Empat', '0811111114', 60),
('RT-02-02', '002', 'RW-02', 'RT Lima', '0811111115', 55);

-- Seed LMK for RW 01 & 02
INSERT INTO lmk (id, rw_id, nama_lengkap, nik, phone, periode_jabatan) VALUES
('LMK-01', 'RW-01', 'H. Abdullah', '317400000001', '081333333331', '2024-2029'),
('LMK-02', 'RW-02', 'Hj. Siti', '317400000002', '081333333332', '2024-2029');

-- Users
INSERT INTO users (id, username, password, name, email, nik, role, avatar) VALUES
('USR-ADMIN-001', 'admin', '123', 'Super Administrator', 'admin@grosel.id', '3174xxxxxxxxxxxx', 'Administrator', 'https://ui-avatars.com/api/?name=Super+Admin&background=random'),
('USR-LURAH-001', 'lurah', '123', 'Bapak Lurah', 'lurah@grosel.id', '3174xxxxxxxxxx01', 'Pimpinan', 'https://ui-avatars.com/api/?name=Bapak+Lurah&background=random'),
('USR-STAFF-001', 'staff_pelayanan', '123', 'Staff Pelayanan', 'staff@grosel.id', '3174xxxxxxxxxx02', 'Staff Kelurahan', 'https://ui-avatars.com/api/?name=Staff+Pelayanan&background=random'),
('USR-RW-01', 'rw01', '123', 'Ketua RW 01', 'rw01@grosel.id', '3174xxxxxxxxxx03', 'RW', 'https://ui-avatars.com/api/?name=Ketua+RW&background=random'),
('USR-PPSU-001', 'ppsu001', '123', 'Budi Santoso', NULL, '3174010101011001', 'PPSU', 'https://ui-avatars.com/api/?name=Budi+Santoso&background=random'),
('USR-WARGA-001', 'gs-0001', '3174010101010001', 'Ahmad Warga', 'warga@example.com', '3174010101010001', 'Warga', 'https://ui-avatars.com/api/?name=Ahmad+Warga&background=random')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- Citizens (Warga)
INSERT INTO citizens (id, nik, kk, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, status_perkawinan, golongan_darah, pekerjaan, nomor_whatsapp, foto_wajah, alamat, rt, rw, kelurahan, kecamatan, kota, provinsi, status_ktp, kewarganegaraan, status_kematian, latitude, longitude)
VALUES
('CIT-001', '3174010101010001', '3174010101010001', 'Ahmad Warga', 'Laki-Laki', 'Jakarta', '1990-01-01', 'Islam', 'Belum Kawin', 'O', 'Karyawan Swasta', '081234567890', 'https://ui-avatars.com/api/?name=Ahmad+Warga&background=random', 'Jl. Kebayoran Lama No. 10', '01', '01', 'Grogol Selatan', 'Kebayoran Lama', 'Jakarta Selatan', 'DKI Jakarta', 'KTP DKI', 'WNI', 'Hidup', -6.2250, 106.7820),
('CIT-002', '3174010101010002', '3174010101010002', 'Siti Aminah', 'Perempuan', 'Bandung', '1992-05-15', 'Islam', 'Kawin', 'A', 'Ibu Rumah Tangga', '081234567891', 'https://ui-avatars.com/api/?name=Siti+Aminah&background=random', 'Jl. Panjang No. 5', '02', '01', 'Grogol Selatan', 'Kebayoran Lama', 'Jakarta Selatan', 'DKI Jakarta', 'KTP DKI', 'WNI', 'Hidup', -6.2260, 106.7830),
('CIT-003', '3174010101010003', '3174010101010003', 'Budi Santoso', 'Laki-Laki', 'Surabaya', '1985-08-17', 'Islam', 'Kawin', 'B', 'Wiraswasta', '081234567892', 'https://ui-avatars.com/api/?name=Budi+Santoso&background=random', 'Jl. Ciledug Raya No. 88', '03', '02', 'Grogol Selatan', 'Kebayoran Lama', 'Jakarta Selatan', 'DKI Jakarta', 'KTP DKI', 'WNI', 'Hidup', -6.2270, 106.7840),
('CIT-004', '3174010101010004', '3174010101010004', 'Dewi Sartika', 'Perempuan', 'Yogyakarta', '1995-12-22', 'Kristen', 'Belum Kawin', 'AB', 'Mahasiswa', '081234567893', 'https://ui-avatars.com/api/?name=Dewi+Sartika&background=random', 'Jl. Simprug Golf No. 12', '01', '03', 'Grogol Selatan', 'Kebayoran Lama', 'Jakarta Selatan', 'DKI Jakarta', 'KTP DKI', 'WNI', 'Hidup', -6.2280, 106.7850),
('CIT-005', '3174010101010005', '3174010101010005', 'Eko Prasetyo', 'Laki-Laki', 'Semarang', '1980-03-10', 'Islam', 'Cerai Hidup', 'O', 'Buruh Harian', '081234567894', 'https://ui-avatars.com/api/?name=Eko+Prasetyo&background=random', 'Jl. Tentara Pelajar No. 45', '05', '04', 'Grogol Selatan', 'Kebayoran Lama', 'Jakarta Selatan', 'DKI Jakarta', 'KTP DKI', 'WNI', 'Hidup', -6.2290, 106.7860)
ON DUPLICATE KEY UPDATE nama_lengkap=VALUES(nama_lengkap);

-- Staff (PPSU)
INSERT INTO staff (id, nik, nomor_anggota, nama_lengkap, jenis_kelamin, alamat_lengkap, nomor_whatsapp, foto_profile, status, total_tugas_berhasil, latitude, longitude, tanggal_masuk)
VALUES
('STF-001', '3174010101011001', 'PPSU-001', 'Budi Santoso', 'Laki-Laki', 'Jl. Panjang No. 12', '081299999991', 'https://ui-avatars.com/api/?name=Budi+Santoso&background=random', 'Bertugas', 15, -6.2255, 106.7825, '2024-01-10'),
('STF-002', '3174010101011002', 'PPSU-002', 'Joko Widodo', 'Laki-Laki', 'Jl. Kebayoran Lama No. 5', '081299999992', 'https://ui-avatars.com/api/?name=Joko+Widodo&background=random', 'Standby', 8, -6.2265, 106.7835, '2024-03-20'),
('STF-003', '3174010101011003', 'PPSU-003', 'Siti Nurhaliza', 'Perempuan', 'Jl. Ciledug Raya No. 99', '081299999993', 'https://ui-avatars.com/api/?name=Siti+Nurhaliza&background=random', 'Online', 20, -6.2275, 106.7845, '2023-11-05'),
('STF-004', '3174010101011004', 'PPSU-004', 'Rudi Hartono', 'Laki-Laki', 'Jl. Simprug No. 2', '081299999994', 'https://ui-avatars.com/api/?name=Rudi+Hartono&background=random', 'Offline', 5, -6.2285, 106.7855, '2024-05-01'),
('STF-005', '3174010101011005', 'PPSU-005', 'Mega Wati', 'Perempuan', 'Jl. Tentara Pelajar No. 8', '081299999995', 'https://ui-avatars.com/api/?name=Mega+Wati&background=random', 'Bertugas', 12, -6.2295, 106.7865, '2024-02-15')
ON DUPLICATE KEY UPDATE nama_lengkap=VALUES(nama_lengkap);

-- Reports (Laporan)
INSERT INTO reports (id, ticket_number, title, description, category, reporter_name, reporter_nik, reporter_phone, location, latitude, longitude, status, timestamp, photo_url, priority, rejection_reason, estimation_time, assigned_staff_ids, logs)
VALUES
('RPT-001', 'CRM-0001', 'Sampah Menumpuk di Saluran Air', 'Ada tumpukan sampah plastik yang menyumbat saluran air di depan Gang 2.', 'Kebersihan', 'Ahmad Warga', '3174010101010001', '081234567890', 'RT 01/RW 01', -6.2251, 106.7821, 'Sedang Dikerjakan', '2026-02-20 08:00:00', 'https://placehold.co/600x400?text=Sampah', 'High', NULL, '2 jam', JSON_ARRAY('STF-001'), JSON_ARRAY(JSON_OBJECT('status','Laporan Baru','timestamp','2026-02-20T08:00:00Z'), JSON_OBJECT('status','Sedang Dikerjakan','timestamp','2026-02-20T08:30:00Z'))),
('RPT-002', 'CRM-0002', 'Lampu Jalan Mati', 'Lampu penerangan jalan di perempatan Jl. Panjang mati total sudah 2 hari.', 'PJU', 'Siti Aminah', '3174010101010002', '081234567891', 'RT 02/RW 01', -6.2261, 106.7831, 'Menunggu Petugas', '2026-02-19 19:00:00', 'https://placehold.co/600x400?text=Lampu+Mati', 'Medium', NULL, NULL, JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('status','Laporan Baru','timestamp','2026-02-19T19:00:00Z'))),
('RPT-003', 'CRM-0003', 'Pohon Tumbang Menutup Jalan', 'Ada pohon besar tumbang akibat hujan deras semalam.', 'Bencana Alam', 'Budi Santoso', '3174010101010003', '081234567892', 'RT 03/RW 02', -6.2271, 106.7841, 'Laporan Selesai', '2026-02-18 14:00:00', 'https://placehold.co/600x400?text=Pohon+Tumbang', 'High', NULL, '4 jam', JSON_ARRAY('STF-001', 'STF-003'), JSON_ARRAY(JSON_OBJECT('status','Laporan Baru','timestamp','2026-02-18T14:00:00Z'), JSON_OBJECT('status','Laporan Selesai','timestamp','2026-02-18T18:00:00Z'))),
('RPT-004', 'CRM-0004', 'Jalan Berlubang', 'Lubang cukup dalam di tengah jalan, membahayakan pengendara motor.', 'Jalan', 'Dewi Sartika', '3174010101010004', '081234567893', 'RT 01/RW 03', -6.2281, 106.7851, 'Laporan Baru', '2026-02-20 09:15:00', 'https://placehold.co/600x400?text=Jalan+Berlubang', 'Medium', NULL, NULL, JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('status','Laporan Baru','timestamp','2026-02-20T09:15:00Z'))),
('RPT-005', 'CRM-0005', 'Vandalisme di Tembok Kelurahan', 'Coretan tidak senonoh di tembok pagar kelurahan.', 'Ketertiban', 'Eko Prasetyo', '3174010101010005', '081234567894', 'RT 05/RW 04', -6.2291, 106.7861, 'Ditolak', '2026-02-17 10:00:00', 'https://placehold.co/600x400?text=Vandalisme', 'Low', 'Laporan Ganda', NULL, JSON_ARRAY(), JSON_ARRAY(JSON_OBJECT('status','Laporan Baru','timestamp','2026-02-17T10:00:00Z'), JSON_OBJECT('status','Ditolak','timestamp','2026-02-17T11:00:00Z')))
ON DUPLICATE KEY UPDATE title=VALUES(title), status=VALUES(status);

-- Service Requests (Layanan Surat)
INSERT INTO service_requests (id, ticket_number, rt_letter_number, letter_number, request_date, completion_date, type, applicant_nik, applicant_name, applicant_phone, status, notes, documents, signed_letter_url, verification_code, logs)
VALUES
('SRV-001', 'SRV-0001', 'RT/01/2026', '470/001/GS/2026', '2026-02-17 09:00:00', '2026-02-18 10:00:00', 'Surat Keterangan Umum', '3174010101010001', 'Ahmad Warga', '081234567890', 'Selesai', 'Keperluan administrasi bank', JSON_ARRAY(), 'https://placehold.co/600x800?text=Surat+Selesai', 'VERIF-001', JSON_ARRAY(JSON_OBJECT('status','Pengajuan Baru','timestamp','2026-02-17T09:00:00Z'), JSON_OBJECT('status','Selesai','timestamp','2026-02-18T10:00:00Z'))),
('SRV-002', 'SRV-0002', 'RT/02/2026', NULL, '2026-02-19 14:00:00', NULL, 'Surat Keterangan Usaha (SKU)', '3174010101010002', 'Siti Aminah', '081234567891', 'Verifikasi', 'Membuka warung makan', JSON_ARRAY(), NULL, NULL, JSON_ARRAY(JSON_OBJECT('status','Pengajuan Baru','timestamp','2026-02-19T14:00:00Z'), JSON_OBJECT('status','Verifikasi','timestamp','2026-02-19T15:00:00Z'))),
('SRV-003', 'SRV-0003', 'RT/03/2026', NULL, '2026-02-20 08:30:00', NULL, 'Surat Keterangan Domisili', '3174010101010003', 'Budi Santoso', '081234567892', 'Pengajuan Baru', 'Pindah alamat', JSON_ARRAY(), NULL, NULL, JSON_ARRAY(JSON_OBJECT('status','Pengajuan Baru','timestamp','2026-02-20T08:30:00Z'))),
('SRV-004', 'SRV-0004', 'RT/04/2026', NULL, '2026-02-20 10:00:00', NULL, 'Surat Keterangan Tidak Mampu', '3174010101010005', 'Eko Prasetyo', '081234567894', 'Ditolak', 'Data tidak lengkap', JSON_ARRAY(), NULL, NULL, JSON_ARRAY(JSON_OBJECT('status','Pengajuan Baru','timestamp','2026-02-20T10:00:00Z'), JSON_OBJECT('status','Ditolak','timestamp','2026-02-20T10:30:00Z')))
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Service Ratings
INSERT INTO service_ratings (id, ticket_number, rating, service_type, timestamp)
VALUES
('RAT-001', 'SRV-0001', 'Sangat Baik', 'Surat Keterangan Umum', '2026-02-18 12:00:00'),
('RAT-002', 'SRV-0005', 'Baik', 'Surat Keterangan Usaha (SKU)', '2026-02-18 13:00:00'),
('RAT-003', 'SRV-0006', 'Cukup', 'Surat Keterangan Domisili', '2026-02-17 15:00:00')
ON DUPLICATE KEY UPDATE rating=VALUES(rating);

-- Settings
INSERT INTO settings (id, system_name, sub_name, footer_text, app_version, theme_color, logo, login_background, anjungan_background)
VALUES ('SET-001', 'SIPATU GROSEL', 'Kelurahan Grogol Selatan', '© 2026 Kelurahan Grogol Selatan. All Rights Reserved.', '1.0.0', '#f97316', NULL, NULL, 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2000')
ON DUPLICATE KEY UPDATE system_name=VALUES(system_name);
