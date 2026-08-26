import { getAIErrorMessage } from "./aiErrors";

function sanitizeAndRepairJSONString(str) {
  let result = "";
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (!inString) {
      if (char === '"') {
        inString = true;
        isEscaped = false;
        result += char;
      } else {
        result += char;
      }
    } else {
      if (isEscaped) {
        isEscaped = false;
        if ('"\\/bfnrtu'.includes(char)) {
          if (char === 'f' && str.slice(i + 1, i + 4) === 'rac') {
            result += '\\f';
          } else {
            result += char;
          }
        } else {
          result += '\\' + char;
        }
      } else if (char === '\\') {
        const nextChar = str[i + 1];
        if (nextChar === 'f' && str.slice(i + 2, i + 5) === 'rac') {
          result += '\\\\';
        } else if ('"\\/bfnrtu'.includes(nextChar)) {
          isEscaped = true;
          result += char;
        } else {
          result += '\\\\';
        }
      } else if (char === '"') {
        let rest = str.slice(i + 1).trimStart();
        const nextC = rest[0];
        if (!nextC || nextC === ':' || nextC === ',' || nextC === ']' || nextC === '}') {
          inString = false;
          result += char;
        } else {
          result += '\\"';
        }
      } else if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        result += char;
      }
    }
  }

  return result;
}

function repairJSONSyntax(str) {
  let s = str;

  // 1. Remove trailing commas before ] or }
  s = s.replace(/,\s*([\]\}])/g, "$1");

  // 2. Insert missing commas between object properties:
  // e.g., "correctIndex": 0 \n "explanation": "..." -> "correctIndex": 0, \n "explanation": "..."
  // e.g., "options": [...] \n "correctIndex": 0 -> "options": [...], \n "correctIndex": 0
  s = s.replace(/([0-9]|true|false|null|"[^"\\]*(?:\\.[^"\\]*)*"|\]|\})\s*[\r\n]+\s*("[\w\-]+\s*":)/g, "$1,\n$2");

  // 3. Insert missing commas between objects in an array: } \n { -> }, \n {
  s = s.replace(/\}\s*[\r\n]+\s*\{/g, "},\n{");

  return s;
}

function cleanAndParseJSON(rawText) {
  if (!rawText) throw new Error("Empty response");

  let cleaned = String(rawText).trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Attempt 1: Syntax repairs (missing commas & trailing commas)
    let repaired = repairJSONSyntax(cleaned);
    try {
      return JSON.parse(repaired);
    } catch (e2) {}

    // Attempt 2: Character sanitization (unescaped quotes, control chars, bad escapes)
    repaired = sanitizeAndRepairJSONString(cleaned);
    try {
      return JSON.parse(repaired);
    } catch (e3) {}

    // Attempt 3: Combined character sanitization + syntax repairs
    repaired = repairJSONSyntax(sanitizeAndRepairJSONString(cleaned));
    try {
      return JSON.parse(repaired);
    } catch (e4) {
      throw e1;
    }
  }
}

