const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
require('dotenv').config();
// Token
const token = "7014120861:AAGOPud15TG_3tGtS-qhrUx3X7Zz-puIlrE";

const herrbot = new TelegramBot(token, { polling: true });

// Regex
const start = new RegExp(/^\/start$/);
const gempa = new RegExp(/\.gempa$/);
const newsRegex = /^\.news$/;
const quotesRegex = /^\.quotes$/;
const anime = new RegExp(/^\.anime/);

// On Start
herrbot.onText(start, (msg) => {
    const username = msg.from.username;
    const chatId = msg.chat.id;
    herrbot.sendMessage(chatId, `
What can this bot do?
Selamat datang ${username} di Yuki Bot.
Panduang penggunaan :
.gempa untuk melihat info gempa terbaru.
.anime untuk mendapatkan kata kata anime random.
.news untuk mendapatkan berita terbaru.
.quotes untuk mendapatkan quotes random.

Command with parameters:
.ai [pertanyaan] untuk mendapatkan jawaban dari pertanyaan ai.
`);
});

// On Regex Gempa
herrbot.onText(gempa, async (msg) => {
    const chatId = msg.chat.id;
    herrbot.sendMessage(chatId, "Mohon tunggu...");    
    const BMKG_ENDPOINT = "https://data.bmkg.go.id/DataMKG/TEWS/";
    try {
        const response = await axios.get(BMKG_ENDPOINT + "autogempa.json");
        const { Infogempa: { gempa: { Jam, Magnitude, Tanggal, Wilayah, Potensi, Kedalaman, Shakemap } } } = response.data;
        const BMKGImage = BMKG_ENDPOINT + Shakemap;
        const resultText = `
Waktu : ${Tanggal} | ${Jam}
Magnitude : ${Magnitude} SR
Wilayah : ${Wilayah}
Potensi : ${Potensi}
Kedalaman : ${Kedalaman}
    `;
        herrbot.sendPhoto(chatId, BMKGImage, { caption: resultText });
    } catch (error) {
        console.error("Error fetching data:", error);
        const chatId = msg.chat.id;
        herrbot.sendMessage(chatId, "Terjadi kesalahan saat mengambil data gempa.");
    }
});

// On Regex Anime
herrbot.onText(anime, async (msg) => {
    const chatId = msg.chat.id;
    herrbot.sendMessage(msg.chat.id, 'Mohon tunggu...');
    const ANIME_ENDPOINT = "https://katanime.vercel.app/api/getrandom";
    try {
        const response = await axios.get(ANIME_ENDPOINT);
        const { result } = response.data;
        const Quotes = result[1].indo;
        const Character = result[1].character;
        const Anime = result[1].anime;
        const resultText = `
Quotes : ${Quotes.replace(/"/g, '\\"')}
Karakter : ${Character.replace(/"/g, '\\"')}
Anime : ${Anime.replace(/"/g, '\\"')}
`;
        console.log(resultText);
        herrbot.sendMessage(chatId, resultText);
    } catch (error) {
        console.error("Error fetching data:", error);
        herrbot.sendMessage(chatId, "Terjadi kesalahan saat mengambil data anime.");
    }
});

// On Regex Anime
const aiRegex = /^\.ai (.+)$/;
herrbot.onText(aiRegex, async (msg, match) => {
    herrbot.sendMessage(msg.chat.id, 'Mohon tunggu...');
    const chatId = msg.chat.id;
    const messageText = match[1]; 
    const openaiToken = process.env.OPENAI_API_KEY;
    const endpointUrl_Turbo = "https://api.openai.com/v1/chat/completions";
  
    await fetch(
       endpointUrl_Turbo,
    {
        body: JSON.stringify({"model": "gpt-3.5-turbo", 
         "messages": [
            {
              role: "user",
              content: messageText,            
            },
          ], 
        "temperature": 0,
        "max_tokens":500}),
        method: "POST",
        headers: {
            "content-type": "application/json",
            Authorization: "Bearer "+ openaiToken,
        },
            }
).then((response) => {
    if (response.ok) {
        response.json().then((json) => {     
            const resultText = json['choices'][0]['message']['content'].replace(/"/g, '\\"'); 
            herrbot.sendMessage(chatId, resultText);  
          });
    }
});
});

// On Regex News
herrbot.onText(newsRegex, async (msg) => {
    newsApiKey = process.env.newsApiKey;
    herrbot.sendMessage(msg.chat.id, 'Mohon tunggu...');
    
    try {
        const timeout = 10000;
        var tanggalSekarang = new Date();
        var formatTanggal = tanggalSekarang.toISOString().split('T')[0];
        console.log(formatTanggal);
        const news = await Promise.race([axios.get('https://newsapi.org/v2/top-headlines?country=id&from='+formatTanggal+'&sortBy=publishedAt&pageSize=3&apiKey='+newsApiKey), new Promise((_, reject) => setTimeout(() => reject(new Error('Waktu habis')), timeout))]);
        const articles = news.data.articles;
        const result = articles.map((article, index) => {
            return `Judul Berita : ${article.title} \nLink Berita : ${article.url} \nTanggal : ${article.publishedAt}`;
          }).join('\n \n');
        const chatId = msg.chat.id;
        herrbot.sendMessage(chatId, 'Berita Terbaru : \n \n' + result);
    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
        herrbot.sendMessage(msg.chat.id, 'Maaf, terjadi kesalahan saat mengambil kutipan. Silakan coba lagi nanti.');
    } 
})

// On Regex Quotes
herrbot.onText(quotesRegex, async (msg) => {
    herrbot.sendMessage(msg.chat.id, 'Mohon tunggu...');
    try {
        const timeout = 10000;
        const quotes = await Promise.race([axios.get('https://api.quotable.io/random'), new Promise((_, reject) => setTimeout(() => reject(new Error('Waktu habis')), timeout))]);
        const content = quotes.data.content;
        const author = quotes.data.author;
        const chatId = msg.chat.id;
        const result = `${content}\n\nAuthor: ${author}`;

        herrbot.sendMessage(chatId, result);
    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
        herrbot.sendMessage(msg.chat.id, 'Maaf, terjadi kesalahan saat mengambil kutipan. Silakan coba lagi nanti.');
    }
});