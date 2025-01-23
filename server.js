const express = require('express');
const tmi = require('tmi.js');
const http = require('http');
const socketIo = require('socket.io'); // Import socket.io

const app = express();
const server = http.createServer(app); // Create server instance
const io = socketIo(server); // Attach socket.io to the server

const PORT = 5500;
const USERNAME = 'Jiroshima_'; // Your Twitch username
const OAUTH_TOKEN = 'oauth:2necnebwvv27mdzi754dltk8zbnh5e'; // Your OAuth token

let client;

// Serve static files (your front-end)
app.use(express.static('public')); // Make sure index.html is in the 'public' folder

app.use(express.json());

// Connect to chat when requested
app.post('/connect-chat', (req, res) => {
    const { channelUsername } = req.body;

    if (!channelUsername) {
        return res.status(400).json({ error: 'Channel username is required' });
    }

    // Set up the tmi.js client
    client = new tmi.Client({
        options: { debug: true },
        connection: {
            secure: true,
            reconnect: true
        },
        identity: {
            username: USERNAME,
            password: OAUTH_TOKEN
        },
        channels: [channelUsername]
    });

    // Connect to chat and listen for messages
    client.connect().catch(console.error);

    client.on('message', (channel, tags, message, self) => {
        if (self) return; // Ignore messages from the bot itself

        // Send message to the front end
        io.emit('chat-message', {
            user: tags['display-name'],
            message: message
        });
    });

    res.json({ message: `Connected to chat for ${channelUsername}` });
});

// Set up socket.io for real-time communication
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
