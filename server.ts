import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable large JSON bodies for base64 audio uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Endpoint 1: Analyze audio (base64 data)
app.post("/api/analyze-audio", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please add it in Settings > Secrets in the AI Studio UI.",
      });
    }

    const { audioData, mimeType, questions } = req.body;

    if (!audioData || !mimeType) {
      return res.status(400).json({ error: "Missing audioData or mimeType" });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioData,
      },
    };

    const promptText = `
      You are an expert AI Listening Assistant for English learners. Your task is to transcribe this audio file and perform a complete pedagogical analysis.
      
      Here are the specific requirements:
      1. TRANSCRIPTION: Transcribe the audio perfectly in English. Do not omit words.
      2. SUMMARY: Provide a concise Vietnamese summary of the listening content (about 2-3 sentences).
      3. QUESTIONS & PREDICTIONS: 
         - Analyze any user-provided questions (listed below).
         - Predict the correct answer for each question based on the audio.
         - If no specific questions are provided, analyze the transcript and automatically identify 3 typical listening-test questions (like IELTS, TOEIC, or Moodle multiple choice/fill-in-the-blank) that could be asked, along with their predicted answers.
         - For each question, provide a detailed, supportive explanation in Vietnamese showing where the answer lies in the transcript, matching key words, synonyms, or acoustic clues.
      4. VOCABULARY ENGINE:
         - Identify 5 to 8 key, interesting, or academic vocabulary words/phrases from the audio.
         - For each word/phrase, provide: standard IPA, part of speech, brief English definition, precise Vietnamese meaning, a high-quality example sentence using the word from the transcript or general context, and the Vietnamese translation of that example sentence.
      5. KEY TAKEAWAYS: Provide 3 strategic listening tips or phonetic takeaways (e.g. connected speech, homophones, or word stress observed in this audio) that will help the student listen better.

      User-pasted questions (if any):
      ${questions ? questions : "(None provided. Please auto-generate 3 relevant comprehension questions based on the audio content.)"}
    `;

    const textPart = { text: promptText };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [audioPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.STRING,
              description: "The full English transcript of the audio.",
            },
            summary: {
              type: Type.STRING,
              description: "A 2-3 sentence Vietnamese summary of the listening content.",
            },
            predictions: {
              type: Type.ARRAY,
              description: "List of answered/predicted questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: {
                    type: Type.STRING,
                    description: "Number or ID of the question.",
                  },
                  questionText: {
                    type: Type.STRING,
                    description: "The question prompt or fill-in-the-blank item.",
                  },
                  predictedAnswer: {
                    type: Type.STRING,
                    description: "The predicted correct answer or word to fill in.",
                  },
                  confidence: {
                    type: Type.STRING,
                    description: "Confidence level: 'high', 'medium', or 'low'.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Detailed supportive Vietnamese explanation pointing out exactly what was heard and matching keywords.",
                  },
                },
                required: ["questionNumber", "questionText", "predictedAnswer", "confidence", "explanation"],
              },
            },
            vocabulary: {
              type: Type.ARRAY,
              description: "Key academic or interesting vocabulary words extracted.",
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "The English word or phrase." },
                  ipa: { type: Type.STRING, description: "IPA pronunciation guide, e.g., /əˈtɑːnəmi/." },
                  partOfSpeech: { type: Type.STRING, description: "e.g., noun, verb, adjective, idiom." },
                  definition: { type: Type.STRING, description: "English definition." },
                  vietnamese: { type: Type.STRING, description: "Vietnamese meaning." },
                  example: { type: Type.STRING, description: "Example English sentence using this word." },
                  exampleTranslation: { type: Type.STRING, description: "Vietnamese translation of the example sentence." },
                },
                required: ["word", "ipa", "partOfSpeech", "definition", "vietnamese", "example", "exampleTranslation"],
              },
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 strategic listening tips or phonetic takeaways (connected speech, linking, or key pronunciation warnings) from this audio.",
            },
          },
          required: ["transcript", "summary", "predictions", "vocabulary", "keyTakeaways"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/analyze-audio:", error);
    res.status(500).json({ error: error.message || "An error occurred during audio analysis" });
  }
});

