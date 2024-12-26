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

// Handle socket connections
io.on('connection', (socket) => {

  // Handle the 'saveEmoji' event
  socket.on('saveEmoji', (data) => {
    const { emoji_symbol, x, y } = data; // Destructure the data sent from the frontend

    // SQL query to insert the emoji data into the database
    const query = 'INSERT INTO emojis (emoji_symbol, x, y) VALUES (?, ?, ?)';
    connection.query(query, [emoji_symbol, x, y], (err, result) => {
      if (err) throw err;
    });
  });

  // Handle other events, such as updating emoji position
  socket.on('dragEmoji', (data) => {
    // Broadcast the dragged emoji's new position to all other clients
    socket.broadcast.emit('updateEmojiPosition', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
  });
});

// Route to fetch data from database
app.get('/api/data', (req, res) => {
  // Query to fetch data from your table (assuming `emoji_table`)
  const query = 'SELECT id, x, y, emoji_symbol FROM emojis';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ message: 'Error fetching data from database' });
    }

    // Send the fetched data as response
    res.json(results);
  });
});

// Define the port
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
