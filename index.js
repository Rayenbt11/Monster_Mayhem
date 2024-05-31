const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
var serverclass;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
