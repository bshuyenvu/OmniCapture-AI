import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Helper function to safely extract OpenRouter credentials, resolving any accidental swapped config
function getOpenRouterConfig(defaultModel: string = "google/gemini-2.5-flash") {
  let apiKey = process.env.OPENROUTER_API_KEY?.trim() || "";
  let model = process.env.OPENROUTER_MODEL?.trim() || "";

  // If model starts with 'sk-' (usually means user pasted the API key into the model variable)
  if (model.startsWith("sk-")) {
    if (!apiKey.startsWith("sk-")) {
      // If API key is empty or incorrect, swap them
      const temp = apiKey;
      apiKey = model;
      model = (temp && !temp.startsWith("sk-")) ? temp : defaultModel;
    } else {
      // Both start with 'sk-', reset model to the default
      model = defaultModel;
    }
  }

  // If API key is not valid but model starts with sk-, reassign
  if (!apiKey.startsWith("sk-") && model.startsWith("sk-")) {
    apiKey = model;
    model = defaultModel;
  }

  // If we still have an empty or invalid model, use the default
  if (!model || model.startsWith("sk-")) {
    model = defaultModel;
  }

  return { apiKey, model };
}

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
    const { audioData, mimeType, questions } = req.body;

    if (!audioData || !mimeType) {
      return res.status(400).json({ error: "Missing audioData or mimeType" });
    }

    const promptText = `
      You are an expert AI Listening Assistant for English learners. Your task is to transcribe this audio file and perform a complete pedagogical analysis.
      
      Here are the specific requirements:
      1. TRANSCRIPTION (CRITICAL - MAXIMUM PRIORITY): Transcribe the ENTIRE audio perfectly and completely in English from the very first word to the absolute last word. You MUST write down the complete verbatim content. DO NOT summarize, DO NOT truncate, DO NOT omit any sentences, and DO NOT use placeholders like "[...]". Every spoken sentence and phrase must be captured and fully written down to form the complete, unabridged transcript.
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

    // 1. If OpenRouter API key is configured, use OpenRouter API
    const { apiKey: openrouterApiKey, model: openrouterModel } = getOpenRouterConfig("google/gemini-2.5-flash");

    if (openrouterApiKey) {
      console.log(`Analyzing audio using OpenRouter API with model: ${openrouterModel}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai.studio/build",
          "X-Title": "AI Listening Assistant",
        },
        body: JSON.stringify({
          model: openrouterModel,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: promptText,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${audioData}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
      }

      const resJson = await response.json();
      const content = resJson.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenRouter");
      }
      const parsedData = JSON.parse(content);
      return res.json(parsedData);
    }

    // 2. Direct Gemini API client fallback
    if (!ai) {
      return res.status(500).json({
        error: "Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured. Please add one in Settings > Secrets.",
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioData,
      },
    };

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
              description: "The absolute full, complete, and unabridged verbatim English transcript of the entire audio. Do not summarize, truncate, shorten or omit anything.",
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
    const { transcript, questions } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Missing transcript text" });
    }

    const promptText = `
      You are an expert AI Listening Assistant for English learners.
      You are given a transcript of a listening lesson or video and optionally a list of questions.
      
      Here are the specific requirements:
      1. FORMAT TRANSCRIPT (CRITICAL - MAXIMUM PRIORITY): You must output the ENTIRE, complete text of the transcript. Correct any typos but DO NOT shorten, DO NOT truncate, and DO NOT summarize any part of the transcript. Keep the full content from start to finish formatted beautifully with paragraphs.
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

    // 1. If OpenRouter API key is configured, use OpenRouter API
    const { apiKey: openrouterApiKey, model: openrouterModel } = getOpenRouterConfig("google/gemini-2.5-flash");

    if (openrouterApiKey) {
      console.log(`Analyzing transcript using OpenRouter API with model: ${openrouterModel}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai.studio/build",
          "X-Title": "AI Listening Assistant",
        },
        body: JSON.stringify({
          model: openrouterModel,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: promptText,
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
      }

      const resJson = await response.json();
      const content = resJson.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenRouter");
      }
      const parsedData = JSON.parse(content);
      return res.json(parsedData);
    }

    // 2. Direct Gemini API client fallback
    if (!ai) {
      return res.status(500).json({
        error: "Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured. Please add one in Settings > Secrets.",
      });
    }

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
              description: "The absolute full, complete, and unabridged formatted English transcript from start to finish. Do not truncate, edit down, shorten or omit anything.",
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

