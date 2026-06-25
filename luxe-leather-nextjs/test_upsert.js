const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/luxe_leather'
});

async function run() {
  try {
    const res = await pool.query(`
      INSERT INTO site_content (slug, content, title, description, content_type)
      VALUES ('test_slug', 'test content', 'test_slug', 'CMS Content', 'text')
      RETURNING *;
    `);
    console.log("Success:", res.rows[0]);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    pool.end();
  }
}

run();
