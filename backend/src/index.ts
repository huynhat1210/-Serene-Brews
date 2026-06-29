import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import pool, { initializeDatabase } from './db/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Root endpoint welcome message
app.get('/', (req, res) => {
  res.send('☕ Serene Brews Backend API is running successfully! Access /api/products for products list.');
});

// 1. Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM products');
    const products = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      image: r.image,
      category: r.category,
      description: r.description,
      isBestSeller: r.is_best_seller === 1
    }));
    res.json(products);
  } catch (err: any) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Database error fetching products' });
  }
});

// 1b. Get all vouchers from MySQL database
app.get('/api/vouchers', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM vouchers');
    const vouchers = rows.map((r: any) => ({
      code: r.code,
      description: r.description,
      discountType: r.discount_type,
      discountValue: Number(r.discount_value),
      minSubtotal: Number(r.min_subtotal)
    }));
    res.json(vouchers);
  } catch (err: any) {
    console.error('Error fetching vouchers:', err.message);
    res.status(500).json({ error: 'Database error fetching vouchers' });
  }
});

// 2. Place a new order
app.post('/api/orders', async (req, res) => {
  const { items, subtotal, discount, total, paymentMethod, deliveryMethod, deliveryAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain items' });
  }

  // Get connection from pool for transaction control
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert order metadata
    const [orderResult]: any = await connection.query(`
      INSERT INTO orders (subtotal, discount, total, payment_method, delivery_method, delivery_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [subtotal, discount, total, paymentMethod, deliveryMethod || 'pickup', deliveryAddress || null]);

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await connection.query(`
        INSERT INTO order_items (order_id, product_id, name, size, sweetness, ice, note, quantity, single_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        item.productId,
        item.name,
        item.size,
        item.sweetness,
        item.ice,
        item.note || '',
        item.quantity,
        item.singlePrice
      ]);
    }

    await connection.commit();
    console.log(`Order #${orderId} created successfully in MySQL.`);
    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: orderId,
        subtotal,
        discount,
        total,
        paymentMethod
      }
    });
  } catch (err: any) {
    await connection.rollback();
    console.error('Error saving order to MySQL:', err.message);
    res.status(500).json({ error: 'Failed to save order' });
  } finally {
    connection.release();
  }
});

// 3. Fetch all orders (for logs or verification)
app.get('/api/orders', async (req, res) => {
  const query = `
    SELECT 
      o.id as orderId, o.subtotal, o.discount, o.total, o.payment_method as paymentMethod, o.delivery_method as deliveryMethod, o.delivery_address as deliveryAddress, o.created_at as createdAt,
      oi.id as itemId, oi.product_id as productId, oi.name as itemName, oi.size, oi.sweetness, oi.ice, oi.note, oi.quantity, oi.single_price as singlePrice
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ORDER BY o.id DESC
  `;

  try {
    const [rows]: any = await pool.query(query);
    const ordersMap: { [key: number]: any } = {};
    for (const row of rows) {
      if (!ordersMap[row.orderId]) {
        ordersMap[row.orderId] = {
          id: row.orderId,
          subtotal: Number(row.subtotal),
          discount: Number(row.discount),
          total: Number(row.total),
          paymentMethod: row.paymentMethod,
          deliveryMethod: row.deliveryMethod,
          deliveryAddress: row.deliveryAddress,
          createdAt: row.createdAt,
          items: []
        };
      }

      if (row.itemId) {
        ordersMap[row.orderId].items.push({
          id: row.itemId,
          productId: row.productId,
          name: row.itemName,
          size: row.size,
          sweetness: row.sweetness,
          ice: row.ice,
          note: row.note,
          quantity: row.quantity,
          singlePrice: Number(row.singlePrice)
        });
      }
    }

    res.json(Object.values(ordersMap));
  } catch (err: any) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Database error fetching orders' });
  }
});

// 4. Delete all orders (Clear History)
app.delete('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM order_items');
    await connection.query('DELETE FROM orders');
    await connection.commit();
    res.json({ message: 'Lịch sử đơn hàng đã được xóa thành công!' });
  } catch (err: any) {
    await connection.rollback();
    console.error('Error clearing orders:', err.message);
    res.status(500).json({ error: 'Không thể xóa lịch sử đơn hàng' });
  } finally {
    connection.release();
  }
});

// 5. Group Ordering Endpoints
// 5a. Create a Group Order Room
app.post('/api/group-orders', async (req, res) => {
  const { creatorName } = req.body;
  const roomId = 'ROOM-' + Math.floor(Math.random() * 900000 + 100000);
  
  try {
    await pool.query(
      'INSERT INTO group_orders (id, creator_name) VALUES (?, ?)',
      [roomId, creatorName || 'Khách hàng']
    );
    res.json({ roomId });
  } catch (err: any) {
    console.error('Error creating group order:', err.message);
    res.status(500).json({ error: 'Failed to create group order' });
  }
});

// 5b. Fetch Group Order Room details and items
app.get('/api/group-orders/:roomId', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const [rooms]: any = await pool.query('SELECT * FROM group_orders WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhóm đặt đơn này.' });
    }
    const room = rooms[0];

    const [items]: any = await pool.query('SELECT * FROM group_order_items WHERE group_order_id = ?', [roomId]);
    res.json({
      roomId: room.id,
      creatorName: room.creator_name,
      createdAt: room.created_at,
      items: items.map((item: any) => ({
        id: item.id,
        userName: item.user_name,
        productId: item.product_id,
        name: item.name,
        size: item.size,
        sweetness: item.sweetness,
        ice: item.ice,
        note: item.note,
        quantity: item.quantity,
        singlePrice: Number(item.single_price)
      }))
    });
  } catch (err: any) {
    console.error('Error reading group order:', err.message);
    res.status(500).json({ error: 'Failed to fetch group order details' });
  }
});

// 5c. Add item to a Group Order Room
app.post('/api/group-orders/:roomId/items', async (req, res) => {
  const { roomId } = req.params;
  const { userName, productId, name, size, sweetness, ice, note, quantity, singlePrice } = req.body;
  
  try {
    const [rooms]: any = await pool.query('SELECT * FROM group_orders WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phòng.' });
    }
    
    await pool.query(`
      INSERT INTO group_order_items (group_order_id, user_name, product_id, name, size, sweetness, ice, note, quantity, single_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [roomId, userName || 'Ẩn danh', productId, name, size, sweetness, ice, note, quantity, singlePrice]);
    
    res.json({ success: true, message: 'Đã thêm món vào đơn nhóm!' });
  } catch (err: any) {
    console.error('Error adding group order item:', err.message);
    res.status(500).json({ error: 'Failed to add item to group' });
  }
});

// 5d. Delete Group Order Room (Close room)
app.delete('/api/group-orders/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    await pool.query('DELETE FROM group_orders WHERE id = ?', [roomId]);
    res.json({ success: true, message: 'Đã đóng phòng đặt nước nhóm!' });
  } catch (err: any) {
    console.error('Error closing group order:', err.message);
    res.status(500).json({ error: 'Failed to close group order' });
  }
});

// Initialize database tables, then start Server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Serene Brews Backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server due to DB error:', error);
    process.exit(1);
  }
}

startServer();
