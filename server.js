require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

// Middleware
const corsOptions = {
    origin: 'https://amplify-ai-demo.netlify.app', // Your Netlify frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// ✅ Explicitly handle CORS for all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://amplify-ai-demo.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// ✅ Handle Preflight Requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://amplify-ai-demo.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204); // No content response
});

// Middleware
app.use(bodyParser.json());
const path = require('path');
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Chat Route
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const { data: infoDocs, error } = await supabase.from('business_info').select('*');
        if (error) throw error;

        const infoText = infoDocs.map(doc => `${doc.topic}: ${doc.details}`).join("\n");

        const prompt = `You are a friendly customer service AI for Biltmore Surgical Hair Restoration in Phoenix, Arizona. Use emojis in responses, but in moderation. Always ask if they'd like to book a consultation. Don't be salesy. Provide a warm and inviting tone.\n\nBusiness Information:\n${infoText}\n\nUser: ${userMessage}\nAI Response (encourage booking an appointment):`;

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [{ role: 'system', content: prompt }, { role: 'user', content: userMessage }],
            temperature: 0.7
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error('❌ Chatbot error:', error.response?.data || error.message);
        res.status(500).json({ error: 'An error occurred, please try again later.' });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
