"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./db/database"));
async function test() {
    try {
        const [rows] = await database_1.default.query('SELECT COUNT(*) as count FROM products');
        console.log('--- DATABASE DIAGNOSTICS ---');
        console.log('Products Count in MySQL:', rows[0].count);
        const [products] = await database_1.default.query('SELECT id, name, category FROM products');
        console.log('Products List:');
        products.forEach((p) => console.log(`[ID ${p.id}] ${p.name} (${p.category})`));
        process.exit(0);
    }
    catch (e) {
        console.error('Database connection error:', e.message);
        process.exit(1);
    }
}
test();
