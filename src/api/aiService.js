import geminiProvider from "./gemini";
import { getAIErrorMessage } from "./aiErrors";

const PROVIDERS = {
  gemini: geminiProvider,
};

function getSelectedProvider() {
  const key = (import.meta.env.VITE_AI_PROVIDER || "gemini").trim().toLowerCase();
  return PROVIDERS[key] || PROVIDERS.gemini;
}

export async function extractFromImage(img) {
  const provider = getSelectedProvider();
  return provider.extractFromImage(img);
}

export async function generateBatch(topic, examGuess, avoidList, batchSize) {
  const provider = getSelectedProvider();
  return provider.generateBatch(topic, examGuess, avoidList, batchSize);
}

export { getAIErrorMessage };
