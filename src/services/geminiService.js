// src/services/geminiService.js

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

/**
 * Sends a prompt to Gemini and returns the text response.
 * @param {string} prompt - The text prompt to send.
 * @returns {Promise<string>} - The AI's response text.
 */
export const getGeminiAdvice = async (prompt) => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is missing. Check your .env file.");
  }

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Safety check to ensure response format is correct
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("AI returned an empty response.");
    }

    return responseText;

  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error; // Re-throw so the UI can show an alert or error message
  }
};