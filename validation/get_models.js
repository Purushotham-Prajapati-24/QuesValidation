require('dotenv').config();
const axios = require('axios');

async function getModels() {
    try {
        const response = await axios.get('https://api.sambanova.ai/v1/models', {
            headers: {
                Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`
            }
        });
        console.log("AVAILABLE MODELS:");
        response.data.data.forEach(m => console.log(m.id));
    } catch (err) {
        console.error("Error fetching models:", err.response ? err.response.data : err.message);
    }
}

getModels();
