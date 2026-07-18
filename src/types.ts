export interface Prediction {
  questionNumber: string;
  questionText: string;
  predictedAnswer: string;
  confidence: "high" | "medium" | "low" | string;
  explanation: string;
}

export interface Vocabulary {
  word: string;
  ipa: string;
  partOfSpeech: string;
  definition: string;
  vietnamese: string;
  example: string;
  exampleTranslation: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  title: string;
  transcript: string;
  summary: string;
  predictions: Prediction[];
  vocabulary: Vocabulary[];
  keyTakeaways: string[];
}

export interface SavedSession {
  id: string;
  title: string;
  timestamp: string;
  summary: string;
  result: AnalysisResult;
}