function generateClientMockResponse(system = "", content = "") {
  const contentText = typeof content === "string"
    ? content
    : Array.isArray(content)
    ? content.map((c) => c.text || "").join(" ")
    : JSON.stringify(content);

  const sysStr = String(system).toLowerCase();
  const isOCR = sysStr.includes("ocr") || sysStr.includes("extract");

  let topic = "General Knowledge";
  const topicMatch = contentText.match(/topic:\s*([^.\n|]+)/i) || contentText.match(/Requested topic:\s*([^.\n|]+)/i);
  if (topicMatch && topicMatch[1].trim()) {
    topic = topicMatch[1].trim();
  }

  let examType = "Banking";
  const examMatch = contentText.match(/exam style:\s*([^.\n|]+)/i) || contentText.match(/Exam type:\s*([^.\n|]+)/i);
  if (examMatch && examMatch[1].trim()) {
    examType = examMatch[1].trim();
  }

  let count = 5;
  const countMatch = contentText.match(/exactly\s*(\d+)/i) || contentText.match(/Generate\s*(\d+)/i);
  if (countMatch && countMatch[1]) {
    count = parseInt(countMatch[1], 10);
  }

  if (isOCR) {
    return {
      topic: topic || "Extracted Exam Paper",
      examType: examType || "Banking",
      questions: [
        {
          question: `[Extracted MCQ] What is a key principle of ${topic}?`,
          options: [
            `Core Concept of ${topic}`,
            `Secondary Aspect of ${topic}`,
            `Unrelated Option A`,
            `Unrelated Option B`
          ],
          correctIndex: 0,
          explanation: `This question tests fundamental principles of ${topic}.`
        }
      ]
    };
  }

  const topicLower = topic.toLowerCase();
  const questions = [];

  if (topicLower.includes("duty") || topicLower.includes("duties") || topicLower.includes("fundamental duty")) {
    const dutyQs = [
      {
        question: `[${examType} Style] Under which Article of the Indian Constitution are Fundamental Duties enumerated?`,
        options: ["Article 51A", "Article 32", "Article 19", "Article 21A"],
        correctIndex: 0,
        explanation: "Fundamental Duties are listed under Article 51A in Part IV-A of the Indian Constitution."
      },
      {
        question: `[${examType} Style] Fundamental Duties were incorporated into the Indian Constitution upon the recommendation of which committee?`,
        options: ["Swaran Singh Committee", "Sarkaria Commission", "Balwant Rai Mehta Committee", "Verma Committee"],
        correctIndex: 0,
        explanation: "The Swaran Singh Committee recommended the inclusion of Fundamental Duties in 1976."
      },
      {
        question: `[${examType} Style] Which Constitutional Amendment Act introduced Fundamental Duties into the Constitution of India?`,
        options: ["42nd Amendment Act, 1976", "44th Amendment Act, 1978", "86th Amendment Act, 2002", "73rd Amendment Act, 1992"],
        correctIndex: 0,
        explanation: "The 42nd Constitutional Amendment Act of 1976 added 10 Fundamental Duties to the Constitution."
      },
      {
        question: `[${examType} Style] The concept of Fundamental Duties in the Indian Constitution was inspired by which country's constitution?`,
        options: ["USSR (now Russia)", "USA", "United Kingdom", "Ireland"],
        correctIndex: 0,
        explanation: "The provisions of Fundamental Duties were borrowed from the former USSR Constitution."
      },
      {
        question: `[${examType} Style] Which 11th Fundamental Duty was added by the 86th Constitutional Amendment Act, 2002?`,
        options: [
          "Duty of a parent/guardian to provide education opportunities to children aged 6 to 14",
          "Duty to protect and improve the natural environment",
          "Duty to safeguard public property and abjure violence",
          "Duty to develop scientific temper and humanism"
        ],
        correctIndex: 0,
        explanation: "The 86th Amendment added duty (k) under Article 51A regarding education of children aged 6 to 14."
      }
    ];
    for (let i = 0; i < count; i++) {
      questions.push(dutyQs[i % dutyQs.length]);
    }
  } else if (topicLower.includes("math") || topicLower.includes("quant") || topicLower.includes("aptitude") || topicLower.includes("arithmetic")) {
    const mathQs = [
      {
        question: `[${examType} Style] If a number is increased by 20% and then decreased by 20%, what is the net percentage change?`,
        options: ["4% decrease", "2% decrease", "No change", "4% increase"],
        correctIndex: 0,
        explanation: "Net change = 20 - 20 - (20*20)/100 = -4% (a 4% decrease)."
      },
      {
        question: `[${examType} Style] A train 150 meters long passes a telegraph post in 9 seconds. What is the speed of the train in km/h?`,
        options: ["60 km/h", "50 km/h", "54 km/h", "72 km/h"],
        correctIndex: 0,
        explanation: "Speed = 150/9 m/s = (150/9) * (18/5) = 60 km/h."
      },
      {
        question: `[${examType} Style] The ratio of two numbers is 3:4 and their HCF is 4. What is their LCM?`,
        options: ["48", "36", "24", "12"],
        correctIndex: 0,
        explanation: "Numbers are 3*4=12 and 4*4=16. LCM(12, 16) = 48."
      },
      {
        question: `[${examType} Style] A can complete a work in 10 days and B can complete it in 15 days. Working together, in how many days will they finish the work?`,
        options: ["6 days", "8 days", "5 days", "7.5 days"],
        correctIndex: 0,
        explanation: "Combined rate = 1/10 + 1/15 = 1/6 work per day, so 6 days."
      },
      {
        question: `[${examType} Style] A principal of ₹5,000 yields ₹1,200 simple interest in 3 years. What is the annual rate of interest?`,
        options: ["8%", "6%", "10%", "7.5%"],
        correctIndex: 0,
        explanation: "Rate = (SI * 100) / (P * T) = (1200 * 100) / (5000 * 3) = 8%."
      }
    ];
    for (let i = 0; i < count; i++) {
      questions.push(mathQs[i % mathQs.length]);
    }
  } else {
    const genericTemplates = [
      {
        q: (t, e) => `[${e} Style] Which of the following statements is correct regarding ${t}?`,
        opts: (t) => [`It operates under established legal and regulatory frameworks for ${t}`, `It was completely abolished in 1947`, `It applies exclusively to Union Territories`, `It requires unanimous consent of all State Assemblies`],
        idx: 0,
        exp: (t) => `This tests core concepts of ${t} appropriate for ${examType} level.`
      },
      {
        q: (t, e) => `[${e} Style] Consider the following statements regarding ${t}:\n1. It forms a key part of competitive exam syllabi.\n2. Standard principles require compliance with designated guidelines.\nWhich statement(s) is/are correct?`,
        opts: () => [`1 only`, `2 only`, `Both 1 and 2`, `Neither 1 nor 2`],
        idx: 2,
        exp: (t) => `Both statements correctly describe fundamental attributes of ${t}.`
      },
      {
        q: (t, e) => `[${e} Style] What is the primary objective of regulatory provisions associated with ${t}?`,
        opts: (t) => [`To ensure systematic implementation and oversight of ${t}`, `To restrict public knowledge`, `To override fundamental rights`, `To mandate bi-annual elections`],
        idx: 0,
        exp: (t) => `The core objective of ${t} governance is structured oversight.`
      },
      {
        q: (t, e) => `[${e} Style] With reference to ${t}, which of the following is considered an essential requirement?`,
        opts: (t) => [`Adherence to prescribed standards and procedures`, `Prior approval from international courts`, `Exemption from official audit`, `Minimum 50 years of operation`],
        idx: 0,
        exp: (t) => `Adherence to prescribed procedures is fundamental to ${t}.`
      },
      {
        q: (t, e) => `[${e} Style] Which key metric or benchmark is most commonly associated with ${t}?`,
        opts: (t) => [`Compliance and performance evaluation index`, `Gross Happiness Index only`, `Standard atmospheric pressure`, `Random deviation index`],
        idx: 0,
        exp: (t) => `Performance and compliance metrics evaluate ${t} effectively.`
      }
    ];

    for (let i = 0; i < count; i++) {
      const tpl = genericTemplates[i % genericTemplates.length];
      questions.push({
        question: tpl.q(topic, examType),
        options: tpl.opts(topic),
        correctIndex: tpl.idx,
        explanation: tpl.exp(topic)
      });
    }
  }

  return { questions };
}

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000";
  }
  return "";
}