// Endpoint 2: Analyze transcript text directly (useful if user pastes transcript + questions)
app.post("/api/analyze-transcript", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please add it in Settings > Secrets in the AI Studio UI.",
      });
    }

    const { transcript, questions } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Missing transcript text" });
    }

    const promptText = `
      You are an expert AI Listening Assistant for English learners.
      You are given a transcript of a listening lesson or video and optionally a list of questions.
      
      Here are the specific requirements:
      1. FORMAT TRANSCRIPT: Correct any typos in the transcript text and output it formatted beautifully with paragraphs.
      2. SUMMARY: Provide a concise Vietnamese summary of the listening content (about 2-3 sentences).
      3. QUESTIONS & PREDICTIONS: 
         - Analyze any user-provided questions (listed below).
         - Predict the correct answer for each question based on the transcript.
         - If no specific questions are provided, analyze the transcript and automatically identify 3 typical listening-test questions (like IELTS, TOEIC multiple choice/fill-in-the-blank) that could be asked, along with their predicted answers.
         - For each question, provide a detailed, supportive explanation in Vietnamese showing where the answer lies in the transcript, matching key words or synonyms.
      4. VOCABULARY ENGINE:
         - Identify 5 to 8 key, interesting, or academic vocabulary words/phrases from the text.
         - For each word/phrase, provide: standard IPA, part of speech, brief English definition, precise Vietnamese meaning, a high-quality example sentence using the word, and the Vietnamese translation of that example sentence.
      5. KEY TAKEAWAYS: Provide 3 strategic listening tips or phonetic takeaways (e.g. connected speech, homophones, or word stress) that relate to this transcript content.

      Transcript:
      ${transcript}

      User-pasted questions (if any):
      ${questions ? questions : "(None provided. Please auto-generate 3 relevant comprehension questions based on the transcript.)"}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.STRING,
              description: "The formatted English transcript.",
            },
            summary: {
              type: Type.STRING,
              description: "A 2-3 sentence Vietnamese summary of the listening content.",
            },
            predictions: {
              type: Type.ARRAY,
              description: "List of answered/predicted questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: {
                    type: Type.STRING,
                    description: "Number or ID of the question.",
                  },
                  questionText: {
                    type: Type.STRING,
                    description: "The question prompt or fill-in-the-blank item.",
                  },
                  predictedAnswer: {
                    type: Type.STRING,
                    description: "The predicted correct answer or word to fill in.",
                  },
                  confidence: {
                    type: Type.STRING,
                    description: "Confidence level: 'high', 'medium', or 'low'.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Detailed supportive Vietnamese explanation pointing out exactly where the answer is found and matching keywords.",
                  },
                },
                required: ["questionNumber", "questionText", "predictedAnswer", "confidence", "explanation"],
              },
            },
            vocabulary: {
              type: Type.ARRAY,
              description: "Key academic or interesting vocabulary words extracted.",
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "The English word or phrase." },
                  ipa: { type: Type.STRING, description: "IPA pronunciation guide, e.g., /əˈtɑːnəmi/." },
                  partOfSpeech: { type: Type.STRING, description: "e.g., noun, verb, adjective, idiom." },
                  definition: { type: Type.STRING, description: "English definition." },
                  vietnamese: { type: Type.STRING, description: "Vietnamese meaning." },
                  example: { type: Type.STRING, description: "Example English sentence using this word." },
                  exampleTranslation: { type: Type.STRING, description: "Vietnamese translation of the example sentence." },
                },
                required: ["word", "ipa", "partOfSpeech", "definition", "vietnamese", "example", "exampleTranslation"],
              },
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 strategic listening tips or phonetic takeaways from this text content.",
            },
          },
          required: ["transcript", "summary", "predictions", "vocabulary", "keyTakeaways"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/analyze-transcript:", error);
    res.status(500).json({ error: error.message || "An error occurred during transcript analysis" });
  }
});

// Configure Vite or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
