const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/luxe_leather'
});

async function run() {
  try {
    const res = await pool.query('SELECT slug, description FROM site_content ORDER BY slug ASC');
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
