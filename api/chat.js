// api/chat.js
export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get the prompt from the frontend request
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 3. Get your API Key from the environment variables
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Server Error: API Key missing' });
  }

  try {
    // 4. Call Google's API
    // Note: We use the same model version you were using in your frontend
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );

    const data = await response.json();

    // 5. Check for errors from Google
    if (!response.ok) {
      throw new Error(data.error?.message || 'Error fetching from Gemini');
    }

    // 6. Send the successful response back to your frontend
    res.status(200).json(data);

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message });
  }
}