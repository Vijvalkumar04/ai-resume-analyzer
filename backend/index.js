require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFParse } = require('pdf-parse'); // Updated import for the new version
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 5000;

// Allow the React frontend to talk to this backend
app.use(cors());
app.use(express.json());

// Set up Multer to hold the uploaded PDF in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

// Initialize the AI engine using the key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The main route that does all the work
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
    try {
        // 1. Check if a file was actually uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF uploaded.' });
        }

        console.log("PDF received, extracting text...");

        // 2. Extract the raw text from the PDF (Updated Syntax)
        const parser = new PDFParse({ data: req.file.buffer });
        const extractedData = await parser.getText();
        const resumeText = extractedData.text;

        console.log("Text extracted, sending to AI...");

        // 3. The exact instructions for the AI
        const prompt = `
        You are a ruthless, senior technical recruiter for top-tier tech companies. Analyze the following resume text.
        Do not be polite; be highly critical and actionable.
        
        Return your analysis STRICTLY as a JSON object with these exact keys:
        {
          "ats_score": (Number between 1-100),
          "missing_keywords": [(Array of strings of missing tech skills)],
          "weak_bullets": [(Array of objects with "original" and "improvement" strings)],
          "overall_verdict": (A one sentence blunt summary)
        }

        Resume Text:
        ${resumeText}
        `;

        // 4. Send to Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Clean up formatting in case the AI wraps the JSON in markdown blocks
        text = text.replace(/```json/g, '').replace(/```/g, '');
        
        const jsonResponse = JSON.parse(text);

        // 5. Send the final analysis back to the React app
        res.json(jsonResponse);
        console.log("Analysis complete and sent to frontend!");

    } catch (error) {
        console.error('Error analyzing resume:', error);
        res.status(500).json({ error: 'Something went wrong during analysis.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});