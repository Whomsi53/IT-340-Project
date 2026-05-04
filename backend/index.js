const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');

const fs = require("fs");
const path = require("path");

const app = express();

// ========================
// STATIC
// ========================
app.use("/img", express.static(path.join(__dirname, "img")));

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-user-id"]
}));

app.use(express.json());

// ========================
// DB
// ========================
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

let db;
async function connectDB() {
    db = await mysql.createPool(dbConfig);
    console.log("✅ DB connected");
}

// ========================
// HELPER
// ========================
async function getUser(userId) {
    if (!userId) return null;
    const [rows] = await db.execute('SELECT * FROM users WHERE id=?', [userId]);
    return rows[0];
}

// ========================
// AUTH
// ========================
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    await db.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashed, 'customer']
    );

    res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const [rows] = await db.execute('SELECT * FROM users WHERE username=?', [username]);
    if (!rows.length) return res.json({ success: false });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.json({ success: false });

    res.json({
        success: true,
        user: { id: user.id, username: user.username, role: user.role }
    });
});

// ========================
// USERS (ADMIN ONLY)
// ========================
app.get('/api/users', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Admins only" });

    const [rows] = await db.execute('SELECT id, username, role FROM users');
    res.json({ users: rows });
});

app.put('/api/users/:id/role', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Admins only" });

    const { role } = req.body;
    const allowed = ["customer", "seller", "admin"];
    if (!allowed.includes(role)) return res.json({ success:false });

    await db.execute('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);

    res.json({ success:true });
});

app.delete('/api/users/:id', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Admins only" });

    await db.execute('DELETE FROM users WHERE id=?', [req.params.id]);

    res.json({ success:true });
});

// ========================
// PRODUCTS
// ========================
app.get('/api/products', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);

    // sellers only see their products
    if (user && user.role === "seller") {
        const [rows] = await db.execute(
            'SELECT * FROM products WHERE user_id=?',
            [user.id]
        );
        return res.json({ success:true, products: rows });
    }

    const [rows] = await db.execute('SELECT * FROM products');
    res.json({ success:true, products: rows });
});

app.post('/api/products', async (req, res) => {
    try {
        const user = await getUser(req.headers["x-user-id"]);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        let { name, description, price, image, category, link } = req.body;

        price = Number(price);

        if (!name || isNaN(price) || price <= 0) {
            return res.status(400).json({ error: "Invalid name or price" });
        }

        // 🔐 sellers can ONLY create store items
        if (user.role === "seller") {
            category = "store";
            link = null;
        }

        if (category === "amazon" && (!link || link.trim() === "")) {
            return res.status(400).json({ error: "Amazon link required" });
        }

        await db.execute(
            'INSERT INTO products (name, description, price, image, user_id, category, link) VALUES (?,?,?,?,?,?,?)',
            [
                name,
                description || "",
                price,
                image || "",
                user.id,
                category || "store",
                category === "amazon" ? link : null
            ]
        );

        res.json({ success:true });

    } catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// 🔐 EDIT = owner or admin only
app.put('/api/products/:id', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const [rows] = await db.execute('SELECT * FROM products WHERE id=?', [req.params.id]);
    const product = rows[0];

    if (!product) return res.status(404).json({ error: "Not found" });

    if (user.role !== "admin" && product.user_id !== user.id) {
        return res.status(403).json({ error: "Not your product" });
    }

    let { name, description, price, image, category, link } = req.body;

    price = Number(price);

    // sellers cannot change to amazon
    if (user.role === "seller") {
        category = "store";
        link = null;
    }

    await db.execute(
        'UPDATE products SET name=?, description=?, price=?, image=?, category=?, link=? WHERE id=?',
        [name, description, price, image, category, link, req.params.id]
    );

    res.json({ success:true });
});

// 🔐 DELETE = owner or admin
app.delete('/api/products/:id', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const [rows] = await db.execute('SELECT * FROM products WHERE id=?', [req.params.id]);
    const product = rows[0];

    if (user.role !== "admin" && product.user_id !== user.id) {
        return res.status(403).json({ error: "Not your product" });
    }

    await db.execute('DELETE FROM products WHERE id=?', [req.params.id]);

    res.json({ success:true });
});

// ========================
// TICKETS (🔥 FIXED)
// ========================
app.get('/api/tickets', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let query = `
        SELECT t.*, u.username
        FROM tickets t
        JOIN users u ON t.user_id = u.id
    `;

    let params = [];

    // sellers behave like customers (only own tickets)
    if (user.role !== "admin") {
        query += " WHERE t.user_id = ?";
        params.push(user.id);
    }

    query += " ORDER BY t.id DESC";

    const [rows] = await db.execute(query, params);

    res.json({ tickets: rows });
});

// customers & sellers can create
app.post('/api/tickets', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { message } = req.body;

    await db.execute(
        'INSERT INTO tickets (user_id, message, status) VALUES (?,?,?)',
        [user.id, message, 'open']
    );

    res.json({ success:true });
});

// admin only
app.put('/api/tickets/:id', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Admins only" });

    await db.execute(
        'UPDATE tickets SET status=? WHERE id=?',
        [req.body.status || "closed", req.params.id]
    );

    res.json({ success:true });
});

app.delete('/api/tickets/:id', async (req, res) => {
    const user = await getUser(req.headers["x-user-id"]);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Admins only" });

    await db.execute('DELETE FROM tickets WHERE id=?', [req.params.id]);

    res.json({ success:true });
});

// ========================
// REVIEWS
// ========================
app.get('/api/reviews/:productId', async (req, res) => {
    const [rows] = await db.execute(`
        SELECT r.*, u.username
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.product_id=?
        ORDER BY r.id DESC
    `, [req.params.productId]);

    res.json({ success:true, reviews: rows });
});

app.post('/api/reviews', async (req, res) => {
    try {
        const user = await getUser(req.headers["x-user-id"]);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { productId, rating, comment } = req.body;

        await db.execute(
            'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)',
            [productId, user.id, rating || 5, comment]
        );

        res.json({ success:true });

    } catch (err) {
        console.error("REVIEW ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ========================
// AI SUMMARY
// ========================
app.post('/api/ai-summary', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ success:false });
    }

    const summary =
        text.length > 120
            ? text.substring(0, 120) + "..."
            : text;

    res.json({ success:true, summary });
});

// ========================
connectDB().then(() => {
    app.listen(3000, "0.0.0.0", () => {
        console.log("🚀 Server running on port 3000");
    });
});
