import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'serene_brews',
};

// Create a pool for application usage
export const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initializeDatabase() {
  try {
    // 1. Establish connection to MySQL server without database first to check/create it
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    console.log('Verifying/Creating MySQL database:', dbConfig.database);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();

    // 2. Initialize tables using the pool
    console.log('MySQL Database verified, checking tables...');
    
    // Create Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        is_best_seller TINYINT DEFAULT 0
      )
    `);

    // Create Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subtotal DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        delivery_method VARCHAR(50) DEFAULT 'pickup',
        delivery_address VARCHAR(500) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Run dynamic migrations to add columns if table already existed
    try {
      await pool.query('ALTER TABLE orders ADD COLUMN delivery_method VARCHAR(50) DEFAULT "pickup"');
    } catch (e) {}
    try {
      await pool.query('ALTER TABLE orders ADD COLUMN delivery_address VARCHAR(500) DEFAULT NULL');
    } catch (e) {}


    // Create Order Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        size VARCHAR(10) NOT NULL,
        sweetness VARCHAR(10) NOT NULL,
        ice VARCHAR(10) NOT NULL,
        note VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        single_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      )
    `);

    // Create Group Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_orders (
        id VARCHAR(50) PRIMARY KEY,
        creator_name VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Group Order Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_order_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        product_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        size VARCHAR(10) NOT NULL,
        sweetness VARCHAR(10) NOT NULL,
        ice VARCHAR(10) NOT NULL,
        note VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        single_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (group_order_id) REFERENCES group_orders (id) ON DELETE CASCADE
      )
    `);

    // Create Vouchers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        code VARCHAR(50) PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        discount_type VARCHAR(50) NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        min_subtotal DECIMAL(10, 2) NOT NULL
      )
    `);

    // Seed Vouchers Table
    const [vRows]: any = await pool.query('SELECT COUNT(*) as count FROM vouchers');
    const vCount = vRows[0]?.count || 0;
    if (vCount === 0) {
      console.log('Seeding initial vouchers into MySQL database...');
      const initialVouchers = [
        { code: 'SERENE15', description: 'Giảm 15k cho đơn từ 100k', discount_type: 'fixed', discount_value: 15000, min_subtotal: 100000 },
        { code: 'SERENE50', description: 'Giảm 50k cho đơn từ 200k', discount_type: 'fixed', discount_value: 50000, min_subtotal: 200000 },
        { code: 'COFFEEGO', description: 'Giảm 10% tổng đơn hàng', discount_type: 'percentage', discount_value: 10, min_subtotal: 0 },
        { code: 'FREESHIP', description: 'Freeship - Giảm 20k đơn hàng', discount_type: 'fixed', discount_value: 20000, min_subtotal: 50000 }
      ];
      for (const v of initialVouchers) {
        await pool.query(`
          INSERT INTO vouchers (code, description, discount_type, discount_value, min_subtotal)
          VALUES (?, ?, ?, ?, ?)
        `, [v.code, v.description, v.discount_type, v.discount_value, v.min_subtotal]);
      }
    }


    // 3. Seed products if table is empty or has fewer than 26 items or has invalid relative image paths
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM products');
    const count = rows[0]?.count || 0;

    let hasInvalidImages = false;
    if (count > 0) {
      const [images]: any = await pool.query('SELECT image FROM products LIMIT 50');
      for (const row of images) {
        if (row.image && (!row.image.startsWith('http') || row.image.includes('photo-1576092762841') || row.image.includes('photo-1562376502') || row.image.includes('photo-1616260828576'))) {
          hasInvalidImages = true;
          break;
        }
      }
    }

    if (count !== 25 || hasInvalidImages) {
      console.log(`Product count is ${count} (expected 25) or invalid image paths detected. Re-seeding initial coffee products into MySQL...`);
      await pool.query('DROP TABLE IF EXISTS group_order_items');
      await pool.query('DROP TABLE IF EXISTS order_items');
      await pool.query('DROP TABLE IF EXISTS products');
      
      // Recreate Products Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          image VARCHAR(500) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          is_best_seller TINYINT DEFAULT 0
        )
      `);

      // Recreate Order Items Table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          size VARCHAR(10) NOT NULL,
          sweetness VARCHAR(10) NOT NULL,
          ice VARCHAR(10) NOT NULL,
          note VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          single_price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
        )
      `);

      // Recreate Group Order Items Table (since we dropped it)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS group_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          group_order_id VARCHAR(50) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          product_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          size VARCHAR(10) NOT NULL,
          sweetness VARCHAR(10) NOT NULL,
          ice VARCHAR(10) NOT NULL,
          note VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          single_price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (group_order_id) REFERENCES group_orders (id) ON DELETE CASCADE
        )
      `);

      const initialProducts = [
        {
          name: 'Matcha Cloud Latte',
          price: 65000,
          image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400',
          category: 'Signature',
          description: 'Trà xanh thượng hạng hòa quyện với lớp kem béo ngậy tạo ra hương vị êm ái như những đám mây đầu mùa.',
          is_best_seller: 1,
        },
        {
          name: 'Trà Oolong Đào Tiên',
          price: 55000,
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Sự kết hợp hoàn hảo giữa lá trà oolong cao cấp và đào tiên mọng nước ngọt ngào.',
          is_best_seller: 0,
        },
        {
          name: 'Cold Brew Mè Đen',
          price: 70000,
          image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400',
          category: 'Signature',
          description: 'Cà phê ủ lạnh thanh mát kết hợp với kem foam mè đen thơm lừng độc đáo.',
          is_best_seller: 0,
        },
        {
          name: 'Trà Hoa Cúc Yên Thảo',
          price: 50000,
          image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Trà hoa cúc khô nguyên bông mang lại vị thanh khiết, thư giãn đầu óc sau ngày dài mỏi mệt.',
          is_best_seller: 0,
        },
        {
          name: 'Trà Vải Lài Bình Yên',
          price: 55000,
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Sự kết hợp nhẹ nhàng giữa trà lài thơm ngát và vị ngọt thanh của vải thiều tươi, mang đến cảm giác thanh bình như một sớm mai tĩnh lặng.',
          is_best_seller: 1,
        },
        {
          name: 'Almond Croissant',
          price: 45000,
          image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400',
          category: 'Ngọt ngào',
          description: 'Bánh sừng bò ngập nhân hạnh nhân, giòn rụm bên ngoài và mềm xốp bên trong.',
          is_best_seller: 0,
        },
        {
          name: 'Espresso Cream Macchiato',
          price: 60000,
          image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=400',
          category: 'Signature',
          description: 'Cà phê Espresso đậm đà với lớp bọt sữa Macchiato béo mịn ngọt ngào phủ bên trên.',
          is_best_seller: 1,
        },
        {
          name: 'Sea Salt Caramel Latte',
          price: 65000,
          image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
          category: 'Signature',
          description: 'Sự kết hợp ngọt ngào của caramel hòa quyện cùng chút muối biển tinh tế và espresso sữa nóng.',
          is_best_seller: 0,
        },
        {
          name: 'Coconut Milk Cold Brew',
          price: 70000,
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
          category: 'Signature',
          description: 'Cà phê Cold Brew ủ lạnh thanh thoát hòa cùng sữa dừa sánh mịn, thơm lừng béo ngậy.',
          is_best_seller: 1,
        },
        {
          name: 'Hazelnut Latte Foam',
          price: 65000,
          image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400',
          category: 'Signature',
          description: 'Sự quyến rũ đặc biệt của hạt dẻ hazelnut thơm bùi quyện trong tách espresso latte ấm áp.',
          is_best_seller: 0,
        },

        {
          name: 'Trà Đào Cam Sả Tiên Cảnh',
          price: 55000,
          image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Trà đào truyền thống nâng tầm với cam vàng Mỹ ngọt mát và sả tươi đập dập thơm lừng giải nhiệt.',
          is_best_seller: 1,
        },
        {
          name: 'Trà Dâu Tây Đá Tuyết',
          price: 60000,
          image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Dâu tây Đà Lạt xay đá tuyết mát lạnh sảng khoái kết hợp với cốt trà lài thanh tao nhẹ nhàng.',
          is_best_seller: 0,
        },
        {
          name: 'Trà Xanh Bạc Hà Thanh Mát',
          price: 50000,
          image: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Những lá bạc hà tươi giã nhẹ quyện trong trà xanh thượng hạng mang lại sự bừng tỉnh tức thì.',
          is_best_seller: 0,
        },
        {
          name: 'Trà Sen Tây Hồ Tĩnh Lặng',
          price: 50000,
          image: 'http://localhost:5000/public/images/tra_sen_tay_ho.png',
          category: 'Thanh lọc cơ thể',
          description: 'Mùi sen Tây Hồ dịu dàng ướp tinh tế trong từng lá trà xanh mang lại cảm giác bình yên thư thái.',
          is_best_seller: 0,
        },
        {
          name: 'Nước Ép Thơm Ổi Hồng',
          price: 55000,
          image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Nước ép nguyên chất từ dứa chín mọng nước kết hợp ổi hồng thơm mát giàu vitamin C.',
          is_best_seller: 0,
        },
        {
          name: 'Trà Hibiscus Hạt Chia',
          price: 55000,
          image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Sắc đỏ kiêu kỳ của hoa Hibiscus chua nhẹ thanh mát kết hợp hạt chia nhai sần sật vui miệng.',
          is_best_seller: 0,
        },
        {
          name: 'Trà Sữa Oolong Nhài',
          price: 60000,
          image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Cốt trà oolong nhài đậm vị hòa quyện cùng sữa béo thơm dịu mát khó quên.',
          is_best_seller: 1,
        },
        {
          name: 'Trà Vải Hạt Chia',
          price: 55000,
          image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=400',
          category: 'Thanh lọc cơ thể',
          description: 'Trà vải ngọt ngào giòn sần sật của trái vải ngâm cùng hạt chia dồi dào dinh dưỡng.',
          is_best_seller: 0,
        },
        {
          name: 'Chocolate Croissant',
          price: 45000,
          image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=400',
          category: 'Ngọt ngào',
          description: 'Bánh sừng bò ngập nhân sô cô la bỉ chảy lỏng, vỏ ngoài giòn rụm ngây ngất.',
          is_best_seller: 1,
        },
        {
          name: 'Butter Waffle',
          price: 40000,
          image: 'http://localhost:5000/public/images/butter_waffle.png',
          category: 'Ngọt ngào',
          description: 'Bánh tổ ong nướng bơ tỏi thơm lừng giòn ngọt, tuyệt vời khi dùng nóng.',
          is_best_seller: 0,
        },
        {
          name: 'Tiramisu Cup',
          price: 55000,
          image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400',
          category: 'Ngọt ngào',
          description: 'Bánh tiramisu truyền thống của Ý đượm vị rượu rum quyện kem cheese béo ngậy.',
          is_best_seller: 1,
        },
        {
          name: 'Blueberry Cheesecake',
          price: 60000,
          image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=400',
          category: 'Ngọt ngào',
          description: 'Bánh phô mai nướng đế quy giòn kết hợp mứt việt quất tươi chua ngọt đậm đà.',
          is_best_seller: 0,
        },
        {
          name: 'Matcha Cookie',
          price: 35000,
          image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400',
          category: 'Ngọt ngào',
          description: 'Bánh quy trà xanh giòn xốp rắc thêm hạnh nhân lát thơm bùi ngọt dịu.',
          is_best_seller: 0,
        },
        {
          name: 'Red Velvet Slice',
          price: 55000,
          image: 'http://localhost:5000/public/images/red_velvet_slice.png',
          category: 'Ngọt ngào',
          description: 'Lát bánh bông lan nhung đỏ quyến rũ xen kẽ lớp kem phô mai chua nhẹ ngọt ngào.',
          is_best_seller: 0,
        },
        {
          name: 'Macaron Set (3pcs)',
          price: 65000,
          image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&q=80&w=400',
          category: 'Ngọt ngào',
          description: 'Hộp 3 bánh macaron nhiều màu sắc với các nhân dâu, trà xanh và sô cô la ngọt dịu.',
          is_best_seller: 1,
        }
      ];

      for (const p of initialProducts) {
        await pool.query(`
          INSERT INTO products (name, price, image, category, description, is_best_seller)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [p.name, p.price, p.image, p.category, p.description, p.is_best_seller]);
      }
      console.log('Seeded MySQL products successfully with 26 items.');
    } else {
      console.log(`Database tables validated, found ${count} existing products in MySQL.`);
    }

  } catch (error: any) {
    console.error('MySQL Database initialization failed:', error.message);
    throw error;
  }
}

export default pool;
