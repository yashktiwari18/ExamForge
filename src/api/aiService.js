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

function generateLevelAwareMockQuestions(topic, examType, examLevel = "moderate", avoidList = [], count = 5) {
  const topicLower = topic.toLowerCase();
  const examLower = examType.toLowerCase();
  const normalizedExamLevel = String(examLevel || "moderate").toLowerCase();
  const avoidSet = new Set(avoidList.map((a) => String(a).toLowerCase().trim()));

  // =====================================================
// EXAM LEVEL DETECTION
// =====================================================

const isUPSC =
  examLower.includes("upsc") ||
  examLower.includes("cse") ||
  examLower.includes("ias") ||
  examLower.includes("hard & conceptual");

const isBankingPO =
  examLower.includes("ibps po") ||
  examLower.includes("sbi po") ||
  examLower.includes("po level") ||
  examLower.includes("probationary officer");

const isBankingClerk =
  examLower.includes("ibps clerk") ||
  examLower.includes("sbi clerk") ||
  examLower.includes("clerk");

const isRBI =
  examLower.includes("rbi grade b") ||
  examLower.includes("rbi assistant");

const isRailway =
  examLower.includes("railway") ||
  examLower.includes("rrb") ||
  examLower.includes("ntpc") ||
  examLower.includes("alp") ||
  examLower.includes("technician");

const isRailwayGroupD =
  examLower.includes("group d");

const isSSCCGL =
  examLower.includes("ssc cgl");

const isSSCCHSL =
  examLower.includes("ssc chsl");

const isSSCMTS =
  examLower.includes("ssc mts") ||
  examLower.includes("mts");

const isDefence =
  examLower.includes("nda") ||
  examLower.includes("cds") ||
  examLower.includes("defence");

const isConstable =
  examLower.includes("constable") ||
  examLower.includes("gd");

const isEasyLevel =
  normalizedExamLevel.includes("basic") ||
  examLower.includes("10th") ||
  examLower.includes("matriculation") ||
  isSSCMTS ||
  isRailwayGroupD;

const isMediumLevel =
  normalizedExamLevel.includes("moderate") ||
  isRailway ||
  isSSCCHSL ||
  isBankingClerk ||
  isConstable;

const isHardLevel =
  normalizedExamLevel.includes("advanced") ||
  isUPSC ||
  isBankingPO ||
  isRBI ||
  isSSCCGL ||
  isDefence;

  const questions = [];

  const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (array) =>
  [...array].sort(() => Math.random() - 0.5);

const createMathQuestion = ({
  question,
  correctAnswer,
  wrongAnswers,
  explanation
}) => {
  const options = shuffle([
    String(correctAnswer),
    ...wrongAnswers.map(String)
  ]);

  return {
    question,
    options,
    correctIndex: options.indexOf(String(correctAnswer)),
    explanation
  };
};

  const tryAdd = (item) => {
    const qText = item.question.toLowerCase().trim();
    if (!avoidSet.has(qText) && !questions.some((q) => q.question.toLowerCase().trim() === qText)) {
      questions.push(item);
      avoidSet.add(qText);
      return true;
    }
    return false;
  };

  if (topicLower.includes("duty") || topicLower.includes("duties") || topicLower.includes("fundamental duty") || topicLower.includes("polity")) {
    if (isUPSC) {
      const bank = [
        {
          question: `[UPSC CSE Level] Consider the following statements regarding Fundamental Duties in India:\n1. They were incorporated into the Constitution by the 42nd Amendment Act, 1976.\n2. Unlike Fundamental Rights, Fundamental Duties extend only to citizens and not to foreigners.\nWhich of the statements given above is/are correct?`,
          options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
          correctIndex: 2,
          explanation: "Both statements are correct. Fundamental Duties under Article 51A apply exclusively to Indian citizens and were added by the 42nd Amendment."
        },
        {
          question: `[UPSC CSE Level] With reference to the legal status of Fundamental Duties in India, which of the following statements is correct?`,
          options: [
            "They are non-justiciable but Parliament can enforce them through specific legislation",
            "They are directly enforceable by courts through writs under Article 32",
            "They form part of the Basic Structure of the Constitution and cannot be amended",
            "They apply automatically to foreign diplomats residing in India"
          ],
          correctIndex: 0,
          explanation: "Fundamental Duties are non-justiciable on their own, but Parliament has enacted laws to enforce specific duties."
        },
        {
          question: `[UPSC CSE Level] Which committee specifically identified legal provisions for the enforcement of certain Fundamental Duties in its 1999 report?`,
          options: ["Verma Committee", "Swaran Singh Committee", "M.N. Venkatachaliah Commission", "Sarkaria Commission"],
          correctIndex: 0,
          explanation: "The Verma Committee (1999) identified existing legal enactments that enforce certain Fundamental Duties."
        },
        {
          question: `[UPSC CSE Level] Consider the following duties under Article 51A:\n1. To develop scientific temper, humanism and the spirit of inquiry.\n2. To vote in general elections.\n3. To safeguard public property and to abjure violence.\nWhich of the duties given above is/are listed as Fundamental Duties in the Constitution?`,
          options: ["1 and 3 only", "1 and 2 only", "2 and 3 only", "1, 2 and 3"],
          correctIndex: 0,
          explanation: "Voting in elections is a constitutional right, not a listed Fundamental Duty under Article 51A."
        },
        {
          question: `[UPSC CSE Level] By which Constitutional Amendment Act was the duty to provide educational opportunities to one's child between 6 and 14 years added?`,
          options: ["86th Amendment Act, 2002", "42nd Amendment Act, 1976", "44th Amendment Act, 1978", "91st Amendment Act, 2003"],
          correctIndex: 0,
          explanation: "The 86th Amendment Act, 2002 added Clause (k) to Article 51A."
        }
      ];
      bank.forEach(tryAdd);
    } else if (isSSCMTS) {
      const bank = [
        {
          question: `[SSC MTS / Group D Level] How many Fundamental Duties are currently present in Article 51A of the Indian Constitution?`,
          options: ["11", "10", "12", "9"],
          correctIndex: 0,
          explanation: "There are currently 11 Fundamental Duties in Article 51A."
        },
        {
          question: `[SSC MTS / Group D Level] In which year were Fundamental Duties added to the Constitution of India?`,
          options: ["1976", "1978", "1950", "1986"],
          correctIndex: 0,
          explanation: "Fundamental Duties were added in 1976 by the 42nd Amendment Act."
        },
        {
          question: `[SSC MTS / Group D Level] Which committee recommended adding Fundamental Duties to the Indian Constitution?`,
          options: ["Swaran Singh Committee", "Sarkaria Commission", "Balwant Rai Mehta Committee", "Verma Committee"],
          correctIndex: 0,
          explanation: "The Swaran Singh Committee recommended adding Fundamental Duties in 1976."
        },
        {
          question: `[SSC MTS / Group D Level] Under which Part of the Indian Constitution are Fundamental Duties included?`,
          options: ["Part IV-A", "Part III", "Part IV", "Part V"],
          correctIndex: 0,
          explanation: "Fundamental Duties are contained in Part IV-A."
        },
        {
          question: `[SSC MTS / Group D Level] The concept of Fundamental Duties in the Indian Constitution was borrowed from which country?`,
          options: ["USSR (now Russia)", "USA", "UK", "Australia"],
          correctIndex: 0,
          explanation: "Fundamental Duties were inspired by the Constitution of the USSR."
        }
      ];
      bank.forEach(tryAdd);
    } else {
      const bank = [
        {
          question: `[${examType}] How many Fundamental Duties were originally added by the 42nd Amendment Act of 1976?`,
          options: ["10", "11", "8", "12"],
          correctIndex: 0,
          explanation: "The 42nd Amendment Act added 10 duties in 1976. The 11th duty was added in 2002."
        },
        {
          question: `[${examType}] Which Article of the Indian Constitution lists the Fundamental Duties of citizens?`,
          options: ["Article 51A", "Article 32", "Article 19", "Article 21A"],
          correctIndex: 0,
          explanation: "Article 51A enumerates all 11 Fundamental Duties."
        },
        {
          question: `[${examType}] Which of the following is NOT a Fundamental Duty under Article 51A?`,
          options: [
            "To cast vote in all general elections",
            "To abide by the Constitution and respect its ideals",
            "To cherish and follow noble ideals of the freedom struggle",
            "To protect and improve the natural environment"
          ],
          correctIndex: 0,
          explanation: "Voting in general elections is not a Fundamental Duty under Article 51A."
        },
        {
          question: `[${examType}] Swaran Singh Committee in 1976 originally recommended how many Fundamental Duties?`,
          options: ["8", "10", "11", "6"],
          correctIndex: 0,
          explanation: "Swaran Singh Committee recommended 8 duties, but Parliament incorporated 10 duties."
        },
        {
          question: `[${examType}] Fundamental Duty regarding protection of public property and abjuring violence is under which Clause of Article 51A?`,
          options: ["Clause (i)", "Clause (a)", "Clause (e)", "Clause (k)"],
          correctIndex: 0,
          explanation: "Clause (i) of Article 51A deals with safeguarding public property."
        }
      ];
      bank.forEach(tryAdd);
    }
  } else if (
  topicLower.includes("math") ||
  topicLower.includes("quant") ||
  topicLower.includes("aptitude") ||
  topicLower.includes("arithmetic")
) {

  const mathGenerators = [];

  // =====================================================
  // EASY LEVEL
  // SSC MTS / Railway Group D / Matriculation
  // =====================================================

  if (isEasyLevel) {

    mathGenerators.push(

      // Percentage
      () => {
        const number = randomInt(200, 1000);
        const percent = randomInt(10, 40);
        const answer = (number * percent) / 100;

        return createMathQuestion({
          question: `[${examType}] What is ${percent}% of ${number}?`,
          correctAnswer: answer,
          wrongAnswers: [
            answer + randomInt(10, 50),
            answer - randomInt(5, 20),
            answer + randomInt(60, 100)
          ],
          explanation: `${percent}% of ${number} = (${percent} × ${number}) / 100 = ${answer}.`
        });
      },

      // Average
      () => {
        const a = randomInt(10, 40);
        const b = randomInt(10, 40);
        const c = randomInt(10, 40);
        const d = randomInt(10, 40);
        const e = randomInt(10, 40);

        const answer = (a + b + c + d + e) / 5;

        return createMathQuestion({
          question: `[${examType}] Find the average of ${a}, ${b}, ${c}, ${d} and ${e}.`,
          correctAnswer: answer,
          wrongAnswers: [
            answer + 2,
            answer - 2,
            answer + 4
          ],
          explanation: `Average = (${a} + ${b} + ${c} + ${d} + ${e}) / 5 = ${answer}.`
        });
      },

      // Speed
      () => {
        const speed = randomInt(30, 80);
        const time = randomInt(2, 8);
        const distance = speed * time;

        return createMathQuestion({
          question: `[${examType}] A train travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
          correctAnswer: `${distance} km`,
          wrongAnswers: [
            `${distance + speed} km`,
            `${distance - speed} km`,
            `${distance + randomInt(20, 60)} km`
          ],
          explanation: `Distance = Speed × Time = ${speed} × ${time} = ${distance} km.`
        });
      }
    );
  }


  // =====================================================
  // BANKING PO / RBI / HARD LEVEL
  // =====================================================

  if (isBankingPO || isRBI || isHardLevel) {

    mathGenerators.push(

      // Compound Growth
      () => {
        const amount = randomInt(2, 4);
        const years = randomInt(2, 4);

        const answer = Math.pow(amount, years);

        return createMathQuestion({
          question: `[${examType}] An investment multiplies by ${amount} times every year. What will be the multiplication factor after ${years} years?`,
          correctAnswer: `${answer} times`,
          wrongAnswers: [
            `${answer + amount} times`,
            `${answer - amount} times`,
            `${amount * years} times`
          ],
          explanation: `Multiplication factor = ${amount}^${years} = ${answer} times.`
        });
      },

      // Pipes and Cistern
      () => {
        const a = randomInt(6, 12);
        const b = randomInt(12, 24);

        const answer = (a * b) / (a + b);

        return createMathQuestion({
          question: `[${examType}] Pipe A can fill a tank in ${a} hours and Pipe B can fill it in ${b} hours. How long will both pipes take together?`,
          correctAnswer: `${answer} hours`,
          wrongAnswers: [
            `${a + b} hours`,
            `${Math.max(a, b)} hours`,
            `${Math.round(answer + 2)} hours`
          ],
          explanation: `Combined rate = 1/${a} + 1/${b}. Therefore, time = ${a}×${b}/(${a}+${b}) = ${answer} hours.`
        });
      },

      // Percentage Increase and Decrease
      () => {
        const increase = randomInt(10, 40);
        const decrease = randomInt(10, 30);

        const answer =
          ((1 + increase / 100) * (1 - decrease / 100) - 1) * 100;

        return createMathQuestion({
          question: `[${examType}] A value is increased by ${increase}% and then decreased by ${decrease}%. What is the net percentage change?`,
          correctAnswer: `${answer.toFixed(2)}%`,
          wrongAnswers: [
            `${(increase - decrease).toFixed(2)}%`,
            `${Math.abs(answer).toFixed(2)}% increase`,
            `${(answer + 5).toFixed(2)}%`
          ],
          explanation: `Net change = [(1 + ${increase}/100)(1 - ${decrease}/100) - 1] × 100 = ${answer.toFixed(2)}%.`
        });
      }
    );
  }


  // =====================================================
  // RAILWAY / SSC / BANKING CLERK / MEDIUM LEVEL
  // =====================================================

  if (isRailway || isSSCCGL || isSSCCHSL || isBankingClerk || isMediumLevel) {

    mathGenerators.push(

      // Train / Speed
      () => {
        const speed = randomInt(40, 90);
        const time = randomInt(2, 6);
        const distance = speed * time;

        return createMathQuestion({
          question: `[${examType}] A train travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
          correctAnswer: `${distance} km`,
          wrongAnswers: [
            `${distance + speed} km`,
            `${distance - speed} km`,
            `${speed + time} km`
          ],
          explanation: `Distance = Speed × Time = ${speed} × ${time} = ${distance} km.`
        });
      },

      // Profit and Loss
      () => {
        const cost = randomInt(200, 1000);
        const profitPercent = randomInt(10, 40);
        const profit = (cost * profitPercent) / 100;
        const selling = cost + profit;

        return createMathQuestion({
          question: `[${examType}] An article is bought for ₹${cost} and sold at a profit of ${profitPercent}%. What is the selling price?`,
          correctAnswer: `₹${selling}`,
          wrongAnswers: [
            `₹${cost + profitPercent}`,
            `₹${cost - profit}`,
            `₹${selling + 100}`
          ],
          explanation: `Profit = ${profitPercent}% of ₹${cost} = ₹${profit}. Selling Price = ₹${cost} + ₹${profit} = ₹${selling}.`
        });
      },

      // Ratio
      () => {
        const x = randomInt(2, 8);
        const y = randomInt(3, 10);
        const multiplier = randomInt(4, 12);

        const first = x * multiplier;
        const second = y * multiplier;

        return createMathQuestion({
          question: `[${examType}] The ratio of two numbers is ${x}:${y}. If the first number is ${first}, what is the second number?`,
          correctAnswer: second,
          wrongAnswers: [
            second + randomInt(2, 10),
            second - randomInt(1, Math.min(5, second - 1)),
            first
          ],
          explanation: `Multiplier = ${first} ÷ ${x} = ${multiplier}. Second number = ${y} × ${multiplier} = ${second}.`
        });
      },

      // Simple Interest
      () => {
        const principal = randomInt(2, 10) * 1000;
        const rate = randomInt(5, 12);
        const time = randomInt(2, 5);

        const interest = (principal * rate * time) / 100;

        return createMathQuestion({
          question: `[${examType}] Find the simple interest on ₹${principal} at ${rate}% per annum for ${time} years.`,
          correctAnswer: `₹${interest}`,
          wrongAnswers: [
            `₹${interest + 500}`,
            `₹${Math.max(100, interest - 500)}`,
            `₹${interest + 1000}`
          ],
          explanation: `SI = (P × R × T) / 100 = (${principal} × ${rate} × ${time}) / 100 = ₹${interest}.`
        });
      }
    );
  }


  // =====================================================
  // FALLBACK IF NO EXAM LEVEL MATCHES
  // =====================================================

  if (mathGenerators.length === 0) {

    mathGenerators.push(

      () => {
        const number = randomInt(100, 1000);
        const percent = randomInt(5, 50);
        const answer = (number * percent) / 100;

        return createMathQuestion({
          question: `[${examType}] What is ${percent}% of ${number}?`,
          correctAnswer: answer,
          wrongAnswers: [
            answer + 10,
            answer - 10,
            answer + 20
          ],
          explanation: `${percent}% of ${number} = ${answer}.`
        });
      },

      () => {
        const a = randomInt(10, 50);
        const b = randomInt(10, 50);
        const answer = a + b;

        return createMathQuestion({
          question: `[${examType}] What is ${a} + ${b}?`,
          correctAnswer: answer,
          wrongAnswers: [
            answer + 5,
            answer - 5,
            answer + 10
          ],
          explanation: `${a} + ${b} = ${answer}.`
        });
      }
    );
  }


  // =====================================================
  // GENERATE UNIQUE QUESTIONS
  // =====================================================

  let attempts = 0;
  const maxAttempts = count * 20;

  while (questions.length < count && attempts < maxAttempts) {

    const generator =
      mathGenerators[
        randomInt(0, mathGenerators.length - 1)
      ];

    const question = generator();

    tryAdd(question);

    attempts++;
  }
  } else {
    const genericTemplates = [
      {
        q: (t, e) => `[${e}] Which of the following core concepts best defines ${t}?`,
        opts: (t) => [`Established regulatory and structural framework governing ${t}`, `Historical treaty signed in 1857`, `Temporary economic guideline abolished in 2000`, `Local municipal directive`],
        idx: 0,
        exp: (t, e) => `This tests foundational understanding of ${t} at the specified ${e} level.`
      },
      {
        q: (t, e) => `[${e}] With reference to ${t}, consider the following:\n1. It plays an essential role in official curriculum standards.\n2. Implementation requires adherence to prescribed guidelines.\nWhich statement is correct?`,
        opts: () => [`1 only`, `2 only`, `Both 1 and 2`, `Neither 1 nor 2`],
        idx: 2,
        exp: (t) => `Both statements accurately reflect standard principles of ${t}.`
      },
      {
        q: (t, e) => `[${e}] What is the primary objective of regulatory provisions for ${t}?`,
        opts: (t) => [`Ensuring structured implementation and operational transparency`, `Restricting public access`, `Replacing constitutional articles`, `Mandating bi-annual elections`],
        idx: 0,
        exp: (t) => `Structured implementation and transparency form the primary objective of ${t}.`
      },
      {
        q: (t, e) => `[${e}] Which key requirement must be satisfied regarding ${t}?`,
        opts: (t) => [`Compliance with official benchmarks and guidelines`, `International treaty approval`, `Exemption from financial audit`, `Minimum 50 years of prior existence`],
        idx: 0,
        exp: (t) => `Compliance with official guidelines is mandatory for ${t}.`
      },
      {
        q: (t, e) => `[${e}] Which metric is most commonly evaluated in relation to ${t}?`,
        opts: (t) => [`Performance and compliance evaluation index`, `Gross Happiness Index only`, `Atmospheric pressure index`, `Random sample index`],
        idx: 0,
        exp: (t) => `Compliance and performance indices measure ${t} effectiveness.`
      }
    ];

    for (let i = 0; i < count; i++) {
      const tpl = genericTemplates[i % genericTemplates.length];
      tryAdd({
        question: tpl.q(topic, examType),
        options: tpl.opts(topic),
        correctIndex: tpl.idx,
        explanation: tpl.exp(topic, examType)
      });
    }
  }

  return questions.slice(0, count);

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
  const examMatch = contentText.match(/exam, sub-exam & level:\s*([^.\n|]+)/i) || contentText.match(/exam style:\s*([^.\n|]+)/i) || contentText.match(/Exam type:\s*([^.\n|]+)/i);
  if (examMatch && examMatch[1].trim()) {
    examType = examMatch[1].trim();
  }

  let count = 5;
  const countMatch = contentText.match(/exactly\s*(\d+)/i) || contentText.match(/Generate\s*(\d+)/i);
  if (countMatch && countMatch[1]) {
    count = parseInt(countMatch[1], 10);
  }

  const avoidList = [];
  const avoidMatch = contentText.match(/Previously used questions[^\n]*\n([\s\S]*?)(?:\n\n|\nGenerate|$)/i);
  if (avoidMatch && avoidMatch[1]) {
    const lines = avoidMatch[1].split("\n");
    lines.forEach((l) => {
      const cleaned = l.replace(/^\d+\.\s*/, "").trim();
      if (cleaned && cleaned !== "none") avoidList.push(cleaned);
    });
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

  let examLevel = "moderate";
  const levelMatch = contentText.match(/Target level:\s*([^\.\n|]+)/i);
  if (levelMatch && levelMatch[1].trim()) {
    examLevel = levelMatch[1].trim();
  }
  const questions = generateLevelAwareMockQuestions(topic, examType, examLevel, avoidList, count);
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

export async function generateBatch(topic, examContext, avoidList, batchSize, referencePYQs = []) {
  const context = typeof examContext === "string" ? { category: examContext } : (examContext || {});
  const examCategory = context.category || context.name || "General";
  const subExam = context.subExam || context.name || "General";
  const targetLevel = context.level || "General Competitive";
  const examLabel = `${examCategory} - ${subExam} - ${targetLevel}`;
  const referenceText = referencePYQs && referencePYQs.length
    ? `\nReference PYQs for exam style and difficulty (use as guidance only; do not copy):\n${referencePYQs
        .slice(0, 4)
        .map((pyq, idx) => `Reference ${idx + 1}: ${pyq.question || ""}\nOptions: ${(pyq.options || []).join(" | ")}`)
        .join("\n\n")}`
    : "";

  const system = `You are an expert question-setter for Indian competitive exams.

Generate exactly ${batchSize} original, high-quality, completely unique multiple-choice questions.

CRITICAL UNIQUENESS & LEVEL DIFFERENTIATION RULES:
1. The requested topic (${topic || "General Knowledge"}) is the PRIMARY subject.
2. The selected exam category (${examCategory}), sub-exam (${subExam}), and target level (${targetLevel}) MUST dictate question difficulty, depth, structure, numerical values, and concept variation.
3. UNIQUENESS GUARANTEE: Every question must test a DIFFERENT sub-concept, use DIFFERENT numbers/data, and use UNIQUE option phrasing.
4. NO DUPLICATES: Do NOT generate questions that are semantically similar, repetitive, or structurally identical to each other or to questions in the avoid list.
5. LEVEL APPROPRIATENESS:
   - Matriculation / 10th / Easy (e.g. SSC MTS, RRB Group D): Direct, clear, single-step conceptual or factual questions testing core definitions and basic applications.
   - 10+2 / Intermediate (e.g. SSC CHSL, Railway ALP, NDA): Moderate 1-2 step application and reasoning problems.
   - Graduate / Moderate (e.g. SSC CGL, RRB NTPC, State PSC): Multi-step analytical, multi-option elimination, or calculative problems.
   - Graduate / Hard & Advanced (e.g. UPSC CSE, SBI PO, RBI Grade B): Deep conceptual understanding, multi-statement questions ("Consider the following statements... Which is/are correct?"), close plausible options, and complex application scenarios.

MATHS & NUMERICAL VARIATION:
If topic relates to Maths, Quantitative Aptitude, Arithmetic, Algebra, Geometry, Trigonometry, or Number System:
- Every question MUST use different numbers, different values, and test different problem types (e.g., Percentage change, Speed & Distance, Ratio, Work & Time, Interest, Simplification).
- Never repeat the same formula or numerical template across questions.

Return ONLY valid JSON in exactly this structure:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"one short sentence"}]}.`;

  const content = `Requested topic: ${topic || "General Knowledge"}
  Exam type: ${examLabel}
Selected exam category: ${examCategory}
Selected sub-exam: ${subExam}
Target level: ${targetLevel}${referenceText}

Previously generated / used questions that MUST NOT be repeated or semantically duplicated:
${avoidList.map((q, idx) => `${idx + 1}. ${String(q).slice(0, 300)}`).join("\n") || "none"}

Generate exactly ${batchSize} brand new, unique questions now matching the target sub-exam level. Use the reference PYQ style only as guidance and do not copy or paraphrase them. Return ONLY valid JSON.`;
  return requestAI(system, content);
}

export { getAIErrorMessage };