// Endpoint 3: OpenRouter AI Chat integration
app.post("/api/openrouter-chat", async (req, res) => {
  try {
    const { message } = req.body;

    // 8. Kiểm tra message không được để trống.
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Câu hỏi (message) không được để trống." });
    }

    // 2. Đọc API key từ secret phía server (đã tích hợp cơ chế tự phục hồi cấu hình bị nhầm lẫn).
    const { apiKey: openrouterApiKey, model: openrouterModel } = getOpenRouterConfig("google/gemma-4-26b-a4b-it:free");

    // 10. Xử lý thiếu OPENROUTER_API_KEY
    if (!openrouterApiKey) {
      return res.status(500).json({ 
        error: "Cấu hình thiếu OPENROUTER_API_KEY phía máy chủ. Vui lòng thiết lập API Key trong phần cài đặt." 
      });
    }

    // 5 & 6 & 7. Gửi yêu cầu đến OpenRouter
    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": openrouterModel,
          "messages": [
            {
              "role": "system",
              "content": "Bạn là trợ lý AI hữu ích, trả lời rõ ràng bằng tiếng Việt."
            },
            {
              "role": "user",
              "content": message
            }
          ],
          "max_tokens": 1000
        })
      });
    } catch (networkError: any) {
      // 10. Xử lý lỗi kết nối mạng
      console.error("OpenRouter network connection error:", networkError);
      return res.status(503).json({ 
        error: "Không thể kết nối đến máy chủ OpenRouter. Vui lòng kiểm tra kết nối mạng của máy chủ." 
      });
    }

    // 10. Xử lý các lỗi HTTP status
    if (!response.ok) {
      const status = response.status;
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {}

      console.error(`OpenRouter error response (status ${status}):`, errorText);

      if (status === 401) {
        // Lỗi xác thực 401
        return res.status(401).json({ 
          error: "Lỗi xác thực với OpenRouter (Mã lỗi 401). Vui lòng kiểm tra lại tính chính xác của OPENROUTER_API_KEY." 
        });
      } else if (status === 402 || status === 429) {
        // Hết hạn mức 402 hoặc 429
        return res.status(status).json({ 
          error: "Lỗi giới hạn lượt truy cập hoặc tài khoản hết số dư / hết hạn mức từ OpenRouter (Mã lỗi 402/429). Vui lòng thử lại sau." 
        });
      } else {
        return res.status(status).json({ 
          error: `OpenRouter trả về lỗi hệ thống (Mã lỗi ${status}): ${errorText || response.statusText}` 
        });
      }
    }

    const data: any = await response.json();

    // 10. Xử lý OpenRouter không trả content
    if (!data || !data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("OpenRouter invalid response body structure:", data);
      return res.status(502).json({ 
        error: "OpenRouter không trả về nội dung phản hồi hợp lệ (Missing choice content)." 
      });
    }

    const reply = data.choices[0].message.content;
    const model = data.model || "google/gemma-4-26b-a4b-it:free";

    // 9. Trả về cho client
    return res.json({
      reply,
      model
    });

  } catch (error: any) {
    console.error("General error in /api/openrouter-chat:", error);
    return res.status(500).json({ 
      error: error.message || "Đã xảy ra lỗi không xác định khi xử lý yêu cầu chat." 
    });
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
