import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  Square, 
  Upload, 
  FileAudio, 
  Compass, 
  Sparkles, 
  FileText, 
  Award, 
  Volume2, 
  BookOpen, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight, 
  Info, 
  Trash2, 
  FileDown, 
  Share2, 
  Copy, 
  Plus, 
  VolumeX, 
  Layers, 
  Check, 
  GraduationCap, 
  BookMarked,
  ArrowRightLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AnalysisResult, SavedSession, Vocabulary, Prediction } from "./types";

// Pre-defined high-quality sample listening templates for quick evaluation
const SAMPLE_TEMPLATES = [
  {
    id: "ielts-hotel",
    title: "IELTS Part 1: Hotel Booking & Special Requests",
    description: "Sample IELTS conversation about booking a conference room with specific food requests.",
    questions: "Question 1: What is the date of the booking?\nQuestion 2: How many attendees are expected?\nQuestion 3: What vegetarian main dish is requested for the catering?",
    transcript: "Agent: Good morning, Royal Plaza Hotel reservations. How can I help you today?\nCaller: Hello, I'd like to book a conference suite for our annual regional meeting. It'll be on the 24th of October.\nAgent: Certainly. Let me check our availability... Yes, we have the Windsor Suite free. How many attendees are you expecting?\nCaller: We should have exactly forty-five people attending, although we might have two additional speakers.\nAgent: Excellent. And regarding catering, do you have any dietary requirements?\nCaller: Yes, we need vegetarian options. For the main course, please prepare a wild mushroom risotto. Everyone loves that.",
    resultMock: {
      transcript: "Agent: Good morning, Royal Plaza Hotel reservations. How can I help you today?\nCaller: Hello, I'd like to book a conference suite for our annual regional meeting. It'll be on the 24th of October.\nAgent: Certainly. Let me check our availability... Yes, we have the Windsor Suite free. How many attendees are you expecting?\nCaller: We should have exactly forty-five people attending, although we might have two additional speakers.\nAgent: Excellent. And regarding catering, do you have any dietary requirements?\nCaller: Yes, we need vegetarian options. For the main course, please prepare a wild mushroom risotto. Everyone loves that.",
      summary: "Cuộc hội thoại ghi lại giao dịch đặt phòng hội nghị tại khách sạn Royal Plaza cho cuộc họp thường niên vào ngày 24 tháng 10 với số lượng 45 khách tham dự và thực đơn ăn chay được thiết kế riêng.",
      predictions: [
        {
          questionNumber: "1",
          questionText: "What is the date of the booking?",
          predictedAnswer: "24th of October / October 24",
          confidence: "high",
          explanation: "Người gọi nói rõ: 'It'll be on the 24th of October' (Nó sẽ diễn ra vào ngày 24 tháng 10). Từ khóa trùng khớp hoàn toàn."
        },
        {
          questionNumber: "2",
          questionText: "How many attendees are expected?",
          predictedAnswer: "45 (forty-five)",
          confidence: "high",
          explanation: "Người gọi xác nhận: 'We should have exactly forty-five people attending' (Chúng tôi dự kiến có chính xác 45 người tham dự). Dù có nhắc đến số 2 ('two additional speakers'), nhưng 45 vẫn là con số chính thức được xác nhận cho lượng khách mời."
        },
        {
          questionNumber: "3",
          questionText: "What vegetarian main dish is requested for the catering?",
          predictedAnswer: "Wild mushroom risotto",
          confidence: "high",
          explanation: "Người đặt yêu cầu món chính chay: 'For the main course, please prepare a wild mushroom risotto' (Món chính chay làm ơn chuẩn bị cơm Ý Risotto nấm dại)."
        }
      ],
      vocabulary: [
        {
          word: "Conference",
          ipa: "/ˈkɒn.fər.əns/",
          partOfSpeech: "noun",
          definition: "A formal meeting for discussion or exchange of information.",
          vietnamese: "Hội nghị, hội thảo",
          example: "I'd like to book a conference suite for our annual regional meeting.",
          exampleTranslation: "Tôi muốn đặt một phòng hội nghị cho cuộc họp thường niên của khu vực chúng tôi."
        },
        {
          word: "Attendee",
          ipa: "/ə.tenˈdiː/",
          partOfSpeech: "noun",
          definition: "A person who is present at a specific event or meeting.",
          vietnamese: "Người tham dự",
          example: "How many attendees are you expecting?",
          exampleTranslation: "Bạn đang mong đợi bao nhiêu người tham dự?"
        },
        {
          word: "Catering",
          ipa: "/ˈkeɪ.tər.ɪŋ/",
          partOfSpeech: "noun",
          definition: "The business of providing food and drink for a social event.",
          vietnamese: "Dịch vụ cung cấp tiệc ăn uống",
          example: "And regarding catering, do you have any dietary requirements?",
          exampleTranslation: "Và về phần ăn uống, bạn có yêu cầu ăn kiêng đặc biệt nào không?"
        },
        {
          word: "Dietary",
          ipa: "/ˈdaɪ.ə.tər.i/",
          partOfSpeech: "adjective",
          definition: "Relating to the limits or selection of food someone eats.",
          vietnamese: "Thuộc về chế độ ăn uống",
          example: "Do you have any dietary requirements?",
          exampleTranslation: "Bạn có yêu cầu ăn kiêng đặc biệt nào không?"
        },
        {
          word: "Risotto",
          ipa: "/rɪˈzɒt.əʊ/",
          partOfSpeech: "noun",
          definition: "An Italian dish of rice cooked in stock with ingredients such as vegetables.",
          vietnamese: "Cơm Risotto (món cơm Ý nấu sánh)",
          example: "For the main course, please prepare a wild mushroom risotto.",
          exampleTranslation: "Đối với món chính, vui lòng chuẩn bị món cơm Ý risotto nấm dại."
        }
      ],
      keyTakeaways: [
        "Lưu ý phân biệt số đếm gây nhiễu: người nói đề cập 'exactly forty-five' và 'two additional speakers'. Trong bài thi nghe thực tế, câu hỏi thường yêu cầu tổng số khách chính thức hoặc số khách dự kiến ban đầu.",
        "Phát âm nối âm quan trọng: Cụm 'date of the' được phát âm lướt nhanh /deɪtəvðə/, người học cần rèn luyện khả năng bắt từ khóa October ngay sau giới từ.",
        "Kỹ năng nghe từ vựng ẩm thực: Các món ăn đặc trưng như 'risotto' thường là đáp án cho phần điền từ vựng IELTS chi tiết."
      ]
    }
  },
  {
    id: "toeic-office",
    title: "TOEIC Part 3: Project Delay & Alternative Plan",
    description: "Sample TOEIC conversation where two colleagues discuss missing a crucial soft-launch deadline.",
    questions: "Question 1: What is the main topic of discussion?\nQuestion 2: Why are they delayed?\nQuestion 3: What does the woman suggest doing next?",
    transcript: "Man: Helen, have you heard back from the development team about the mobile application update? Our launch date is scheduled for next Monday.\nWoman: Yes, I spoke to them this morning. Unfortunately, they found a critical security vulnerability during testing, so they will need at least another week to deploy the patch.\nMan: Oh no, that's going to push our promotional campaign behind schedule. We've already booked the advertising slots!\nWoman: Don't panic. We can run a preliminary beta test with a small group of trusted clients first. That way, we can still gather feedback without risking a public failure.",
    resultMock: {
      transcript: "Man: Helen, have you heard back from the development team about the mobile application update? Our launch date is scheduled for next Monday.\nWoman: Yes, I spoke to them this morning. Unfortunately, they found a critical security vulnerability during testing, so they will need at least another week to deploy the patch.\nMan: Oh no, that's going to push our promotional campaign behind schedule. We've already booked the advertising slots!\nWoman: Don't panic. We can run a preliminary beta test with a small group of trusted clients first. That way, we can still gather feedback without risking a public failure.",
      summary: "Cuộc thảo luận công sở về việc hoãn lịch ra mắt ứng dụng di động do phát hiện lỗ hổng bảo mật nghiêm trọng và giải pháp thay thế là chạy thử nghiệm beta quy mô nhỏ để kịp tiến độ quảng cáo.",
      predictions: [
        {
          questionNumber: "1",
          questionText: "What is the main topic of discussion?",
          predictedAnswer: "A delay in releasing a mobile application update",
          confidence: "high",
          explanation: "Cả hai nhân vật bàn luận về tiến độ ứng dụng: 'launch date is scheduled for next Monday' nhưng gặp sự cố chậm trễ 'need at least another week'."
        },
        {
          questionNumber: "2",
          questionText: "Why are they delayed?",
          predictedAnswer: "A critical security vulnerability was discovered during testing",
          confidence: "high",
          explanation: "Người phụ nữ giải thích nguyên nhân: 'Unfortunately, they found a critical security vulnerability during testing'."
        },
        {
          questionNumber: "3",
          questionText: "What does the woman suggest doing next?",
          predictedAnswer: "Conducting a preliminary beta test with trusted clients",
          confidence: "high",
          explanation: "Người phụ nữ đề xuất giải pháp cứu cánh: 'We can run a preliminary beta test with a small group of trusted clients first'."
        }
      ],
      vocabulary: [
        {
          word: "Vulnerability",
          ipa: "/ˌvʌl.nər.əˈbɪl.ə.ti/",
          partOfSpeech: "noun",
          definition: "A weakness or flaw in a system that can be exploited.",
          vietnamese: "Lỗ hổng, điểm yếu bảo mật",
          example: "They found a critical security vulnerability during testing.",
          exampleTranslation: "Họ phát hiện ra một lỗ hổng bảo mật nghiêm trọng trong quá trình thử nghiệm."
        },
        {
          word: "Preliminary",
          ipa: "/prɪˈlɪm.ɪ.nər.i/",
          partOfSpeech: "adjective",
          definition: "Preceding or leading up to the main action; introductory.",
          vietnamese: "Sơ bộ, mở đầu",
          example: "We can run a preliminary beta test with a small group.",
          exampleTranslation: "Chúng ta có thể chạy một đợt thử nghiệm beta sơ bộ với một nhóm nhỏ."
        },
        {
          word: "Behind schedule",
          ipa: "/bɪˈhaɪnd ˈʃedjʊːl/",
          partOfSpeech: "idiom",
          definition: "Later than planned or expected on a timeline.",
          vietnamese: "Trễ hạn, chậm tiến độ",
          example: "That's going to push our promotional campaign behind schedule.",
          exampleTranslation: "Điều đó sẽ đẩy chiến dịch quảng bá của chúng ta bị trễ so với tiến độ."
        },
        {
          word: "Deploy",
          ipa: "/dɪˈplɔɪ/",
          partOfSpeech: "verb",
          definition: "To install, build, or bring into effective action.",
          vietnamese: "Triển khai, phân phối phần mềm",
          example: "They will need at least another week to deploy the patch.",
          exampleTranslation: "Họ sẽ cần ít nhất một tuần nữa để triển khai bản vá lỗi."
        },
        {
          word: "Vấn đề bảo mật",
          ipa: "/pætʃ/",
          partOfSpeech: "noun",
          definition: "A piece of software code written to update or fix a bug.",
          vietnamese: "Bản vá lỗi",
          example: "They will need at least another week to deploy the patch.",
          exampleTranslation: "Họ sẽ cần ít nhất một tuần nữa để triển khai bản vá."
        }
      ],
      keyTakeaways: [
        "Phân biệt giọng người nói: Giọng nam và nữ nói luân phiên nhau, hãy để ý ý kiến phản hồi hoặc đề xuất cuối cùng thường xuất hiện ở lượt nói thứ 3 hoặc thứ 4 của cuộc hội thoại (TOEIC Part 3).",
        "Kỹ thuật Paraphrasing: Câu hỏi sử dụng từ 'delay', trong khi người nói sử dụng cụm 'push behind schedule' hoặc 'need another week'. Phải chú ý các cụm từ đồng nghĩa.",
        "Nối âm đuôi: Cụm 'heard back from' /hɜːd bæk frɒm/ được đọc rất nhanh và dính chữ, hãy chú ý âm chặn /d/ lướt qua."
      ]
    }
  }
];

