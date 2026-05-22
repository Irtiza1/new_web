const { Client } = require('pg');
const client = new Client({
  host: 'db.pgcprmhaalolzjvqfwyo.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Irtiza1@supabase',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => {
    console.log('Connected to pg!');
    client.end();
  })
  .catch(e => console.error('PG Connect Error:', e.message));
