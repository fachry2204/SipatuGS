const db = require('./db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// --- ENCRYPTION SETUP ---
// Same key as server.js
const ENCRYPTION_KEY = Buffer.from('e8f32a7604102983745298104728374652910384756291028374652910384756', 'hex'); 
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    // Check if already encrypted (heuristic: contains ':')
    if (text.includes(':') && text.length > 32) return text;
    
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

function hash(text) {
    if (!text) return text;
    return crypto.createHash('sha256').update(String(text)).digest('hex');
}

async function migrate() {
    try {
        console.log('Starting migration for existing citizens...');
        
        // 1. Get all citizens
        const [citizens] = await db.query('SELECT * FROM citizens');
        console.log(`Found ${citizens.length} citizens to process.`);

        for (const c of citizens) {
            console.log(`Processing citizen: ${c.nama_lengkap} (${c.nik})`);
            
            // Encrypt fields
            const encryptedNik = encrypt(c.nik);
            const encryptedKk = encrypt(c.kk);
            const encryptedWa = encrypt(c.nomor_whatsapp);
            const encryptedAlamat = encrypt(c.alamat);
            const encryptedTgl = encrypt(c.tanggal_lahir); // Note: tanggal_lahir in DB is DATE or VARCHAR? 
            // In schema.sql it was DATE, but migrate_encryption.js changed it to VARCHAR(255).
            // If it was DATE, it might be returned as Date object. String(c.tanggal_lahir) handles it.

            // Update Citizen
            await db.query(`
                UPDATE citizens SET 
                nik = ?, kk = ?, nomor_whatsapp = ?, alamat = ?, tanggal_lahir = ?
                WHERE id = ?
            `, [encryptedNik, encryptedKk, encryptedWa, encryptedAlamat, encryptedTgl, c.id]);

            // Create/Update User Account
            // Check if user exists by matching Hashed NIK (as username) OR Encrypted NIK (in nik column)
            // But since we just encrypted NIK, let's use the original NIK to check if user exists?
            // Wait, we don't have original NIK if we didn't store it. But we have 'c.nik' from the SELECT query above (which was plaintext before update).
            
            const originalNik = c.nik; // This is plaintext from the SELECT result
            const usernameHash = hash(originalNik);
            
            const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ? OR nik = ?', [usernameHash, encryptedNik]);
            
            if (existingUsers.length === 0) {
                const userId = `USR-WARGA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const password = await bcrypt.hash(originalNik, 10); // Password is NIK
                
                await db.query(`
                    INSERT INTO users (id, username, password, name, email, nik, role, avatar)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId, 
                    usernameHash, 
                    password, 
                    c.nama_lengkap, 
                    null, 
                    encryptedNik, 
                    'Warga', 
                    c.foto_wajah || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nama_lengkap)}&background=random`
                ]);
                console.log(`-> Created user account for ${c.nama_lengkap}`);
            } else {
                console.log(`-> User account already exists for ${c.nama_lengkap}`);
                // Optional: Update NIK in users table if it wasn't encrypted
                await db.query('UPDATE users SET nik = ? WHERE id = ?', [encryptedNik, existingUsers[0].id]);
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
