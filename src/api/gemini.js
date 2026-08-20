import { requestGeminiJson } from "./providers/geminiRequest";

export async function extractFromImage(img) {
  const sys = `You are an expert OCR and exam-content analyst specializing in Indian competitive exams (Banking, UPSC, SSC, Railways, State PSC). Read the image carefully and extract every multiple-choice question exactly as written, with all its options. Respond with ONLY valid JSON, no markdown fences, no extra commentary, in exactly this shape:
{"topic":"short subject/topic name","examType":"best-guess exam name or subject area","questions":[{"question":"exact question text","options":["option text","option text","option text","option text"],"correctIndex":0,"explanation":"one short sentence explaining the correct answer"}]}
If the correct answer is marked, underlined, or circled in the image, use it. Otherwise use your own expert knowledge to determine the correct option. Keep explanations to one concise sentence. Extract at most 8 questions from this image. If no valid MCQs are visible, return {"topic":"","examType":"","questions":[]}.`;
  const content = [
    { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
    { type: "text", text: "Extract all MCQs visible in this image, following the required JSON shape exactly." },
  ];
  return requestGeminiJson(sys, content);
}

export async function generateBatch(topic, examGuess, avoidList, batchSize) {
  const sys = `You are an expert question-setter for Indian competitive exams.

Generate exactly ${batchSize} original, high-quality multiple-choice questions.

IMPORTANT RULES:

1. The requested topic is the PRIMARY subject.
2. The selected exam type controls the question style, difficulty, depth and thinking level, NOT the subject.
3. Questions must be appropriate for serious Indian competitive-exam preparation.
4. Do NOT generate school-level questions unless the selected exam style explicitly requires it.
5. Do NOT make questions artificially difficult by using obscure, useless or extremely niche facts.
6. Difficulty must come from conceptual understanding, application, reasoning, comparison, elimination, multiple statements, close options or multi-step thinking where appropriate.
7. The question must test the candidate's understanding rather than simple one-line memorization whenever the selected exam style allows it.

EXAM LEVEL RULES:

UPSC:
- Target difficulty: Moderate to Hard.
- Prefer conceptual, analytical, statement-based and application-oriented questions.
- Use multiple-statement questions where appropriate.
- Use questions that require comparison, elimination and careful reading.
- Options should be plausible and reasonably close.
- Avoid basic school-level questions such as simple definitions or obvious one-line facts.
- Do not make questions difficult merely by using obscure facts.
- For subjects such as Biology, History, Geography, Polity and Economy, focus on concepts, relationships, applications, institutions, processes and implications.

Banking:
- Target difficulty: Moderate to Hard.
- Questions should resemble competitive banking-exam preparation rather than school examinations.
- Prefer application-based, conceptual, calculation-based and reasoning-oriented questions where appropriate.
- For General Awareness subjects, use relevant competitive-exam knowledge with plausible distractors.
- For Mathematics/Quantitative Aptitude, use multi-step and time-efficient competitive-exam problems.
- Avoid extremely basic textbook questions.

SSC:
- Target difficulty: Easy to Moderate, with some Hard questions.
- Questions should follow a competitive-exam pattern.
- Prefer practical application, factual understanding, calculations, reasoning and close options.
- Avoid questions that are so easy that they can be answered instantly without thinking.
- Do not make questions unnecessarily advanced beyond the expected SSC level.

Railways:
- Target difficulty: Easy to Moderate.
- Questions should be suitable for competitive railway examinations.
- Use practical application, basic-to-intermediate concepts and competitive-exam style options.
- Avoid very elementary school questions and avoid unnecessarily advanced questions.

State PSC:
- Target difficulty: Moderate to Hard.
- Prefer conceptual, analytical and statement-based questions.
- Use close options and elimination where appropriate.
- Questions should test competitive-exam understanding rather than simple school-level recall.

General/Other:
- Target difficulty: Moderate.
- Generate balanced competitive-exam questions.
- Prefer conceptual understanding and application over trivial recall.

TOPIC-SPECIFIC RULES:

1. The topic must always remain the primary subject.
2. Never change the subject simply because the selected exam type is different.
3. Example:
   - Biology + UPSC = Biology questions written in UPSC-level style.
   - Biology + Banking = Biology questions written in competitive Banking/General Awareness style.
   - Maths + Banking = Mathematics questions written in Banking Quantitative Aptitude style.
4. Never mix unrelated subjects into the requested topic.
5. Do not generate questions from another subject merely because they are common in the selected exam.

MATHS RULES:

1. If the requested topic is Maths, Mathematics, Quantitative Aptitude, Arithmetic, Algebra, Geometry, Trigonometry, Number System, or a similar mathematical topic, generate ONLY mathematics questions.
2. For Maths + Banking, use Banking/Quantitative Aptitude style mathematics such as:
   - Simplification
   - Number Series
   - Percentage
   - Ratio and Proportion
   - Profit and Loss
   - Simple and Compound Interest
   - Time and Work
   - Time, Speed and Distance
   - Average
   - Probability
   - Permutation and Combination
   - Quadratic Equations
   - Data Interpretation
   - Algebra
   - Arithmetic
3. Never generate General Knowledge, History, Geography, Polity, Current Affairs or unrelated questions when the requested topic is Maths.
4. Every mathematical question must have exactly one unambiguous correct answer.
5. Verify every calculation before returning the question.
6. The correct answer MUST appear exactly once in the options.
7. correctIndex must be the zero-based index of the correct option.
8. Do not create ambiguous mathematical expressions.
9. Avoid unclear expressions involving percentages, brackets, roots, powers or the word "of".
10. Use standard mathematical notation that an Indian competitive-exam student can understand.

QUALITY AND CONSISTENCY RULES:

1. Do not generate a question and then reconsider, revise, redesign or replace it.
2. Do not include your reasoning process, internal analysis, drafts, corrections or alternative questions.
3. The explanation must contain ONLY one concise final explanation of the answer.
4. Never put phrases such as "Wait", "Let's re-evaluate", "Let's try", "Maybe", "I made a mistake", "Let's redesign", or similar reasoning text inside the explanation.
5. Keep each explanation to one short sentence.
6. Do not repeat questions from the avoid list.
7. Do not create semantic duplicates of questions from the avoid list.
8. Make the generated questions different from each other and cover different concepts whenever possible.
9. Before returning the final JSON, internally verify:
   - The question matches the requested topic.
   - The question matches the selected exam style.
   - The difficulty matches the selected exam style.
   - There is exactly one correct answer.
   - The correctIndex is correct.
   - The explanation is concise.
   - The JSON is valid.

QUESTION FORMAT:

Return ONLY valid JSON.

Do not use markdown.
Do not use code fences.
Do not write any text before or after the JSON.

Return exactly this structure:

{
  "questions": [
    {
      "question": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correctIndex": 0,
      "explanation": "one short final explanation"
    }
  ]
}

The JSON must be complete and valid.

Topic: ${topic || "General Knowledge"}
Exam type: ${examGuess || "Banking"}

Generate exactly ${batchSize} questions now.`;

  const userText = `Requested topic: ${topic || "General Knowledge"}
Selected exam style: ${examGuess || "Banking"}

Previously used questions that must NOT be repeated:
${avoidList
  .slice(-10)
  .map((q) => q.slice(0, 300))
  .join(" | ") || "none"}

Generate exactly ${batchSize} new questions.
Return ONLY the required JSON.`;

  return requestGeminiJson(sys, [{ type: "text", text: userText }]);
}

const geminiProvider = {
  extractFromImage,
  generateBatch,
};

export default geminiProvider;
