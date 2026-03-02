const db = require('./db');

async function migrate() {
  try {
    console.log('Starting migration for RW, RT, and LMK tables...');

    // Create RW table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rw (
        id VARCHAR(50) PRIMARY KEY,
        no_rw VARCHAR(10) NOT NULL UNIQUE,
        ketua_rw_name VARCHAR(200),
        ketua_rw_phone VARCHAR(20),
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('RW table checked/created.');

    // Create RT table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rt (
        id VARCHAR(50) PRIMARY KEY,
        no_rt VARCHAR(10) NOT NULL,
        rw_id VARCHAR(50) NOT NULL,
        ketua_rt_name VARCHAR(200),
        ketua_rt_phone VARCHAR(20),
        kk_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rw_id) REFERENCES rw(id) ON DELETE CASCADE,
        UNIQUE KEY unique_rt_rw (no_rt, rw_id)
      )
    `);
    console.log('RT table checked/created.');

    // Create LMK table
    await db.query(`
      CREATE TABLE IF NOT EXISTS lmk (
        id VARCHAR(50) PRIMARY KEY,
        rw_id VARCHAR(50) UNIQUE NOT NULL,
        nama_lengkap VARCHAR(200),
        nik VARCHAR(20),
        phone VARCHAR(20),
        periode_jabatan VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rw_id) REFERENCES rw(id) ON DELETE CASCADE
      )
    `);
    console.log('LMK table checked/created.');

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
