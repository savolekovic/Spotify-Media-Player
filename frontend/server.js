const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const options = {
    key: fs.readFileSync('../localhost-key.pem'),
    cert: fs.readFileSync('../localhost.pem')
};

https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS Server running on https://localhost:3000');
});