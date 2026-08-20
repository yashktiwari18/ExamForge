import { getAIErrorMessage } from "./aiErrors";

async function requestAI(system, content) {
  let response;
  try {
    response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ system, content }),
    });
  } catch (cause) {
    const error = new Error("Unable to reach the AI service.");
    error.cause = cause;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (cause) {
    const error = new Error("AI service returned an invalid response.");
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    throw new Error(data?.error || `AI service request failed (${response.status})`);
  }

  if (!data?.text) {
    throw new Error(data?.error || "AI service returned an empty response.");
  }

  const clean = data.text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (cause) {
    const error = new Error("AI service returned invalid JSON.");
    error.cause = cause;
    throw error;
  }
}

export async function extractFromImage(img) {
  const system = `You are an expert OCR and exam-content analyst specializing in Indian competitive exams (Banking, UPSC, SSC, Railways, State PSC). Read the image carefully and extract every multiple-choice question exactly as written, with all its options. Respond with ONLY valid JSON, no markdown fences, no extra commentary, in exactly this shape:
{"topic":"short subject/topic name","examType":"best-guess exam name or subject area","questions":[{"question":"exact question text","options":["option text","option text","option text","option text"],"correctIndex":0,"explanation":"one short sentence explaining the correct answer"}]}
If the correct answer is marked, underlined, or circled in the image, use it. Otherwise use your own expert knowledge to determine the correct option. Keep explanations to one concise sentence. Extract at most 8 questions from this image. If no valid MCQs are visible, return {"topic":"","examType":"","questions":[]}.`;
  const content = [
    { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
    { type: "text", text: "Extract all MCQs visible in this image, following the required JSON shape exactly." },
  ];
  return requestAI(system, content);
}

export async function generateBatch(topic, examGuess, avoidList, batchSize) {
  const system = `You are an expert question-setter for Indian competitive exams. Generate exactly ${batchSize} original, high-quality multiple-choice questions. The requested topic is the primary subject. The selected exam type controls style, difficulty and depth, not the subject. Do not repeat or semantically duplicate the avoid list. Return ONLY valid JSON in exactly this shape: {"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"one concise sentence"}]}. Ensure every question has exactly four options and exactly one correct answer. Topic: ${topic || "General Knowledge"}. Exam type: ${examGuess || "Banking"}.`;
  const content = `Requested topic: ${topic || "General Knowledge"}
Selected exam style: ${examGuess || "Banking"}
Previously used questions that must not be repeated:
${avoidList.slice(-10).map((question) => question.slice(0, 300)).join(" | ") || "none"}
Generate exactly ${batchSize} new questions.`;
  return requestAI(system, content);
}

export { getAIErrorMessage };
