const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Connect to MySQL (for now using NAT IP of DB)
const db = mysql.createConnection({
  host: '192.168.11.130', // <-- your db-server IP
  user: 'appuser',
  password: 'StrongPassword123!',
  database: 'outofstock'
});

// Test DB connection
db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// Simple route
app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// Test DB route
app.get('/test-db', (req, res) => {
  db.query('SELECT 1', (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Database connected ✅');
  });
});

const bcrypt = require('bcrypt');

// REGISTER
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    
    db.query(sql, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Registration failed');
      }
      res.send('User registered');
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error hashing password');
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';

  db.query(sql, [username], async (err, results) => {
    if (err) {
      return res.status(500).send('Login failed');
    }

    if (results.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      res.send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
