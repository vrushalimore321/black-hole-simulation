const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql2 = require('mysql2');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MySQL connection setup
const connection = mysql2.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'emojisimulation'
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) throw err;
});

app.use(express.static('public'));
app.use(express.json());

// Handle socket connections
io.on('connection', (socket) => {

  // Handle the 'saveEmoji' event from frontend (triggered on POST request)
  socket.on('saveEmoji', (data) => {
    const { emoji_symbol, x, y } = data;
    connection.query(query, [emoji_symbol, x, y], (err, result) => {
      if (err) throw err;
      socket.emit('emojiSaved', savedEmoji);
    });
  });

  // Handle dragEmoji event to update the emoji position
  socket.on('dragEmoji', (data) => {
    socket.broadcast.emit('updateEmojiPosition', data);
  });
});

// GET API to fetch data from the database (initial load of emojis)
app.get('/api/data', (req, res) => {
  const query = 'SELECT id, x, y, emoji_symbol FROM emojis';

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching data from database' });
    }
    res.json(results); // Send the emoji data as response
  });
});

// POST API to save emoji data from frontend
app.post('/api/saveEmoji', (req, res) => {
  const { emoji_symbol, x, y } = req.body;

  const query = 'INSERT INTO emojis (emoji_symbol, x, y) VALUES (?, ?, ?)';
  connection.query(query, [emoji_symbol, x, y], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error saving emoji to database' });
    }
    const savedEmoji = { id: result.insertId, emoji_symbol, x, y };
    res.json(savedEmoji);
  });
});

// Define the port
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
