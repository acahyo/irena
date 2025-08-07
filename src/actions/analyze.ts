"use server";

import { analyzeSentiment, AnalyzeSentimentOutput } from "@/ai/flows/analyze-sentiment";

export interface AnalyzeState {
  result: AnalyzeSentimentOutput | null;
  error: string | null;
}

export async function analyze(
  prevState: AnalyzeState,
  formData: FormData,
): Promise<AnalyzeState> {
  const text = formData.get("text") as string;

  if (!text || text.trim().length < 10) {
    return { result: null, error: "Please enter a more detailed text for analysis (at least 10 characters)." };
  }

  try {
    const result = await analyzeSentiment({ text });
    return { result, error: null };
  } catch (e: any) {
    return { result: null, error: e.message || "An unknown error occurred." };
  }
}
