const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


const memory = {}; 
const personaMemory = {};

app.post('/ask', async (req, res) => {
  const { question, playerId, botpersonality } = req.body;
  if (!playerId || !question) return res.status(400).send('Missing playerId or question');

 
  if (!memory[playerId]) memory[playerId] = [];


  memory[playerId].push({ role: 'user', text: question });
  

  if (memory[playerId].length > 100) memory[playerId].shift();

  const contents = [];
  if (botpersonality && botpersonality !== personaMemory[playerId]) {
    personaMemory[playerId] = botpersonality;
    contents.push({
      role: 'user',
      parts: [{ text: `Your Personality: ${botpersonality}. Answer with this personality` }]
    });
  } else if (personaMemory[playerId]) {
   
    contents.push({
      role: 'user',
      parts: [{ text: `Your Personality: ${personaMemory[playerId]}. Answer with this personality` }]
    });
  }

  contents.push(
    ...memory[playerId].map(entry => ({
      role: entry.role === 'user' ? 'user' : 'model',
      parts: [{ text: entry.text }]
    }))
  );
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents }
    );

    const answer = response.data.candidates[0].content.parts[0].text;
 

    memory[playerId].push({ role: 'model', text: answer });
    if (memory[playerId].length > 100) memory[playerId].shift();

    res.json({ answer });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Experienced error with question');
  }
});

app.listen(3000, () => console.log('Server is started on port 3000'));