async function requestAI(system, content, retries = 3, delayMs = 1500) {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/ai`;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = delayMs * Math.pow(1.5, attempt - 1);
        console.warn(`[AI Request] Retrying attempt ${attempt}/${retries} after ${Math.round(backoff)}ms delay...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }

      let response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system, content }),
        });
      } catch (fetchErr) {
        console.warn(`[AI Request] Fetch network error at ${endpoint}:`, fetchErr.message);
        if (!import.meta.env.PROD || fetchErr.name === "TypeError") {
          console.info("[AI Request] Serving client-side fallback due to network reachability.");
          return generateClientMockResponse(system, content);
        }
        throw fetchErr;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error("[AI Request] Failed to parse backend JSON response:", jsonErr);
        if (!import.meta.env.PROD) {
          return generateClientMockResponse(system, content);
        }
        throw new Error("AI service returned an unreadable response format.");
      }

      if (!response.ok) {
        const status = response.status;
        const rawMsg = data?.error || `AI service request failed with HTTP status ${status}`;
        const msgLower = String(rawMsg).toLowerCase();

        // 429 Quota / Rate limit
        if (status === 429 || /quota|rate limit|resource exhausted|too many requests/.test(msgLower)) {
          console.warn("[AI Request] 429 Rate Limit / Quota Exceeded encountered.");
          if (!import.meta.env.PROD) {
            console.info("[AI Request] Local development mode: switching to local mock generator for 429 quota.");
            return generateClientMockResponse(system, content);
          }
          const quotaError = new Error("AI service quota limit reached. Switched to offline test generation mode.");
          quotaError.status = 429;
          throw quotaError;
        }

        // 503 Service Unavailable / High demand retry
        if (status === 503 || /503|high demand|temporarily unavailable|service unavailable/.test(msgLower)) {
          console.warn(`[AI Request] 503 Service Unavailable on attempt ${attempt + 1}/${retries + 1}`);
          if (attempt < retries) {
            continue;
          }
          if (!import.meta.env.PROD) {
            console.info("[AI Request] 503 retries exhausted. Serving local mock generator.");
            return generateClientMockResponse(system, content);
          }
        }

        if (!import.meta.env.PROD) {
          console.warn(`[AI Request] Non-OK HTTP status ${status}. Serving local fallback.`);
          return generateClientMockResponse(system, content);
        }

        throw new Error(rawMsg);
      }

      if (!data?.text) {
        if (!import.meta.env.PROD) {
          console.warn("[AI Request] Empty backend text payload. Serving local fallback.");
          return generateClientMockResponse(system, content);
        }
        throw new Error(data?.error || "AI service returned an empty response.");
      }

      return cleanAndParseJSON(data.text);
    } catch (err) {
      lastError = err;
      const msg = String(err.message || "").toLowerCase();

      const is503 = err.status === 503 || /503|high demand|service unavailable/.test(msg);
      if (is503 && attempt < retries) {
        continue;
      }

      if (!import.meta.env.PROD) {
        console.warn("[AI Request] Exception caught in dev mode, returning fallback generator:", err.message);
        return generateClientMockResponse(system, content);
      }

      throw err;
    }
  }

  if (!import.meta.env.PROD) {
    return generateClientMockResponse(system, content);
  }

  throw lastError;
}

