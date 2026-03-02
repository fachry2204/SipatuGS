
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Limit besar untuk upload base64 image
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// --- ENCRYPTION SETUP ---
// For demo purposes, we use a fixed key. In production, this should be in .env
// Key must be 32 bytes (256 bits)
const ENCRYPTION_KEY = Buffer.from('e8f32a7604102983745298104728374652910384756291028374652910384756', 'hex'); 
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(String(text));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        console.error("Encrypt error", e);
        return text;
    }
}

function decrypt(text) {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        if (textParts.length < 2) return text; // Not encrypted
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        // console.error("Decrypt error (might be plaintext)", e);
        return text; // Return original if fail (e.g. old plaintext data)
    }
}

// Deterministic Hash for Lookup (NIK, Username)
function hash(text) {
    if (!text) return text;
    return crypto.createHash('sha256').update(String(text)).digest('hex');
}

// --- ROUTES ---

// 0. HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 0b. LOGIN
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body;
    try {
        // 1. Try Direct Lookup (Username / Email / Hashed NIK as Username)
        const nikHash = hash(identifier);
        
        let sql = `SELECT * FROM users WHERE username = ? OR email = ? OR username = ?`;
        let [rows] = await db.query(sql, [identifier, identifier, nikHash]);
        
        let user = null;

        if (rows.length > 0) {
            user = rows[0];
        } else {
            // 2. Fallback: Search by Decrypted NIK (Slow but necessary for encrypted NIKs without hash index)
            // Fetch all users with role 'Warga' or just all users?
            // To be safe, fetch all. Optimization: Filter by role if needed.
            const [allUsers] = await db.query('SELECT * FROM users');
            user = allUsers.find(u => {
                const decryptedNik = decrypt(u.nik);
                return decryptedNik === identifier;
            });
        }

        if (!user) {
            return res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
        }

        // 3. Role Validation for Warga (Must use NIK)
        // If the user is Warga, we ensure they used their NIK (identifier matched NIK or Hash(NIK))
        // But if they used Username 'gs-0001' which is NOT NIK, should we block?
        // User request: "buat agar role warga login memakai niknya bukan username"
        // This implies enforcing NIK login.
        if (user.role === 'Warga') {
             const decryptedNik = decrypt(user.nik);
             if (identifier !== decryptedNik) {
                 // Check if identifier is the username (e.g. hashed NIK), which is allowed if it maps to NIK
                 // But typically user types "123456".
                 // If identifier == "123456" and decryptedNik == "123456", we are good.
                 // If identifier == "gs-0001" (old username), we might want to block or allow?
                 // The prompt says "login memakai niknya bukan username".
                 // So we should enforce identifier === decryptedNik.
                 // But wait, if we found them via `username = hash(identifier)`, then identifier IS the NIK.
                 // So we just need to verify that identifier matches the NIK.
                 if (identifier !== decryptedNik) {
                     return res.status(401).json({ error: 'Khusus Warga, silakan login menggunakan NIK.' });
                 }
             }
        }

        // 4. Password Check
        let passwordIsValid = false;
        // Check if password looks like a Bcrypt hash (starts with $2a$, $2b$, $2y$)
        if (user.password.startsWith('$2')) {
            // Bcrypt
            passwordIsValid = await bcrypt.compare(password, user.password);
        } else {
            // Plaintext
            passwordIsValid = (user.password === password);
            
            // Optional: Upgrade to Bcrypt automatically
            if (passwordIsValid) {
                const newHash = await bcrypt.hash(password, 10);
                await db.query('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
            }
        }

        if (!passwordIsValid) {
            return res.status(401).json({ error: 'Password salah.' });
        }

        // 5. Return User Data (Sanitized)
        const userData = {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            nik: decrypt(user.nik),
            role: user.role,
            avatar: user.avatar
        };
        
        res.json(userData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 1. GET ALL REPORTS
app.get('/api/reports', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM reports ORDER BY timestamp DESC');
        // Parse JSON fields
        const reports = rows.map(r => ({
            ...r,
            assignedStaffIds: r.assigned_staff_ids, // Map snake_case db to camelCase js
            logs: r.logs,
            gpsArrival: r.gps_arrival ? JSON.parse(r.gps_arrival) : undefined
        }));
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. CREATE REPORT
app.post('/api/reports', async (req, res) => {
    const r = req.body;
    try {
        const sql = `
            INSERT INTO reports (id, ticket_number, title, description, category, reporter_name, reporter_nik, reporter_phone, location, latitude, longitude, status, timestamp, photo_url, priority, logs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            r.id, r.ticketNumber, r.title, r.description, r.category, r.reporterName, r.reporterNik, r.reporterPhone, r.location, r.latitude, r.longitude, r.status, r.timestamp, r.photoUrl, r.priority, JSON.stringify(r.logs)
        ]);
        res.status(201).json({ message: 'Report created', data: r });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. UPDATE REPORT STATUS
app.put('/api/reports/:id', async (req, res) => {
    const { id } = req.params;
    const r = req.body; // Updated report object
    try {
        const sql = `
            UPDATE reports SET 
            status = ?, logs = ?, photo_arrival = ?, photo_completion = ?, photo_revision = ?, 
            rejection_reason = ?, assigned_staff_ids = ?, estimation_time = ?
            WHERE id = ?
        `;
        await db.query(sql, [
            r.status, JSON.stringify(r.logs), r.photoArrival, r.photoCompletion, r.photoRevision,
            r.rejectionReason, JSON.stringify(r.assignedStaffIds), r.estimationTime, id
        ]);
        res.json({ message: 'Report updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3b. GET SINGLE REPORT
app.get('/api/reports/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM reports WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const r = rows[0];
        const report = {
            ...r,
            assignedStaffIds: r.assigned_staff_ids,
            logs: r.logs,
            gpsArrival: r.gps_arrival ? JSON.parse(r.gps_arrival) : undefined
        };
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. GET CITIZENS
app.get('/api/citizens', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM citizens ORDER BY nama_lengkap ASC');
        const citizens = rows.map(c => ({
            id: c.id,
            nik: decrypt(c.nik), // Decrypt
            kk: decrypt(c.kk), // Decrypt
            namaLengkap: c.nama_lengkap,
            jenisKelamin: c.jenis_kelamin,
            tempatLahir: c.tempat_lahir,
            tanggalLahir: decrypt(c.tanggal_lahir), // Decrypt
            agama: c.agama,
            statusPerkawinan: c.status_perkawinan,
            golonganDarah: c.golongan_darah,
            pekerjaan: c.pekerjaan,
            nomorWhatsapp: decrypt(c.nomor_whatsapp), // Decrypt
            fotoWajah: c.foto_wajah,
            alamat: decrypt(c.alamat), // Decrypt
            rt: c.rt,
            rw: c.rw,
            kelurahan: c.kelurahan,
            kecamatan: c.kecamatan,
            kota: c.kota,
            provinsi: c.provinsi,
            statusKtp: c.status_ktp,
            asalProvinsi: c.asal_provinsi,
            kewarganegaraan: c.kewarganegaraan,
            statusKematian: c.status_kematian,
            latitude: c.latitude,
            longitude: c.longitude
        }));
        res.json(citizens);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 5. CREATE CITIZEN
app.post('/api/citizens', async (req, res) => {
    const c = req.body;
    try {
        // Encrypt sensitive fields
        const encryptedNik = encrypt(c.nik);
        const encryptedKk = encrypt(c.kk);
        const encryptedWa = encrypt(c.nomorWhatsapp);
        const encryptedAlamat = encrypt(c.alamat);
        const encryptedTgl = encrypt(c.tanggalLahir);

        const sql = `
            INSERT INTO citizens (id, nik, kk, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, status_perkawinan, golongan_darah, pekerjaan, nomor_whatsapp, foto_wajah, alamat, rt, rw, kelurahan, kecamatan, kota, provinsi, status_ktp, asal_provinsi, kewarganegaraan, status_kematian, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            c.id, encryptedNik, encryptedKk, c.namaLengkap, c.jenisKelamin, c.tempatLahir, encryptedTgl, c.agama, c.statusPerkawinan, c.golonganDarah, c.pekerjaan, encryptedWa, c.fotoWajah, encryptedAlamat, c.rt, c.rw, c.kelurahan, c.kecamatan, c.kota, c.provinsi, c.statusKtp, c.asalProvinsi, c.kewarganegaraan, c.statusKematian, c.latitude, c.longitude
        ]);

        // AUTOMATIC ACCOUNT CREATION FOR WARGA
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [hash(c.nik)]);
        
        if (existingUsers.length === 0) {
            const userId = `USR-${Date.now()}`;
            const username = hash(c.nik); // Hashed NIK as Username
            const password = await bcrypt.hash(c.nik, 10); // NIK as Password (Hashed)
            
            const userSql = `
                INSERT INTO users (id, username, password, name, email, nik, role, avatar)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            // Note: We store Encrypted NIK in 'nik' column for retrieval
            await db.query(userSql, [
                userId, username, password, c.namaLengkap, null, encryptedNik, 'Warga', c.fotoWajah
            ]);
            console.log(`Auto-created user account for ${c.namaLengkap}`);
        }

        res.status(201).json({ message: 'Citizen created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 5b. UPDATE CITIZEN
app.put('/api/citizens/:id', async (req, res) => {
    const { id } = req.params;
    const c = req.body;
    try {
        // 1. Get old data to identify the user (BEFORE update)
        const [oldRows] = await db.query('SELECT nik FROM citizens WHERE id = ?', [id]);
        let oldNik = null;
        if (oldRows.length > 0) {
            oldNik = decrypt(oldRows[0].nik);
        }

        // Encrypt sensitive fields
        const encryptedNik = encrypt(c.nik);
        const encryptedKk = encrypt(c.kk);
        const encryptedWa = encrypt(c.nomorWhatsapp);
        const encryptedAlamat = encrypt(c.alamat);
        const encryptedTgl = encrypt(c.tanggalLahir);

        const sql = `
            UPDATE citizens SET 
            nik = ?, kk = ?, nama_lengkap = ?, jenis_kelamin = ?, tempat_lahir = ?, tanggal_lahir = ?, agama = ?, status_perkawinan = ?, golongan_darah = ?, pekerjaan = ?, nomor_whatsapp = ?, foto_wajah = ?, alamat = ?, rt = ?, rw = ?, kelurahan = ?, kecamatan = ?, kota = ?, provinsi = ?, status_ktp = ?, asal_provinsi = ?, kewarganegaraan = ?, status_kematian = ?, latitude = ?, longitude = ?
            WHERE id = ?
        `;
        await db.query(sql, [
            encryptedNik, encryptedKk, c.namaLengkap, c.jenisKelamin, c.tempatLahir, encryptedTgl, c.agama, c.statusPerkawinan, c.golonganDarah, c.pekerjaan, encryptedWa, c.fotoWajah, encryptedAlamat, c.rt, c.rw, c.kelurahan, c.kecamatan, c.kota, c.provinsi, c.statusKtp, c.asalProvinsi, c.kewarganegaraan, c.statusKematian, c.latitude, c.longitude, id
        ]);
        
        // 2. Update associated User account
        if (oldNik) {
             const oldUsernameHash = hash(oldNik);
             const newUsernameHash = hash(c.nik);
             
             // Update User where username matches old NIK hash AND role is Warga
             // We update: username (new NIK hash), nik (new Encrypted NIK), name, avatar
             await db.query(
                 `UPDATE users SET username = ?, nik = ?, name = ?, avatar = ? WHERE username = ? AND role = 'Warga'`,
                 [newUsernameHash, encryptedNik, c.namaLengkap, c.fotoWajah, oldUsernameHash]
             );
        }

        res.json({ message: 'Citizen updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5c. DELETE CITIZEN
app.delete('/api/citizens/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get citizen to find NIK
        const [rows] = await db.query('SELECT nik FROM citizens WHERE id = ?', [id]);
        if (rows.length > 0) {
            const nikEncrypted = rows[0].nik;
            const nik = decrypt(nikEncrypted);
            const usernameHash = hash(nik);

            // 2. Delete User
            await db.query("DELETE FROM users WHERE username = ? AND role = 'Warga'", [usernameHash]);
        }

        // 3. Delete Citizen
        await db.query('DELETE FROM citizens WHERE id = ?', [id]);
        
        res.json({ message: 'Citizen and associated User account deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. GET STAFF
app.get('/api/staff', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM staff');
        const staff = rows.map(s => ({
            id: s.id,
            nik: s.nik, // Encrypted? Not yet migrated to encrypt staff NIK, but good to be consistent. Assuming Plaintext for now or migrating later.
            nomorAnggota: s.nomor_anggota,
            namaLengkap: s.nama_lengkap,
            jenisKelamin: s.jenis_kelamin,
            status: s.status,
            fotoProfile: s.foto_profile,
            alamatLengkap: s.alamat_lengkap,
            nomorWhatsapp: s.nomor_whatsapp,
            latitude: s.latitude,
            longitude: s.longitude,
            totalTugasBerhasil: s.total_tugas_berhasil,
            tanggalMasuk: s.tanggal_masuk
        }));
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6b. CREATE STAFF
app.post('/api/staff', async (req, res) => {
    const s = req.body;
    try {
        const sql = `
            INSERT INTO staff (id, nik, nomor_anggota, nama_lengkap, jenis_kelamin, alamat_lengkap, nomor_whatsapp, foto_profile, status, total_tugas_berhasil, latitude, longitude, tanggal_masuk)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            s.id, s.nik, s.nomorAnggota, s.namaLengkap, s.jenisKelamin, s.alamatLengkap, s.nomorWhatsapp, s.fotoProfile, s.status, s.totalTugasBerhasil, s.latitude, s.longitude, s.tanggalMasuk
        ]);
        res.status(201).json({ message: 'Staff created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6c. UPDATE STAFF
app.put('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    const s = req.body;
    try {
        const sql = `
            UPDATE staff SET 
            nik = ?, nomor_anggota = ?, nama_lengkap = ?, jenis_kelamin = ?, alamat_lengkap = ?, nomor_whatsapp = ?, foto_profile = ?, status = ?, total_tugas_berhasil = ?, latitude = ?, longitude = ?, tanggal_masuk = ?
            WHERE id = ?
        `;
        await db.query(sql, [
            s.nik, s.nomorAnggota, s.namaLengkap, s.jenisKelamin, s.alamatLengkap, s.nomorWhatsapp, s.fotoProfile, s.status, s.totalTugasBerhasil, s.latitude, s.longitude, s.tanggalMasuk, id
        ]);
        res.json({ message: 'Staff updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6d. DELETE STAFF
app.delete('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM staff WHERE id = ?', [id]);
        res.json({ message: 'Staff deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. GET SERVICE REQUESTS
app.get('/api/services', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM service_requests ORDER BY request_date DESC');
        const services = rows.map(s => ({
            id: s.id,
            ticketNumber: s.ticket_number,
            rtLetterNumber: s.rt_letter_number,
            letterNumber: s.letter_number,
            requestDate: s.request_date,
            completionDate: s.completion_date,
            type: s.type,
            applicantNik: s.applicant_nik,
            applicantName: s.applicant_name,
            applicantPhone: s.applicant_phone,
            status: s.status,
            notes: s.notes,
            documents: s.documents,
            signedLetterUrl: s.signed_letter_url,
            logs: s.logs
        }));
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. CREATE SERVICE REQUEST
app.post('/api/services', async (req, res) => {
    const s = req.body;
    try {
        const sql = `
            INSERT INTO service_requests (id, ticket_number, rt_letter_number, request_date, type, applicant_nik, applicant_name, applicant_phone, status, notes, documents, logs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            s.id, s.ticketNumber, s.rtLetterNumber, s.requestDate, s.type, s.applicantNik, s.applicantName, s.applicantPhone, s.status, s.notes, JSON.stringify(s.documents), JSON.stringify(s.logs)
        ]);
        res.status(201).json({ message: 'Service request created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8b. UPDATE SERVICE REQUEST
app.put('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    const s = req.body;
    try {
        const sql = `
            UPDATE service_requests SET 
            status = ?, notes = ?, documents = ?, rt_letter_number = ?, letter_number = ?, completion_date = ?, signed_letter_url = ?, verification_code = ?, logs = ?
            WHERE id = ?
        `;
        await db.query(sql, [
            s.status, s.notes, JSON.stringify(s.documents), s.rtLetterNumber, s.letterNumber, s.completionDate, s.signedLetterUrl, s.verificationCode, JSON.stringify(s.logs), id
        ]);
        res.json({ message: 'Service request updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. GET USERS
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users');
        const users = rows.map(u => ({
            id: u.id,
            username: (u.role === 'Warga') ? decrypt(u.nik) : u.username, // For Warga, show Decrypted NIK instead of Hash
            password: u.password,
            name: u.name,
            email: u.email,
            nik: decrypt(u.nik), // Decrypt NIK for display (Username replacement)
            role: u.role,
            avatar: u.avatar
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9b. CREATE USER (MANUAL)
app.post('/api/users', async (req, res) => {
    const u = req.body;
    try {
        // If Role is Warga, we should Hash Username (because it's NIK)
        let usernameToStore = u.username;
        if (u.role === 'Warga') {
             // For Warga, username MUST be Hashed NIK
             usernameToStore = hash(u.username);
        }

        // We Encrypt NIK if provided.
        const encryptedNik = u.nik ? encrypt(u.nik) : null;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(u.password, 10);

        const sql = `
            INSERT INTO users (id, username, password, name, email, nik, role, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [u.id, usernameToStore, hashedPassword, u.name, u.email, encryptedNik, u.role, u.avatar]);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9c. UPDATE USER
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const u = req.body;
    try {
        const encryptedNik = u.nik ? encrypt(u.nik) : null;
        
        // If Role is Warga, we should Hash Username (because it's NIK)
        let usernameToStore = u.username;
        if (u.role === 'Warga') {
             // For Warga, username MUST be Hashed NIK
             // Note: Frontend sends plaintext NIK as 'username' now (due to GET change)
             // So we must hash it back.
             // But check if it's already hashed? (Length check?)
             // SHA256 hex is 64 chars. NIK is 16 chars.
             if (usernameToStore.length !== 64) {
                 usernameToStore = hash(usernameToStore);
             }
        }

        // If password changed, hash it
        let password = u.password;
        if (password && !password.startsWith('$2a$')) { // Simple check if not bcrypt hash
             password = await bcrypt.hash(password, 10);
        }

        const sql = `
            UPDATE users SET 
            username = ?, password = ?, name = ?, email = ?, nik = ?, role = ?, avatar = ?
            WHERE id = ?
        `;
        await db.query(sql, [usernameToStore, password, u.name, u.email, encryptedNik, u.role, u.avatar, id]);
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9d. DELETE USER
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. SERVICE RATINGS
app.get('/api/ratings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM service_ratings ORDER BY timestamp DESC');
        const ratings = rows.map(r => ({
            id: r.id,
            ticketNumber: r.ticket_number,
            rating: r.rating,
            serviceType: r.service_type,
            timestamp: r.timestamp
        }));
        res.json(ratings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/ratings', async (req, res) => {
    const r = req.body;
    try {
        const sql = `
            INSERT INTO service_ratings (id, ticket_number, rating, service_type, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(sql, [r.id, r.ticketNumber, r.rating, r.serviceType, r.timestamp]);
        res.status(201).json({ message: 'Rating saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. GET SETTINGS
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM settings LIMIT 1');
        if (rows.length > 0) {
            const s = rows[0];
            res.json({
                systemName: s.system_name,
                subName: s.sub_name,
                footerText: s.footer_text,
                appVersion: s.app_version,
                themeColor: s.theme_color,
                logo: s.logo,
                loginBackground: s.login_background,
                anjunganBackground: s.anjungan_background
            });
        } else {
            res.json(null);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11b. UPDATE SETTINGS
app.post('/api/settings', async (req, res) => {
    const s = req.body;
    try {
        // Cek apakah sudah ada settings
        const [existing] = await db.query('SELECT id FROM settings LIMIT 1');
        
        if (existing.length > 0) {
            // Update
            const sql = `
                UPDATE settings SET 
                system_name = ?, sub_name = ?, footer_text = ?, app_version = ?, 
                theme_color = ?, logo = ?, login_background = ?, anjungan_background = ?
                WHERE id = ?
            `;
            await db.query(sql, [
                s.systemName, s.subName, s.footerText, s.appVersion, 
                s.themeColor, s.logo, s.loginBackground, s.anjunganBackground, existing[0].id
            ]);
        } else {
            // Insert
            const sql = `
                INSERT INTO settings (id, system_name, sub_name, footer_text, app_version, theme_color, logo, login_background, anjungan_background)
                VALUES ('SET-001', ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(sql, [
                s.systemName, s.subName, s.footerText, s.appVersion, s.themeColor, s.logo, s.loginBackground, s.anjunganBackground
            ]);
        }
        res.json({ message: 'Settings saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12. GET RW & RT STRUCTURE
app.get('/api/rtrw', async (req, res) => {
    try {
        const [rws] = await db.query('SELECT * FROM rw ORDER BY no_rw ASC');
        const [rts] = await db.query('SELECT * FROM rt ORDER BY no_rt ASC');

        const result = rws.map(rw => {
            const myRts = rts.filter(rt => rt.rw_id === rw.id).map(rt => ({
                id: rt.id,
                no: rt.no_rt,
                ketua: rt.ketua_rt_name,
                phone: rt.ketua_rt_phone,
                kkCount: rt.kk_count
            }));

            return {
                id: rw.id,
                no: rw.no_rw,
                ketua: rw.ketua_rw_name,
                phone: rw.ketua_rw_phone,
                location: rw.location,
                rtList: myRts
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12b. CREATE RW
app.post('/api/rw', async (req, res) => {
    const { id, no, ketua, phone, location } = req.body;
    try {
        await db.query(
            'INSERT INTO rw (id, no_rw, ketua_rw_name, ketua_rw_phone, location) VALUES (?, ?, ?, ?, ?)',
            [id, no, ketua, phone, location]
        );
        res.status(201).json({ message: 'RW Created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12c. CREATE RT
app.post('/api/rt', async (req, res) => {
    const { id, no, rwId, ketua, phone, kkCount } = req.body;
    try {
        await db.query(
            'INSERT INTO rt (id, no_rt, rw_id, ketua_rt_name, ketua_rt_phone, kk_count) VALUES (?, ?, ?, ?, ?, ?)',
            [id, no, rwId, ketua, phone, kkCount]
        );
        res.status(201).json({ message: 'RT Created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12d. UPDATE RW
app.put('/api/rw/:id', async (req, res) => {
    const { id } = req.params;
    const { no, ketua, phone, location } = req.body;
    try {
        await db.query(
            'UPDATE rw SET no_rw = ?, ketua_rw_name = ?, ketua_rw_phone = ?, location = ? WHERE id = ?',
            [no, ketua, phone, location, id]
        );
        res.json({ message: 'RW Updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12e. DELETE RW
app.delete('/api/rw/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch RW details to construct User IDs
        const [rwRows] = await db.query('SELECT no_rw FROM rw WHERE id = ?', [id]);
        if (rwRows.length === 0) return res.status(404).json({ error: 'RW Not Found' });
        
        const rwNo = rwRows[0].no_rw;
        
        // 1. Fetch all RTs for this RW to delete their users
        const [rtRows] = await db.query('SELECT no_rt FROM rt WHERE rw_id = ?', [id]);
        
        // 2. Delete Users associated with RTs
        // RT User ID format: USR-RT-{rwNo}-{rtNo} (e.g., USR-RT-01-005)
        // Wait, creating RT user uses: `USR-RT-${selectedRW.no}-${newEntry.no}` where newEntry.no is 3 digits usually but let's check creation logic.
        // In PartnerRTRWSection: `USR-RT-${selectedRW.no}-${newEntry.no}`. newEntry.no is padded to 3 chars '005'.
        // But let's be safe and try to match pattern or exact ID if we can reconstruct it.
        // Actually, we can just delete users where username matches pattern or ID matches pattern.
        // ID is safer.
        
        for (const rt of rtRows) {
            const rtUserId = `USR-RT-${rwNo}-${rt.no_rt}`; 
            await db.query('DELETE FROM users WHERE id = ?', [rtUserId]);
        }

        // 3. Delete User associated with RW
        // RW User ID format: USR-RW-{rwNo}
        const rwUserId = `USR-RW-${rwNo}`;
        await db.query('DELETE FROM users WHERE id = ?', [rwUserId]);

        // 4. Delete RW (Cascades to RT rows in DB due to foreign key, but explicit cleanup is fine)
        await db.query('DELETE FROM rw WHERE id = ?', [id]);
        
        res.json({ message: 'RW and related data deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12f. UPDATE RT
app.put('/api/rt/:id', async (req, res) => {
    const { id } = req.params;
    const { no, ketua, phone, kkCount } = req.body;
    try {
        await db.query(
            'UPDATE rt SET no_rt = ?, ketua_rt_name = ?, ketua_rt_phone = ?, kk_count = ? WHERE id = ?',
            [no, ketua, phone, kkCount, id]
        );
        res.json({ message: 'RT Updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12g. DELETE RT
app.delete('/api/rt/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch RT details to delete User
        // Need to know RW No as well to reconstruct User ID: USR-RT-{rwNo}-{rtNo}
        // Join with RW table
        const sql = `SELECT rt.no_rt, rw.no_rw FROM rt JOIN rw ON rt.rw_id = rw.id WHERE rt.id = ?`;
        const [rows] = await db.query(sql, [id]);
        
        if (rows.length > 0) {
            const { no_rt, no_rw } = rows[0];
            const rtUserId = `USR-RT-${no_rw}-${no_rt}`;
            await db.query('DELETE FROM users WHERE id = ?', [rtUserId]);
        }

        await db.query('DELETE FROM rt WHERE id = ?', [id]);
        res.json({ message: 'RT Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 13. GET LMK
app.get('/api/lmk', async (req, res) => {
    try {
        // Join with RW to get RW Number
        const sql = `
            SELECT lmk.*, rw.no_rw 
            FROM lmk 
            LEFT JOIN rw ON lmk.rw_id = rw.id 
            ORDER BY rw.no_rw ASC
        `;
        const [rows] = await db.query(sql);
        
        const result = rows.map(r => ({
            id: r.id,
            rwId: r.rw_id,
            rwNo: r.no_rw,
            nama: r.nama_lengkap,
            nik: r.nik,
            phone: r.phone,
            periode: r.periode_jabatan
        }));
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 13b. CREATE LMK
app.post('/api/lmk', async (req, res) => {
    const { id, rwId, nama, nik, phone, periode } = req.body;
    try {
        await db.query(
            'INSERT INTO lmk (id, rw_id, nama_lengkap, nik, phone, periode_jabatan) VALUES (?, ?, ?, ?, ?, ?)',
            [id, rwId, nama, nik, phone, periode]
        );
        res.status(201).json({ message: 'LMK Created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14. GET PPSU
app.get('/api/ppsu', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ppsu');
        const ppsu = rows.map(s => ({
            id: s.id,
            nik: s.nik,
            nomorAnggota: s.nomor_anggota,
            namaLengkap: s.nama_lengkap,
            jenisKelamin: s.jenis_kelamin,
            status: s.status,
            fotoProfile: s.foto_profile,
            alamatLengkap: s.alamat_lengkap,
            nomorWhatsapp: s.nomor_whatsapp,
            latitude: s.latitude,
            longitude: s.longitude,
            totalTugasBerhasil: s.total_tugas_berhasil,
            tanggalMasuk: s.tanggal_masuk
        }));
        res.json(ppsu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14b. CREATE PPSU
app.post('/api/ppsu', async (req, res) => {
    const s = req.body;
    try {
        const sql = `
            INSERT INTO ppsu (id, nik, nomor_anggota, nama_lengkap, jenis_kelamin, alamat_lengkap, nomor_whatsapp, foto_profile, status, total_tugas_berhasil, latitude, longitude, tanggal_masuk)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            s.id, s.nik, s.nomorAnggota, s.namaLengkap, s.jenisKelamin, s.alamatLengkap, s.nomorWhatsapp, s.fotoProfile, s.status, s.totalTugasBerhasil, s.latitude, s.longitude, s.tanggalMasuk
        ]);
        res.status(201).json({ message: 'PPSU created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14c. UPDATE PPSU
app.put('/api/ppsu/:id', async (req, res) => {
    const { id } = req.params;
    const s = req.body;
    try {
        const sql = `
            UPDATE ppsu SET 
            nik = ?, nomor_anggota = ?, nama_lengkap = ?, jenis_kelamin = ?, alamat_lengkap = ?, nomor_whatsapp = ?, foto_profile = ?, status = ?, total_tugas_berhasil = ?, latitude = ?, longitude = ?, tanggal_masuk = ?
            WHERE id = ?
        `;
        await db.query(sql, [
            s.nik, s.nomorAnggota, s.namaLengkap, s.jenisKelamin, s.alamatLengkap, s.nomorWhatsapp, s.fotoProfile, s.status, s.totalTugasBerhasil, s.latitude, s.longitude, s.tanggalMasuk, id
        ]);
        res.json({ message: 'PPSU updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14d. DELETE PPSU
app.delete('/api/ppsu/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM ppsu WHERE id = ?', [id]);
        res.json({ message: 'PPSU deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 15. GET FKDM
app.get('/api/fkdm', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM fkdm ORDER BY nama_lengkap ASC');
        const result = rows.map(r => ({
            id: r.id,
            nama: r.nama_lengkap,
            nik: r.nik,
            phone: r.phone,
            jabatan: r.jabatan,
            wilayah: r.wilayah,
            foto: r.foto
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 15b. CREATE FKDM
app.post('/api/fkdm', async (req, res) => {
    const { id, nama, nik, phone, jabatan, wilayah, foto } = req.body;
    try {
        await db.query(
            'INSERT INTO fkdm (id, nama_lengkap, nik, phone, jabatan, wilayah, foto) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, nama, nik, phone, jabatan, wilayah, foto]
        );
        res.status(201).json({ message: 'FKDM Created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 16. GET KARANG TARUNA
app.get('/api/karang-taruna', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM karang_taruna ORDER BY nama_lengkap ASC');
        const result = rows.map(r => ({
            id: r.id,
            nama: r.nama_lengkap,
            nik: r.nik,
            phone: r.phone,
            jabatan: r.jabatan,
            wilayah: r.wilayah,
            foto: r.foto
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 16b. CREATE KARANG TARUNA
app.post('/api/karang-taruna', async (req, res) => {
    const { id, nama, nik, phone, jabatan, wilayah, foto } = req.body;
    try {
        await db.query(
            'INSERT INTO karang_taruna (id, nama_lengkap, nik, phone, jabatan, wilayah, foto) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, nama, nik, phone, jabatan, wilayah, foto]
        );
        res.status(201).json({ message: 'Karang Taruna Created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 17. RESET DATABASE
app.post('/api/reset-database', async (req, res) => {
    try {
        // 1. Drop all tables to ensure clean slate
        const tables = ['users', 'citizens', 'staff', 'reports', 'service_requests', 'service_ratings', 'settings', 'rw', 'rt', 'lmk', 'ppsu', 'fkdm', 'karang_taruna'];
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tables) {
            await db.query(`DROP TABLE IF EXISTS ${table}`);
        }
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Read and execute schema.sql to re-seed
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon
        // We need to run CREATEs and INSERTs
        const statements = schemaSql.split(';').filter(s => s.trim().length > 0);

        for (const statement of statements) {
            const trimmed = statement.trim();
            // Run CREATE, INSERT, USE, SET, etc.
            if (trimmed) {
                await db.query(trimmed);
            }
        }

        res.json({ message: 'Database reset to initial state' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
