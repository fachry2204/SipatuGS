const db = require('./db');

async function debug() {
  try {
    const [users] = await db.query("SELECT * FROM users");
    console.log('All Users:', users);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debug();
