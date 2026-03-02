
const db = require('./db');

async function migrate() {
  try {
    console.log('Starting encryption migration...');

    // 1. Alter Citizens Table
    console.log('Altering citizens table...');
    // We need to drop the unique index on nik if it exists, modify column, then re-add if possible
    // Or just modify column type. VARCHAR(255) is safe for unique index.
    
    await db.query("ALTER TABLE citizens MODIFY nik VARCHAR(255)");
    await db.query("ALTER TABLE citizens MODIFY kk VARCHAR(255)");
    await db.query("ALTER TABLE citizens MODIFY nomor_whatsapp VARCHAR(255)");
    await db.query("ALTER TABLE citizens MODIFY alamat TEXT");
    // tanggal_lahir is DATE. We want to encrypt it, so it must be TEXT/VARCHAR.
    await db.query("ALTER TABLE citizens MODIFY tanggal_lahir VARCHAR(255)"); 

    // 2. Alter Users Table
    console.log('Altering users table...');
    await db.query("ALTER TABLE users MODIFY nik VARCHAR(255)");
    // username should already be VARCHAR(100), enough for hash? SHA256 hex is 64 chars. 100 is fine.

    // 3. Alter Staff Table (Just in case we want to encrypt staff NIK too later)
    console.log('Altering staff table...');
    await db.query("ALTER TABLE staff MODIFY nik VARCHAR(255)");
    await db.query("ALTER TABLE staff MODIFY nomor_whatsapp VARCHAR(255)");
    await db.query("ALTER TABLE staff MODIFY alamat_lengkap TEXT");

    // 4. Alter PPSU Table
    console.log('Altering ppsu table...');
    await db.query("ALTER TABLE ppsu MODIFY nik VARCHAR(255)");
    await db.query("ALTER TABLE ppsu MODIFY nomor_whatsapp VARCHAR(255)");
    await db.query("ALTER TABLE ppsu MODIFY alamat_lengkap TEXT");

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
