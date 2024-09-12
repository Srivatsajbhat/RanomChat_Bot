const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.API;

// polling
const bot = new TelegramBot(token, { polling: true });
const app = express();

const port = process.env.PORT || 3000;

// Store users and random chat pairs
let users = [];
let chatPairs = {};

// Start Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Function to pair users
function pairUsers() {
    while (users.length >= 2) {
        const user1 = users.shift();
        const user2 = users.shift();
        chatPairs[user1] = user2;
        chatPairs[user2] = user1;

        bot.sendMessage(user1, 'You have been paired with a random user! \n Start chatting!\n /start - to start chat \n /end - to stop and move next.');
        bot.sendMessage(user2, 'You have been paired with a random user! \n Start chatting!\n /start - to start chat \n /end - to stop and move next.');
    }
}

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    if (!users.includes(chatId)) {
        users.push(chatId);
        bot.sendMessage(chatId, 'You have been added to the queue. Please wait for a random user to be paired.');
    }

    // Try to pair users after adding a new one
    pairUsers();
});

// Handle messages between paired users
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore "/start" command here to prevent looping
    if (text.startsWith('/start')) return;

    if (chatPairs[chatId]) {
        const pairedUser = chatPairs[chatId];
        bot.sendMessage(pairedUser, text);
    } else {
        bot.sendMessage(chatId, 'You are not paired with anyone yet. Please wait.');
    }
});

// Handle "/end" command to stop the chat
bot.onText(/\/end/, (msg) => {
    const chatId = msg.chat.id;
    const pairedUser = chatPairs[chatId];

    if (pairedUser) {
        bot.sendMessage(pairedUser, 'The other user has ended the chat.');
        bot.sendMessage(chatId, 'You have ended the chat.');

        delete chatPairs[chatId];
        delete chatPairs[pairedUser];

        // Add users back to the queue for re-pairing
        users.push(chatId);
        users.push(pairedUser);

        pairUsers(); // Try to pair again after ending
    } else {
        bot.sendMessage(chatId, 'You are not in an active chat.');
    }
});
