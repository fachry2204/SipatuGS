const db = require('./db');

async function migrate() {
  try {
    console.log('Starting migration for PPSU, FKDM, and Karang Taruna...');

    // 1. Create PPSU Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS ppsu (
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
      )
    `);
    console.log('PPSU table created/checked.');

    // 2. Create FKDM Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS fkdm (
        id VARCHAR(50) PRIMARY KEY,
        nama_lengkap VARCHAR(200),
        nik VARCHAR(20),
        phone VARCHAR(20),
        jabatan VARCHAR(100),
        wilayah VARCHAR(100),
        foto TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('FKDM table created/checked.');

    // 3. Create Karang Taruna Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS karang_taruna (
        id VARCHAR(50) PRIMARY KEY,
        nama_lengkap VARCHAR(200),
        nik VARCHAR(20),
        phone VARCHAR(20),
        jabatan VARCHAR(100),
        wilayah VARCHAR(100),
        foto TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Karang Taruna table created/checked.');

    // 4. Migrate ALL data from Staff to PPSU (since currently Staff table ONLY contains PPSU)
    // We check if ppsu table is empty first to avoid duplicates if run multiple times
    const [ppsuCount] = await db.query('SELECT COUNT(*) as count FROM ppsu');
    
    if (ppsuCount[0].count === 0) {
      const [staffData] = await db.query('SELECT * FROM staff');
      if (staffData.length > 0) {
        console.log(`Migrating ${staffData.length} records from Staff to PPSU...`);
        for (const s of staffData) {
           await db.query(`
            INSERT INTO ppsu (id, nik, nomor_anggota, nama_lengkap, jenis_kelamin, alamat_lengkap, nomor_whatsapp, foto_profile, status, total_tugas_berhasil, latitude, longitude, tanggal_masuk, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [s.id, s.nik, s.nomor_anggota, s.nama_lengkap, s.jenis_kelamin, s.alamat_lengkap, s.nomor_whatsapp, s.foto_profile, s.status, s.total_tugas_berhasil, s.latitude, s.longitude, s.tanggal_masuk, s.created_at]);
        }
        console.log('Migration to PPSU completed.');
        
        // 5. Clear Staff Table
        await db.query('DELETE FROM staff');
        console.log('Staff table cleared.');
      } else {
        console.log('Staff table is empty, nothing to migrate.');
      }
    } else {
      console.log('PPSU table already has data, skipping migration from Staff.');
    }

    // 6. Populate Staff table with Kelurahan Staff (from Users table)
    // Roles: 'Administrator', 'Pimpinan', 'Staff Kelurahan'
    const [kelurahanUsers] = await db.query(`
      SELECT * FROM users 
      WHERE role IN ('Administrator', 'Pimpinan', 'Staff Kelurahan')
    `);

    console.log(`Found ${kelurahanUsers.length} Kelurahan Staff users to populate.`);

    for (const u of kelurahanUsers) {
      // Check if already in staff
      const [exists] = await db.query('SELECT id FROM staff WHERE nik = ?', [u.nik]);
      if (exists.length === 0) {
        // Create staff entry
        // Use user.id as staff.id or generate new? Using user.id is simpler for now.
        // If nik is missing, we might have issues. schema.sql says nik is UNIQUE NOT NULL in staff.
        // User 'admin' might have dummy nik.
        
        if (!u.nik) {
            console.log(`Skipping user ${u.username} (no NIK).`);
            continue;
        }

        await db.query(`
          INSERT INTO staff (id, nik, nama_lengkap, status, foto_profile)
          VALUES (?, ?, ?, 'Online', ?)
        `, [u.id, u.nik, u.name, u.avatar]);
        console.log(`Added ${u.name} to Staff table.`);
      }
    }

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
