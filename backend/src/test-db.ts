import pool from './db/database';

async function test() {
  try {
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log('--- DATABASE DIAGNOSTICS ---');
    console.log('Products Count in MySQL:', rows[0].count);
    const [products]: any = await pool.query('SELECT id, name, category FROM products');
    console.log('Products List:');
    products.forEach((p: any) => console.log(`[ID ${p.id}] ${p.name} (${p.category})`));
    process.exit(0);
  } catch (e: any) {
    console.error('Database connection error:', e.message);
    process.exit(1);
  }
}
test();
