const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const conversationMemory = [];

app.post('/ask', async (req, res) => {
  const question = req.body.question;
  conversationMemory.push({ role: 'user', text: question });


  if (conversationMemory.length > 10) {
    conversationMemory.shift(); 
  }


  const contents = conversationMemory.map(entry => ({
    role: entry.role === 'user' ? 'user' : 'model',
    parts: [{ text: entry.text }]
  }));
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents }
    );

    const answer = response.data.candidates[0].content.parts[0].text;
 


    conversationMemory.push({ role: 'model', text: answer });


    if (conversationMemory.length > 10) {
      conversationMemory.shift();
    }

    res.json({ answer });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Experienced error with question');
  }
});

app.listen(3000, () => console.log('Server is started on port 3000'));