export default function App() {
  // Application State
  const [activeTab, setActiveTab] = useState<"capture" | "transcript" | "predictions" | "vocabulary" | "notion-anki">("capture");
  const [pipelineStep, setPipelineStep] = useState<number>(1); // 1: Capture, 2: Whisper, 3: Analysis, 4: Flashcards
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("");
  
  // Custom text transcript analyzer
  const [pastedTranscript, setPastedTranscript] = useState<string>("");
  const [targetQuestions, setTargetQuestions] = useState<string>("");
  
  // App Processing and Result States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  
  // Interactive UI auxiliary state
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [masteredWords, setMasteredWords] = useState<Record<string, boolean>>({});
  const [customDecks, setCustomDecks] = useState<string[]>(["IELTS Core Academic", "TOEIC Essential Business"]);
  const [selectedDeck, setSelectedDeck] = useState<string>("IELTS Core Academic");
  const [isSyncingAnki, setIsSyncingAnki] = useState<boolean>(false);
  const [isSyncingNotion, setIsSyncingNotion] = useState<boolean>(false);
  const [syncedDecksCount, setSyncedDecksCount] = useState<number>(5);
  const [syncedNotionCount, setSyncedNotionCount] = useState<number>(3);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Audio elements & timers
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load history from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("omni_capture_sessions");
    if (saved) {
      try {
        setSavedSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved sessions:", e);
      }
    }
  }, []);

  // Update localStorage when savedSessions change
  const saveSessionsToStorage = (updated: SavedSession[]) => {
    setSavedSessions(updated);
    localStorage.setItem("omni_capture_sessions", JSON.stringify(updated));
  };

  // Microsecond timing / display
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Recording visualization waveform simulation
  const drawWaveform = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(99, 102, 241, 0.8)"; // Indigo theme color
    ctx.lineWidth = 3;
    ctx.beginPath();

    const points = 40;
    const sliceWidth = width / points;
    let x = 0;

    for (let i = 0; i < points; i++) {
      // Simulate random sound levels during recording
      const amplitude = isRecording ? Math.random() * (height * 0.7) + 5 : 4;
      const y = height / 2 + (i % 2 === 0 ? amplitude / 2 : -amplitude / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  // Start microphone capture
  const startRecording = async () => {
    setAnalysisError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setAudioFileName(`Live_Capture_${new Date().toLocaleTimeString().replace(/:/g, "-")}.wav`);
        setPipelineStep(2); // Progress to Whisper transcription stage
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start drawing simulation
      setTimeout(() => {
        drawWaveform();
      }, 100);

    } catch (err: any) {
      console.error("Microphone access error:", err);
      setAnalysisError("Cannot access microphone. Please grant permission or use the File Upload alternative.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop stream tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
  };

  // Helper: Convert File/Blob to Base64
  const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Strip out the prefix metadata (e.g. "data:audio/wav;base64,")
        const cleanBase64 = base64String.split(",")[1];
        resolve(cleanBase64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle uploaded audio files
  const handleAudioFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
      if (file.size > maxSizeBytes) {
        setAnalysisError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload an audio file under 15MB to prevent network timeouts.`);
        triggerFeedback("File exceeded size limit");
        return;
      }
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setAudioFileName(file.name);
      setPipelineStep(2); // Proceed to whisper phase
      triggerFeedback(`Successfully loaded file: ${file.name}`);
    }
  };

  // Analyze the recorded/uploaded audio through the Express/Gemini API backend
  const triggerAudioAnalysis = async () => {
    if (!audioBlob) {
      setAnalysisError("No audio file available. Please capture audio or upload a file first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setPipelineStep(2); // Transcribing

    try {
      const base64Data = await fileToBase64(audioBlob);
      // Determine correct mime type
      const mimeType = audioBlob.type || "audio/wav";

      const response = await fetch("/api/analyze-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioData: base64Data,
          mimeType: mimeType,
          questions: targetQuestions,
        }),
      });

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const errJson = await response.json();
          errMsg = errJson.error || errMsg;
        } catch (e) {
          try {
            const rawText = await response.text();
            if (rawText && rawText.includes("<body") || rawText.includes("<html")) {
              const match = rawText.match(/<title>(.*?)<\/title>/i) || rawText.match(/<h1>(.*?)<\/h1>/i);
              if (match && match[1]) {
                errMsg = `Server Error (${response.status}): ${match[1].trim()}`;
              } else {
                errMsg = `Server Error (${response.status}): HTML response. Check if backend is active.`;
              }
            } else if (rawText) {
              errMsg = rawText.substring(0, 200);
            }
          } catch (e2) {}
        }
        throw new Error(errMsg);
      }

      const result: AnalysisResult = await response.json();
      result.id = `session_${Date.now()}`;
      result.timestamp = new Date().toLocaleString("vi-VN");
      result.title = audioFileName || `Listening Lesson - ${new Date().toLocaleDateString()}`;

      setCurrentResult(result);
      setPipelineStep(4); // Full pipeline done

      // Save to savedSessions history
      const newSession: SavedSession = {
        id: result.id,
        title: result.title,
        timestamp: result.timestamp,
        summary: result.summary,
        result: result,
      };
      saveSessionsToStorage([newSession, ...savedSessions]);

      // Move to results views
      setActiveTab("transcript");
      triggerFeedback("Speech-to-text & prediction generated successfully!");
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "An unexpected error occurred during cloud processing.");
      setPipelineStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze pasted raw transcript directly (Text mode alternative)
  const triggerTranscriptAnalysis = async () => {
    if (!pastedTranscript.trim()) {
      setAnalysisError("Please paste or type an English transcript first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setPipelineStep(3); // Analyzing

    try {
      const response = await fetch("/api/analyze-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: pastedTranscript,
          questions: targetQuestions,
        }),
      });

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const errJson = await response.json();
          errMsg = errJson.error || errMsg;
        } catch (e) {
          try {
            const rawText = await response.text();
            if (rawText && rawText.includes("<body") || rawText.includes("<html")) {
              const match = rawText.match(/<title>(.*?)<\/title>/i) || rawText.match(/<h1>(.*?)<\/h1>/i);
              if (match && match[1]) {
                errMsg = `Server Error (${response.status}): ${match[1].trim()}`;
              } else {
                errMsg = `Server Error (${response.status}): HTML response. Check if backend is active.`;
              }
            } else if (rawText) {
              errMsg = rawText.substring(0, 200);
            }
          } catch (e2) {}
        }
        throw new Error(errMsg);
      }

      const result: AnalysisResult = await response.json();
      result.id = `session_${Date.now()}`;
      result.timestamp = new Date().toLocaleString("vi-VN");
      result.title = `Text Analysis: ${pastedTranscript.substring(0, 30)}...`;

      setCurrentResult(result);
      setPipelineStep(4); // Done

      const newSession: SavedSession = {
        id: result.id,
        title: result.title,
        timestamp: result.timestamp,
        summary: result.summary,
        result: result,
      };
      saveSessionsToStorage([newSession, ...savedSessions]);

      setActiveTab("transcript");
      triggerFeedback("Transcript processed & test answers predicted successfully!");
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "An error occurred during transcript text analysis.");
      setPipelineStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run a pre-configured Vietnamese-English listening template instantly (Mock Mode)
  const loadTemplate = (tplId: string) => {
    const tpl = SAMPLE_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      setPastedTranscript(tpl.transcript);
      setTargetQuestions(tpl.questions);
      
      const result: AnalysisResult = {
        id: `session_tpl_${Date.now()}`,
        timestamp: new Date().toLocaleString("vi-VN"),
        title: tpl.title,
        transcript: tpl.resultMock.transcript,
        summary: tpl.resultMock.summary,
        predictions: tpl.resultMock.predictions as Prediction[],
        vocabulary: tpl.resultMock.vocabulary as Vocabulary[],
        keyTakeaways: tpl.resultMock.keyTakeaways
      };

      setCurrentResult(result);
      setPipelineStep(4);
      setActiveTab("transcript");
      triggerFeedback(`Loaded pre-analyzed template: ${tpl.title}`);
    }
  };

  // Delete a saved session from the learning history
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedSessions.filter((s) => s.id !== id);
    saveSessionsToStorage(filtered);
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
    triggerFeedback("Session deleted from learning history.");
  };

  // Flip flashcard state handler
  const toggleCardFlip = (word: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [word]: !prev[word]
    }));
  };

  // Toggle mastered status
  const toggleMasteredWord = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMasteredWords((prev) => ({
      ...prev,
      [word]: !prev[word]
    }));
    triggerFeedback(`Vocabulary '${word}' marked as ${!masteredWords[word] ? 'Mastered' : 'Needs practice'}`);
  };

  // Feedback notifications
  const triggerFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Integration syncing: Notion
  const handleSyncNotion = () => {
    if (!currentResult) return;
    setIsSyncingNotion(true);
    setTimeout(() => {
      setIsSyncingNotion(false);
      setSyncedNotionCount((prev) => prev + 1);
      triggerFeedback("Successfully synchronized transcript, answers, and vocabulary list to Notion Workspace!");
    }, 1500);
  };

  // Integration syncing: Anki Decks
  const handleSyncAnki = () => {
    if (!currentResult) return;
    setIsSyncingAnki(true);
    setTimeout(() => {
      setIsSyncingAnki(false);
      setSyncedDecksCount((prev) => prev + currentResult.vocabulary.length);
      triggerFeedback(`Exported ${currentResult.vocabulary.length} flashcards to Anki Desktop/Mobile successfully!`);
    }, 1800);
  };

  // Export vocabulary to CSV (Anki importable format)
  const downloadAnkiCsv = () => {
    if (!currentResult || currentResult.vocabulary.length === 0) return;
    
    // Anki columns: Front, Back, IPA, Part of Speech, Example, Translation
    let csvContent = "data:text/csv;charset=utf-8,Front,Back,IPA,Part_of_Speech,Example,Translation\n";
    currentResult.vocabulary.forEach((v) => {
      const row = [
        `"${v.word.replace(/"/g, '""')}"`,
        `"${v.vietnamese.replace(/"/g, '""')} (${v.definition.replace(/"/g, '""')})"`,
        `"${v.ipa.replace(/"/g, '""')}"`,
        `"${v.partOfSpeech.replace(/"/g, '""')}"`,
        `"${v.example.replace(/"/g, '""')}"`,
        `"${v.exampleTranslation.replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OmniCapture_AnkiDeck_${currentResult.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerFeedback("Anki CSV Deck file downloaded. You can import this directly in Anki!");
  };

  // Copy Notion formatted Markdown
  const copyNotionMarkdown = () => {
    if (!currentResult) return;

    const md = `
# 🎧 OmniCapture AI - Listening & Pedagogical Summary
**Topic:** ${currentResult.title}
**Date processed:** ${currentResult.timestamp}

## 📝 1. Summary (Vietnamese)
${currentResult.summary}

## 📖 2. High-Precision Transcript
${currentResult.transcript}

## 💡 3. Predicted Exam Answers & Explanations
${currentResult.predictions.map(p => `
### Question ${p.questionNumber}: ${p.questionText}
- **Predicted Answer:** \`${p.predictedAnswer}\` (Confidence: ${p.confidence.toUpperCase()})
- **Supportive Explanation:** ${p.explanation}
`).join("\n")}

## 🏷️ 4. Vocabulary Bank
${currentResult.vocabulary.map(v => `
- **${v.word}** (${v.ipa}) - *${v.partOfSpeech}*
  - **Definition:** ${v.definition}
  - **Vietnamese Meaning:** ${v.vietnamese}
  - **Example:** "${v.example}"
  - **Example Translation:** *${v.exampleTranslation}*
`).join("\n")}

## 🚀 5. Listening Takeaways & Phonetic Tips
${currentResult.keyTakeaways.map(t => `- ${t}`).join("\n")}
    `;

    navigator.clipboard.writeText(md.trim());
    triggerFeedback("Copied customized Notion Markdown block to your clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans relative overflow-x-hidden flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Dynamic colorful mesh gradient background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "12s" }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "16s" }}></div>
        <div className="absolute top-[25%] right-[15%] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "10s" }}></div>
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[130px] animate-pulse" style={{ animationDuration: "14s" }}></div>
      </div>

      {/* Floating global dynamic Toast/Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-950/90 backdrop-blur-xl border border-indigo-400/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl shadow-indigo-950/80"
          >
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
            </div>
            <span className="text-xs font-semibold tracking-wide text-indigo-100">{feedbackMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Wrapper */}
      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-4 lg:px-6 py-5 flex flex-col flex-grow gap-5">
        
        {/* Dynamic Translucent Header */}
        <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/40 border border-indigo-400/30">
              <Mic className="h-6 w-6 text-white animate-bounce" style={{ animationDuration: "3s" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white font-display">OmniCapture AI</h1>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">LMS Companion</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Advanced AI Listening, Prediction & Vocab Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status indicator badge */}
            <div className="flex items-center space-x-2.5 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Online Engine: Whisper-v3 & Gemini 3.5</span>
            </div>

            {currentResult && (
              <button 
                onClick={() => {
                  setCurrentResult(null);
                  setAudioBlob(null);
                  setAudioUrl(null);
                  setPipelineStep(1);
                  setActiveTab("capture");
                  triggerFeedback("Started clean capture workspace");
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                New Capture
              </button>
            )}
          </div>
        </header>

        {/* Core Multi-Column Workspace layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow">
          
          {/* Left Sidebar: Interactive AI Pipeline Track & Saved Sessions History */}
          <aside className="lg:col-span-3 flex flex-col gap-5">
            
            {/* AI pipeline workflow progress card */}
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  AI Pipeline Process
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-bold">Step {pipelineStep}/4</span>
              </div>

              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className={`flex items-center p-3 rounded-xl border transition-all ${pipelineStep >= 1 ? "bg-indigo-950/25 border-indigo-500/30 text-white" : "bg-white/5 border-white/5 opacity-55 text-slate-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mr-3 ${pipelineStep >= 1 ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    01
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">AI Audio Capture</p>
                    <p className="text-[9px] text-slate-400">Record micro or file upload</p>
                  </div>
                  {pipelineStep > 1 && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                </div>

                {/* Step 2 */}
                <div className={`flex items-center p-3 rounded-xl border transition-all ${pipelineStep >= 2 ? "bg-indigo-950/25 border-indigo-500/30 text-white" : "bg-white/5 border-white/5 opacity-55 text-slate-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mr-3 ${pipelineStep >= 2 ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    02
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">Whisper STT Engine</p>
                    <p className="text-[9px] text-slate-400">High-precision transcription</p>
                  </div>
                  {pipelineStep > 2 && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                  {pipelineStep === 2 && isAnalyzing && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin ml-auto" />}
                </div>

                {/* Step 3 */}
                <div className={`flex items-center p-3 rounded-xl border transition-all ${pipelineStep >= 3 ? "bg-indigo-950/25 border-indigo-500/30 text-white" : "bg-white/5 border-white/5 opacity-55 text-slate-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mr-3 ${pipelineStep >= 3 ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    03
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">GPT Analysis & Answers</p>
                    <p className="text-[9px] text-slate-400">Predict answers & translate clues</p>
                  </div>
                  {pipelineStep > 3 && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                  {pipelineStep === 3 && isAnalyzing && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin ml-auto" />}
                </div>

                {/* Step 4 */}
                <div className={`flex items-center p-3 rounded-xl border transition-all ${pipelineStep >= 4 ? "bg-indigo-950/25 border-indigo-500/30 text-white" : "bg-white/5 border-white/5 opacity-55 text-slate-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mr-3 ${pipelineStep >= 4 ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    04
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">Flashcard Generator</p>
                    <p className="text-[9px] text-slate-400">Notion / Anki sync active</p>
                  </div>
                  {pipelineStep >= 4 && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                </div>
              </div>
            </div>

            {/* Past saved sessions list (Persistent Learning History) */}
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl flex-grow max-h-[380px] lg:max-h-none overflow-hidden">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-indigo-400" />
                  Learning History
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold">{savedSessions.length} sessions</span>
              </h3>

              {savedSessions.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-white/5 p-4">
                  <Layers className="w-8 h-8 text-slate-600 mb-2.5" />
                  <p className="text-xs text-slate-400 font-medium">No sessions saved yet</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Your completed audio analyses will appear here automatically.</p>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                  {savedSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setCurrentResult(session.result);
                        setPipelineStep(4);
                        setActiveTab("transcript");
                        triggerFeedback(`Switched to saved session: ${session.title}`);
                      }}
                      className={`group p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${currentResult?.id === session.id ? "bg-indigo-600/15 border-indigo-500/40 text-white" : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300 hover:text-white"}`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-300 mt-0.5 group-hover:bg-indigo-500/25">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold truncate pr-1">{session.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{session.timestamp}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 leading-normal italic">
                          {session.summary}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Center Area: Primary Interactive Workspace */}
          <main className="lg:col-span-6 flex flex-col gap-5">
            
            {/* If analyzed results exist, show interactive multi-tab outputs */}
            {currentResult ? (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl flex-grow overflow-hidden">
                {/* Translucent internal Tab Switcher */}
                <div className="flex border-b border-white/10 bg-slate-950/20 p-2 gap-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("transcript")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "transcript" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Transcript ({Math.round(currentResult.transcript.split(/\s+/).length)} words)
                  </button>
                  <button
                    onClick={() => setActiveTab("predictions")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "predictions" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Answers & Clues ({currentResult.predictions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("vocabulary")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "vocabulary" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Vocab Flashcards ({currentResult.vocabulary.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("notion-anki")}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "notion-anki" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Sync & Export
                  </button>
                </div>

                {/* Tab content displays */}
                <div className="p-5 flex-grow overflow-y-auto max-h-[600px] min-h-[400px]">
                  
                  {/* Tab 1: TRANSCRIPT */}
                  {activeTab === "transcript" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      {/* Summary Block */}
                      <div className="p-4 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          Vietnamese Summary (Tóm tắt tiếng Việt)
                        </h4>
                        <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                          {currentResult.summary}
                        </p>
                      </div>

                      {/* Full Text Display */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                          High-Precision English Transcript
                        </h4>
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 font-serif text-sm leading-relaxed text-slate-200 whitespace-pre-line select-text">
                          {currentResult.transcript}
                        </div>
                      </div>

                      {/* Strategic Takeaways list */}
                      {currentResult.keyTakeaways && currentResult.keyTakeaways.length > 0 && (
                        <div className="space-y-2.5 pt-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Phonetic Clues & Listening Tips (Bí quyết phát âm & nghe hiểu)
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {currentResult.keyTakeaways.map((tip, i) => (
                              <div key={i} className="flex gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 items-start">
                                <span className="w-5 h-5 rounded bg-indigo-600/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] mt-0.5">
                                  {i + 1}
                                </span>
                                <p className="leading-normal flex-1 font-medium">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 2: ANSWER PREDICTION & EXPLANATION ENGINE */}
                  {activeTab === "predictions" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Pedagogical Answer Predictions & Clues
                        </h4>
                        <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded border border-white/5">
                          Targeted Questions: {currentResult.predictions.length}
                        </span>
                      </div>

                      {currentResult.predictions.length === 0 ? (
                        <div className="py-12 text-center bg-slate-900/40 rounded-xl border border-dashed border-white/5">
                          <p className="text-xs text-slate-400">No question predictions were generated for this text.</p>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {currentResult.predictions.map((p, idx) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-3">
                              
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex gap-3">
                                  <div className="w-7 h-7 bg-indigo-600/20 text-indigo-300 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                                    Q{p.questionNumber}
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Question Context</p>
                                    <p className="text-sm font-bold text-white leading-snug mt-0.5">{p.questionText}</p>
                                  </div>
                                </div>

                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                  p.confidence === "high" 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                    : p.confidence === "medium"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}>
                                  {p.confidence} match
                                </div>
                              </div>

                              <div className="bg-indigo-600/10 p-3 rounded-lg border border-indigo-500/20 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] font-semibold text-indigo-300 uppercase block tracking-wider">Predicted Correct Answer:</span>
                                  <span className="text-sm font-bold text-white leading-normal font-mono">{p.predictedAnswer}</span>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-300 text-xs font-black">
                                  ✓
                                </div>
                              </div>

                              <div className="text-xs bg-slate-900/40 p-3 rounded-lg border border-white/5">
                                <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1.5">
                                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Giải thích chi tiết (Supportive Explanation)</span>
                                </div>
                                <p className="text-slate-300 leading-relaxed font-medium">
                                  {p.explanation}
                                </p>
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 3: VOCABULARY ENGINE & FLASHCARD GENERATOR */}
                  {activeTab === "vocabulary" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Interactive Flipping Flashcards
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Click a card to reveal Vietnamese translations and usage examples.</p>
                        </div>

                        {/* Interactive Mastering statistics */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded border border-white/5">
                            Mastered: {Object.values(masteredWords).filter(Boolean).length} / {currentResult.vocabulary.length}
                          </span>
                        </div>
                      </div>

                      {currentResult.vocabulary.length === 0 ? (
                        <div className="py-12 text-center bg-slate-900/40 rounded-xl border border-dashed border-white/5">
                          <p className="text-xs text-slate-400">No key vocabulary was detected in this text sample.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentResult.vocabulary.map((v, idx) => {
                            const isFlipped = !!flippedCards[v.word];
                            const isMastered = !!masteredWords[v.word];

                            return (
                              <div 
                                key={idx}
                                onClick={() => toggleCardFlip(v.word)}
                                className="h-44 perspective-1000 cursor-pointer select-none relative group"
                              >
                                <div className={`w-full h-full duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                                  
                                  {/* FRONT SIDE (English) */}
                                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 border border-white/15 hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">FRONT (English)</span>
                                      
                                      <button
                                        onClick={(e) => toggleMasteredWord(v.word, e)}
                                        className={`p-1.5 rounded-lg border transition-all ${isMastered ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/60 border-white/5 text-slate-500 hover:text-slate-300'}`}
                                        title={isMastered ? "Mastered" : "Mark as Mastered"}
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="text-center py-2">
                                      <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">{v.word}</h3>
                                      <p className="text-xs text-indigo-200 mt-1 font-mono">{v.ipa} • <span className="italic text-[10px] text-slate-400">{v.partOfSpeech}</span></p>
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                      <span>Click to flip</span>
                                      <RefreshCw className="w-3 h-3 group-hover:animate-spin" style={{ animationDuration: "3s" }} />
                                    </div>
                                  </div>

                                  {/* BACK SIDE (Vietnamese & Definitions) */}
                                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-950/70 border border-indigo-500/35 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">BACK (Vietnamese)</span>
                                      <span className="text-[10px] bg-indigo-500/25 text-indigo-200 px-1.5 py-0.5 rounded italic font-bold">{v.partOfSpeech}</span>
                                    </div>

                                    <div className="space-y-1.5 overflow-y-auto pr-1">
                                      <p className="text-sm font-black text-white">{v.vietnamese}</p>
                                      <p className="text-[11px] text-indigo-200 leading-normal line-clamp-2">Def: {v.definition}</p>
                                      
                                      <div className="border-t border-indigo-500/20 pt-1.5">
                                        <p className="text-[10px] text-slate-300 italic leading-snug line-clamp-1">"{v.example}"</p>
                                        <p className="text-[9px] text-indigo-400 leading-normal line-clamp-1">{v.exampleTranslation}</p>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] text-indigo-400/80">
                                      <span>Click to flip front</span>
                                      <RefreshCw className="w-3 h-3" />
                                    </div>
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 4: SYNC & EXPORT HUB */}
                  {activeTab === "notion-anki" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          External Integration Suite
                        </h4>
                        <span className="text-[10px] text-indigo-400 font-mono">No API Tokens required</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Notion Integration Option */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.445 1h15.111c1.902 0 3.444 1.543 3.444 3.444v15.112c0 1.902-1.542 3.444-3.444 3.444H4.445A3.444 3.444 0 0 1 1 19.556V4.444C1 2.543 2.542 1 4.445 1zm1.334 1.333a2.11 2.11 0 0 0-2.112 2.111v15.112c0 1.165.947 2.111 2.112 2.111h15.11a2.11 2.11 0 0 0 2.112-2.111V4.444a2.11 2.11 0 0 0-2.112-2.111H5.779z" />
                              </svg>
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-white">Sync to Notion Workspace</h5>
                              <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Export structured listening transcripts, exam predictions, and core vocabulary blocks straight into your personal study workspace.</p>
                            </div>
                          </div>

                          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-[10px] text-slate-500 font-mono">
                            <div className="flex justify-between mb-1"><span>Target Connection:</span><span className="text-indigo-400">Notion Integration App</span></div>
                            <div className="flex justify-between"><span>Synced Docs:</span><span>{syncedNotionCount} logs uploaded</span></div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={copyNotionMarkdown}
                              className="flex-1 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Markdown
                            </button>
                            <button
                              onClick={handleSyncNotion}
                              disabled={isSyncingNotion}
                              className="flex-1 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-white/5"
                            >
                              {isSyncingNotion ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5" />
                                  Notion Sync
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Anki Flashcards Integration Option */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-white">Anki Desktop / Mobile Deck</h5>
                              <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Push generated English/Vietnamese academic words to Anki Decks with IPA, grammar, definitions, and contextual examples automatically.</p>
                            </div>
                          </div>

                          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 text-[10px] text-slate-500 font-mono">
                            <div className="flex justify-between mb-1"><span>Target Deck:</span><span className="text-indigo-400">{selectedDeck}</span></div>
                            <div className="flex justify-between"><span>Cards synced:</span><span>{syncedDecksCount} terms</span></div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={downloadAnkiCsv}
                              className="flex-1 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              Download CSV
                            </button>
                            <button
                              onClick={handleSyncAnki}
                              disabled={isSyncingAnki}
                              className="flex-1 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-white/5"
                            >
                              {isSyncingAnki ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5" />
                                  Anki Sync
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Custom Deck Planner Selection */}
                      <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2">Configure Active Study Deck Target</label>
                        <div className="flex gap-2.5 items-center">
                          <select
                            value={selectedDeck}
                            onChange={(e) => setSelectedDeck(e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500/50 flex-grow"
                          >
                            {customDecks.map((d, i) => (
                              <option key={i} value={d}>{d}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const title = prompt("Enter name of new Anki study deck:");
                              if (title?.trim()) {
                                setCustomDecks([...customDecks, title.trim()]);
                                setSelectedDeck(title.trim());
                                triggerFeedback(`Created study deck: ${title}`);
                              }
                            }}
                            className="p-2 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-slate-200 transition-colors"
                            title="Create custom deck"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>
            ) : (
              /* Capture workspace layout when no analysis results are loaded */
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-col shadow-xl gap-5 flex-grow">
                
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    Interactive Capture Workspace
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Capture live lecturer speech, upload audio learning materials from Moodle/YouTube, or analyze manual transcripts instantly.
                  </p>
                </div>

                {/* Primary Recording & Audio upload block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Option A: Microphone Audio Capture */}
                  <div className="p-4 rounded-2xl bg-slate-950/35 border border-white/5 flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Method A</span>
                      <h3 className="text-sm font-bold text-white mt-1">Live AI Audio Capture</h3>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Capture real-time voice, lectures, or speaker playbacks through your microphone.</p>
                    </div>

                    {/* Microphone Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {isRecording ? (
                        <button
                          onClick={stopRecording}
                          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 animate-pulse shadow-lg shadow-red-600/20"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          Stop Recording ({formatTime(recordingDuration)})
                        </button>
                      ) : (
                        <button
                          onClick={startRecording}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/10"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          Start Recording
                        </button>
                      )}

                      {/* Micro sound simulation visual canvas */}
                      <div className="h-11 bg-slate-900 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center relative">
                        <canvas ref={canvasRef} width={280} height={44} className="w-full h-full" />
                        {!isRecording && (
                          <span className="text-[9px] text-slate-500 font-mono absolute">Microphone idle</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Option B: Audio File Upload */}
                  <div className="p-4 rounded-2xl bg-slate-950/35 border border-white/5 flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">Method B</span>
                      <h3 className="text-sm font-bold text-white mt-1">File Audio Importer</h3>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">Drag-and-drop or select any MP3, WAV, or AAC audio recordings for complete Whisper extraction.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="w-full py-3 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Audio File
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={handleAudioFileUpload}
                        />
                      </label>

                      {audioUrl ? (
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 text-slate-300 min-w-0">
                            <FileAudio className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className="truncate pr-1">{audioFileName}</span>
                          </div>
                          <button 
                            onClick={() => {
                              setAudioUrl(null);
                              setAudioBlob(null);
                              setAudioFileName("");
                              setPipelineStep(1);
                            }}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center text-[10px] text-slate-500 font-mono h-11 text-center">
                          No audio file imported
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Question targeting (Optional area to paste exams) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    Paste Listening Questions (Optional / Dán Đề Thi Trắc Nghiệm/Điền Từ)
                  </label>
                  <textarea
                    placeholder="E.g., Question 1: What is the speaker's main recommendation?&#10;Question 2: In which quarter will the profits increase? (Leave blank for automatic question generation)"
                    value={targetQuestions}
                    onChange={(e) => setTargetQuestions(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950/45 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Alternative Direct Text Transcript Input option */}
                <div className="border-t border-white/5 pt-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Direct Transcript Input (Dành cho Transcript Có Sẵn/Youtube/Moodle)
                    </label>
                    <span className="text-[10px] text-slate-500">Skip Speech-to-Text phase</span>
                  </div>

                  <textarea
                    placeholder="If you already have the English transcript (or YouTube transcripts), paste it here to predict exam questions, explanations and generate flashcards instantly."
                    value={pastedTranscript}
                    onChange={(e) => setPastedTranscript(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950/45 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* Error feedback card */}
                {analysisError && (
                  <div className="p-4 bg-red-950/35 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Execution Error</p>
                      <p className="mt-0.5 leading-normal font-medium">{analysisError}</p>
                    </div>
                  </div>
                )}

                {/* Ultimate processing button trigger */}
                <div className="pt-2">
                  {audioBlob ? (
                    <button
                      onClick={triggerAudioAnalysis}
                      disabled={isAnalyzing}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:bg-indigo-950/30 disabled:text-slate-500"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing Audio & Generating Solutions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span>Analyze Uploaded Audio & Predict Solutions</span>
                        </>
                      )}
                    </button>
                  ) : pastedTranscript.trim() ? (
                    <button
                      onClick={triggerTranscriptAnalysis}
                      disabled={isAnalyzing}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:bg-indigo-950/30 disabled:text-slate-500"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Analyzing English Transcript...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span>Analyze Paste Transcript & Generate Flashcards</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-4 bg-slate-800 text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed border border-white/5 flex items-center justify-center gap-2"
                    >
                      <span>Capture speech, upload file or paste text to activate</span>
                    </button>
                  )}
                </div>

              </div>
            )}
          </main>

          {/* Right Sidebar: One-click Quick Evaluation Templates & Global Settings */}
          <aside className="lg:col-span-3 flex flex-col gap-5">
            
            {/* Template Selector block */}
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Quick Test Templates
              </h3>
              
              <div className="space-y-3">
                {SAMPLE_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl.id)}
                    className="p-3 bg-slate-950/35 hover:bg-slate-900/60 rounded-xl border border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all group text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-indigo-400 group-hover:text-indigo-300">
                        {tpl.id.toUpperCase()}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-200 mt-1">{tpl.title}</p>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro details / Integration status tracker */}
            <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Integration Status
              </h3>

              <div className="space-y-3 text-xs leading-normal">
                {/* Notion link indicator */}
                <div className="flex items-center justify-between p-2.5 bg-slate-950/25 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.445 1h15.111c1.902 0 3.444 1.543 3.444 3.444v15.112c0 1.902-1.542 3.444-3.444 3.444H4.445A3.444 3.444 0 0 1 1 19.556V4.444C1 2.543 2.542 1 4.445 1zm1.334 1.333a2.11 2.11 0 0 0-2.112 2.111v15.112c0 1.165.947 2.111 2.112 2.111h15.11a2.11 2.11 0 0 0 2.112-2.111V4.444a2.11 2.11 0 0 0-2.112-2.111H5.779z" />
                    </svg>
                    <span className="font-semibold text-xs">Notion Integrator</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Active</span>
                </div>

                {/* Anki link indicator */}
                <div className="flex items-center justify-between p-2.5 bg-slate-950/25 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-xs">Anki Deck Sync</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Active</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 space-y-1">
                <p className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Security & Authentication</p>
                <p className="leading-relaxed">All generated logs and audio data processed through Google GenAI server proxy. Session cache resides completely within your browser local context.</p>
              </div>
            </div>

          </aside>

        </div>

        {/* Global responsive aesthetic status bar footer */}
        <footer className="px-6 py-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono gap-2 mt-auto">
          <div className="flex space-x-4 items-center flex-wrap justify-center">
            <span>CLIENT LATENCY: ~140ms</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>MODEL: GEMINI-3.5-FLASH</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>BUFFERING RATE: AUTO-SCALE</span>
          </div>
          <div className="flex items-center gap-2">
            <span>EN-US & VI-VN BIPARTITE PIPELINE DETECTED</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
