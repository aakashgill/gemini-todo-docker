const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
// Docker Compose will provide these environment variables
const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function initializeDatabase() {
    let retries = 5;
    while (retries) {
        try {
            pool = mysql.createPool(dbConfig);
            const connection = await pool.getConnection();
            console.log('Successfully connected to the database.');

            // Create the todos table if it doesn't exist
            await connection.query(`
                CREATE TABLE IF NOT EXISTS todos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    task VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Table "todos" is ready.');
            connection.release();
            break; // Exit loop if connection is successful
        } catch (err) {
            console.error('Failed to connect to database:', err.message);
            retries -= 1;
            console.log(`Retries left: ${retries}`);
            // Wait for 5 seconds before retrying
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    if (!pool) {
        console.error('Could not establish a database connection. Exiting.');
        process.exit(1);
    }
}


// --- API Routes ---

// Get all todos
app.get('/api/todos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching todos:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add a new todo
app.post('/api/todos', async (req, res) => {
    try {
        const { task } = req.body;
        if (!task || task.trim() === '') {
            return res.status(400).json({ error: 'Task cannot be empty' });
        }
        const [result] = await pool.query('INSERT INTO todos (task) VALUES (?)', [task]);
        const [[newTodo]] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
        res.status(201).json(newTodo);
    } catch (err) {
        console.error('Error adding todo:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM todos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.status(204).send(); // No content
    } catch (err) {
        console.error('Error deleting todo:', err);
        res.status(500).json({ error: 'Database error' });
    }
});


// Start the server after ensuring DB is ready
initializeDatabase().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Todo API server listening at http://localhost:${port}`);
    });
});