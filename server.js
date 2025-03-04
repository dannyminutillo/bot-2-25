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
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// ✅ Explicitly handle CORS preflight requests
app.options('*', cors(corsOptions));


app.use(bodyParser.json());
const path = require('path');
app.use(express.static(path.join(__dirname)));
// app.use(cors());
// app.use(bodyParser.json());
// const path = require('path');
// app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Route to Seed Database (Run Once)
app.post('/seed', async (req, res) => {
    try {
        await supabase.from('business_info').delete().neq('id', 0);

        const data = [
            { topic: "Dr. Scott Alexander", details: "Dr. Scott Alexander is a fourth-generation Arizona native and a renowned expert in hair restoration. He received his Bachelor of Science degree from Brigham Young University, with a minor in art and design. His residency training in general surgery at Mount Sinai Medical Center, Cleveland, Ohio, laid the foundation for his expertise in hair restoration." },
            { topic: "Advanced Techniques", details: "Dr. Alexander has mastered advanced techniques, including the lateral-slit technique and Follicular Unit Extraction (FUE), under the mentorship of renowned hair restoration surgeons. He emphasizes the importance of custom-made blades for recipient site creation, ensuring optimal results." },
            { topic: "Professional Recognition", details: "As a member of prestigious organizations such as The American Hair Loss Association and The International Alliance of Hair Restoration Surgery, Dr. Alexander is recognized for his integrity, skill, and ability to deliver the most advanced forms of hair restoration surgery." },
            { topic: "Clinic Excellence", details: "Featured as one of the best hair transplant doctors by Ape to Gentleman, Dr. Alexander’s commitment to excellence is evident in his meticulous approach. His clinic offers microsurgical, highly advanced, artistic hair restorations, setting the standard for quality care in the field." },
            { topic: "Surgical Procedures", details: "Dr. Alexander offers microsurgical, highly advanced, artistic hair restorations for men and women. His experience as a general surgeon means he treats every surgical procedure as if it were being performed in a hospital operating room. He is one of a small number of restoration surgeons who use sterile techniques along with sterile gowns, gloves, and drapes while removing the donor tissue." },
            { topic: "Recognition", details: "Spencer ‘Spex’ Stevenson, a well-known hair loss mentor, has authored a list of the top 20 hair restoration surgeons in the world. Dr. Scott Alexander has been selected on that list." },
            { topic: "Commitment to Excellence", details: "Dr. Alexander has dedicated decades of his life to providing excellent hair restoration services to countless patients, using the best technology available with a commitment to artistry in hair." },
            { topic: "Hours", details: "Monday-Friday: 8am-5pm" },
            { topic: "Contact", details: "Email: staff@drscottalexander.com | Phone: (602) 956-8800" },
            { topic: "Address", details: "2222E. Highland Ave STE 314, Phoenix, AZ 85016" },
            { topic: "Services", details: "At Biltmore Hair Restoration in Arizona, Dr. Scott Alexander specializes in both Follicular Unit Transplantation (FUT) and Follicular Unit Extraction (FUE), offering patients personalized solutions to achieve natural-looking results." },
            { topic: "FUT vs. FUE: Cost Comparison", details: "While both FUT and FUE yield excellent results, their cost structures differ due to the techniques involved:\nFUT: Generally more affordable, FUT offers a cost-effective solution for patients requiring a large number of grafts. The procedure’s efficiency means it can be completed faster, which often reduces overall expenses.\nFUE: FUE is typically more expensive due to the time-intensive process of extracting individual follicles. However, its benefits—such as no visible scarring and quicker recovery—justify the higher price for many patients.\nAt Biltmore Hair Restoration, Dr. Alexander provides both options, helping patients choose the best method based on their goals, hair type, and budget." },
            { topic: "Out of State Patients", details: "Our clientele consists of hair restoration patients traveling from all over the world to our Biltmore Hair Restoration facility in Phoenix, AZ. Dr. Alexander believes patients shouldn’t have to incur additional traveling costs to receive the best hair transplant results.\nFor this reason, we offer an ARTAS hair restoration travel incentive of $500 for our patients traveling from outside the Phoenix area. For additional information on this topic please fill out the contact form and mention that you’re out of state." },
            { topic: "Gallery", details: "Gallery of before and after photos: https://biltmorehairrestoration.com/gallery/" }
        ];

        const { error } = await supabase.from('business_info').insert(data);
        if (error) throw error;

        res.json({ message: '✅ Data successfully added to the database' });
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        res.status(500).json({ error: 'Failed to seed database' });
    }
});

// Fetch Business Information
app.get('/info', async (req, res) => {
    try {
        const { data, error } = await supabase.from('business_info').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching information:', error);
        res.status(500).json({ error: 'Failed to fetch information' });
    }
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