const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');

// Kusoma session kutoka config.json
const sessionFile = './config/config.json';
let sessionData = {};

// Kusoma session ID kutoka config.json (kama ipo)
if (fs.existsSync(sessionFile)) {
    sessionData = JSON.parse(fs.readFileSync(sessionFile));
}

const client = new Client({
    authStrategy: sessionData.session ? { session: sessionData.session } : undefined
});

// Data ya simu
const phones = {
    // Simu za Android na iPhone
};

// Hifadhi hatua za watumiaji
const userSteps = {};

// Generate QR code kwa ajili ya connection
client.on('qr', (qr) => {
    console.log('Scan QR Code hii kuunganisha bot yako:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
});

// Hifadhi session baada ya kuungana
client.on('auth_failure', (msg) => {
    console.log('Authentication failure, session invalid.');
});

client.on('authenticated', (session) => {
    sessionData.session = session;
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData)); // Hifadhi session kwa config.json
    console.log('Authenticated successfully');
});

client.on('message', msg => {
    const chatId = msg.from;
    const text = msg.body.trim().toLowerCase();

    // Hatua ya kwanza: Uchaguzi wa Android au iPhone
    if (["hi", "hello", "mambo", "habari"].includes(text)) {
        userSteps[chatId] = "start";
        msg.reply("Hey! Natumai umzima 😊. Karibu *Kadili Phone Store* 📱.\n\nChagua aina ya simu unayotaka kununua kwa kuandika namba:\n1️⃣ Android\n2️⃣ iPhone");
        return;
    }

    if (userSteps[chatId] === "start") {
        if (text === "1") {
            userSteps[chatId] = "android";
            let response = "Umechagua *Android* 🤖. Chagua kampuni ya simu unaytaka kwa kuandika namba:\n";
            Object.keys(phones.android).forEach(num => {
                response += `${num}️⃣ ${phones.android[num].brand}\n`;
            });
            msg.reply(response);
        } else if (text === "2") {
            userSteps[chatId] = "iphone";
            let response = "Umechagua *iPhone* 🍏. Chagua aina ya iphone unayotaka kununua";
            Object.keys(phones.iphone).forEach(num => {
                response += `${num}️⃣ ${phones.iphone[num].join(", ")}\n`;
            });
            msg.reply(response);
        } else {
            msg.reply("Tafadhali chagua kwa kuandika namba 1 au 2.");
        }
        return;
    }

    // Hatua za kuchagua simu na malipo (Android na iPhone) kama ulivyoandika
    // (Baki na logic yako ya kuchagua simu na malipo hapa)
});

client.initialize();

// Express server kwa Heroku
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// API ya kuweka session
app.use(express.json());
app.post('/set-session', (req, res) => {
    const { session } = req.body;
    if (!session) return res.status(400).json({ error: "Session ID required" });

    sessionData.session = session;
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData));
    res.json({ success: true, message: "Session updated" });
});