export async function extractFromImage(img) {
  const system = `You are an expert OCR and exam-content analyst specializing in Indian competitive exams (Banking, UPSC, SSC, Railways, State PSC). Read the image carefully and extract every multiple-choice question exactly as written, with all its options. Respond with ONLY valid JSON, no markdown fences, no extra commentary, in exactly this shape:
{"topic":"short subject/topic name","examType":"best-guess exam name or subject area","questions":[{"question":"exact question text","options":["option text","option text","option text","option text"],"correctIndex":0,"explanation":"one short sentence explaining the correct answer"}]}
If the correct answer is marked, underlined, or circled in the image, use it. Otherwise use your own expert knowledge to determine the correct option. Keep explanations to one concise sentence. Extract at most 8 questions from this image. If no valid MCQs are visible, return {"topic":"","examType":"","questions":[]}. Ensure JSON is strictly valid without trailing commas and with properly escaped quotes inside strings.`;
  const content = [
    { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
    { type: "text", text: "Extract all MCQs visible in this image, following the required JSON shape exactly." },
  ];
  return requestAI(system, content);
}

export async function generateBatch(topic, examGuess, avoidList, batchSize) {
  const system = `You are an expert question-setter for Indian competitive exams.

Generate exactly ${batchSize} original, high-quality multiple-choice questions.

IMPORTANT RULES:
1. The requested topic (${topic || "General Knowledge"}) is the PRIMARY subject.
2. The selected exam type (${examGuess || "Banking"}) controls the question style, difficulty, depth and thinking level, NOT the subject.
3. Questions must be appropriate for serious Indian competitive-exam preparation.
4. Do NOT generate school-level questions unless the selected exam style explicitly requires it.
5. Difficulty must come from conceptual understanding, application, reasoning, comparison, elimination, multiple statements, close options or multi-step thinking.

EXAM LEVEL RULES:
- UPSC: Target difficulty Moderate to Hard. Prefer conceptual, analytical, statement-based and application-oriented questions with multiple statements and close options.
- Banking: Target difficulty Moderate to Hard. Prefer application-based, quantitative aptitude, reasoning, and competitive GA style with plausible distractors.
- SSC: Target difficulty Easy to Moderate. Prefer practical application, factual understanding, reasoning, and competitive exam options.
- Railways: Target difficulty Easy to Moderate. Suitable for competitive railway examinations with practical intermediate concepts.
- State PSC: Target difficulty Moderate to Hard. Conceptual, analytical, statement-based questions testing competitive-exam depth.
- General/Other: Target difficulty Moderate. Balanced competitive-exam questions focusing on conceptual understanding.

MATHS RULES:
If topic relates to Maths, Quantitative Aptitude, Arithmetic, Algebra, Geometry, Trigonometry, or Number System, generate ONLY mathematics questions with unambiguous calculations.

Return ONLY valid JSON in exactly this structure:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"one short sentence"}]}.`;

  const content = `Requested topic: ${topic || "General Knowledge"}
Selected exam style: ${examGuess || "Banking"}
Previously used questions that must not be repeated:
${avoidList.slice(-10).map((q) => String(q).slice(0, 300)).join(" | ") || "none"}

Generate exactly ${batchSize} new questions now. Return ONLY valid JSON.`;
  return requestAI(system, content);
}

export { getAIErrorMessage };
