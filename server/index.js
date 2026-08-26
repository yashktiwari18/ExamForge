import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ExamForge server is running",
  });
});


function generateLevelAwareMockQuestions(topic, examType, avoidList = [], count = 5) {
  const topicLower = topic.toLowerCase();
  const examLower = examType.toLowerCase();
  const avoidSet = new Set(avoidList.map((a) => String(a).toLowerCase().trim()));

  const isUPSC = examLower.includes("upsc") || examLower.includes("cse") || examLower.includes("hard & conceptual");
  const isPO = examLower.includes("po") || examLower.includes("sbi") || examLower.includes("ibps po") || examLower.includes("rbi grade b");
  const isMTS = examLower.includes("mts") || examLower.includes("group d") || examLower.includes("constable") || examLower.includes("matriculation") || examLower.includes("10th");

  const questions = [];

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
    } else if (isMTS) {
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
  } else if (topicLower.includes("math") || topicLower.includes("quant") || topicLower.includes("aptitude") || topicLower.includes("arithmetic")) {
    if (isMTS) {
      const bank = [
        {
          question: `[SSC MTS / Group D Level] If 20% of a number is 60, what is the number?`,
          options: ["300", "250", "400", "350"],
          correctIndex: 0,
          explanation: "Number = (60 * 100) / 20 = 300."
        },
        {
          question: `[SSC MTS / Group D Level] A car covers a distance of 180 km in 3 hours. What is its speed in km/h?`,
          options: ["60 km/h", "50 km/h", "70 km/h", "45 km/h"],
          correctIndex: 0,
          explanation: "Speed = Distance / Time = 180 / 3 = 60 km/h."
        },
        {
          question: `[SSC MTS / Group D Level] What is the simple interest on ₹4,000 at 5% per annum for 2 years?`,
          options: ["₹400", "₹500", "₹300", "₹450"],
          correctIndex: 0,
          explanation: "SI = (4000 * 5 * 2) / 100 = ₹400."
        },
        {
          question: `[SSC MTS / Group D Level] Find the average of the first five natural numbers (1, 2, 3, 4, 5).`,
          options: ["3", "2.5", "4", "3.5"],
          correctIndex: 0,
          explanation: "Sum = 15, Average = 15 / 5 = 3."
        },
        {
          question: `[SSC MTS / Group D Level] The cost price of an article is ₹200 and it is sold for ₹240. What is the profit percentage?`,
          options: ["20%", "25%", "15%", "18%"],
          correctIndex: 0,
          explanation: "Profit = 40. Profit % = (40 / 200) * 100 = 20%."
        }
      ];
      bank.forEach(tryAdd);
    } else if (isPO) {
      const bank = [
        {
          question: `[Banking PO Level] A sum of money placed at compound interest doubles itself in 5 years. In how many years will it amount to 8 times itself at the same rate?`,
          options: ["15 years", "10 years", "20 years", "12 years"],
          correctIndex: 0,
          explanation: "Amount becomes 2^3 = 8 times in 3 * 5 = 15 years."
        },
        {
          question: `[Banking PO Level] A vessel contains a mixture of milk and water in the ratio 7:5. If 9 liters of mixture is drawn off and replaced with water, the ratio becomes 7:9. How many liters of milk was in the vessel initially?`,
          options: ["21 liters", "28 liters", "35 liters", "14 liters"],
          correctIndex: 0,
          explanation: "Initial quantity of milk = 21 liters."
        },
        {
          question: `[Banking PO Level] Two pipes A and B can fill a tank in 15 hours and 20 hours respectively, while a third pipe C can empty it in 30 hours. If all three pipes are opened together, how long will it take to fill the tank?`,
          options: ["12 hours", "10 hours", "14 hours", "15 hours"],
          correctIndex: 0,
          explanation: "Net rate = 1/15 + 1/20 - 1/30 = 5/60 = 1/12. Time = 12 hours."
        },
        {
          question: `[Banking PO Level] A seller marks his goods 40% above cost price and allows a discount of 20%. If he makes a net profit of ₹96, what is the cost price of the goods?`,
          options: ["₹800", "₹900", "₹1,000", "₹750"],
          correctIndex: 0,
          explanation: "Effective profit % = 40 - 20 - (40*20)/100 = 12%. CP = 96 / 0.12 = ₹800."
        },
        {
          question: `[Banking PO Level] The present age of A is 4 years more than B's age. Six years ago, the ratio of A's age to B's age was 3:2. What is the present age of B?`,
          options: ["14 years", "18 years", "12 years", "16 years"],
          correctIndex: 0,
          explanation: "B = 14 years."
        }
      ];
      bank.forEach(tryAdd);
    } else {
      const bank = [
        {
          question: `[${examType}] If a number is increased by 25% and then decreased by 20%, what is the net percentage change?`,
          options: ["No change (0%)", "5% increase", "4% decrease", "2% increase"],
          correctIndex: 0,
          explanation: "Net change = 25 - 20 - (25*20)/100 = 0%."
        },
        {
          question: `[${examType}] A train 200 meters long passes a pole in 10 seconds. What is the speed of the train in km/h?`,
          options: ["72 km/h", "60 km/h", "54 km/h", "80 km/h"],
          correctIndex: 0,
          explanation: "Speed = 200 / 10 = 20 m/s = 72 km/h."
        },
        {
          question: `[${examType}] The ratio of two numbers is 4:5 and their HCF is 6. What is their LCM?`,
          options: ["120", "90", "60", "150"],
          correctIndex: 0,
          explanation: "Numbers = 24 and 30. LCM = 120."
        },
        {
          question: `[${examType}] A can do a job in 12 days and B can do it in 24 days. How many days will they take together?`,
          options: ["8 days", "9 days", "6 days", "10 days"],
          correctIndex: 0,
          explanation: "Combined rate = 1/12 + 1/24 = 1/8. Time = 8 days."
        },
        {
          question: `[${examType}] A principal of ₹6,000 yields ₹1,440 simple interest in 3 years. What is the annual interest rate?`,
          options: ["8%", "7%", "9%", "10%"],
          correctIndex: 0,
          explanation: "Rate = (1440 * 100) / (6000 * 3) = 8%."
        }
      ];
      bank.forEach(tryAdd);
    }
  } else {
    const genericTemplates = [
      {
        q: (t, e) => `[${e}] Which of the following core concepts best defines ${t}?`,
        opts: (t) => [`Established regulatory and structural framework governing ${t}`, `Historical treaty signed in 1857`, `Temporary economic guideline abolished in 2000`, `Local municipal directive`],
        idx: 0,
        exp: (t) => `This tests foundational understanding of ${t} at the specified ${e} level.`
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
        explanation: tpl.exp(topic)
      });
    }
  }

  return questions.slice(0, count);
}

function generateMockResponse(system = "", content = "") {
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
    return JSON.stringify({
      topic: topic || "Sample Exam Paper",
      examType: examType || "Banking",
      questions: [
        {
          question: `[Extracted MCQ 1] What is a key principle related to ${topic}?`,
          options: [
            `Core Concept of ${topic}`,
            `Secondary Aspect of ${topic}`,
            `Unrelated Option A`,
            `Unrelated Option B`
          ],
          correctIndex: 0,
          explanation: `This question tests fundamental principles of ${topic}.`
        },
        {
          question: `[Extracted MCQ 2] Which authority or regulation governs ${topic} in India?`,
          options: [
            "Constitutional Provisions / Designated Authority",
            "State Level Municipal Corporation",
            "International Court of Justice",
            "None of the above"
          ],
          correctIndex: 0,
          explanation: `Regulations regarding ${topic} fall under standard legal frameworks.`
        }
      ]
    });
  }

  const questions = generateLevelAwareMockQuestions(topic, examType, avoidList, count);
  return JSON.stringify({ questions });
}

app.post("/api/ai", async (req, res) => {
  try {
    const { system, content } = req.body || {};

    if (!system || !content) {
      return res.status(400).json({
        error: "system and content are required",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      console.log("GEMINI_API_KEY not found. Serving local dev mock response.");
      return res.json({
        success: true,
        text: generateMockResponse(system, content),
        isMock: true,
      });
    }

    const parts = Array.isArray(content)
      ? content.map((part) => {
          if (part.type === "image") {
            return {
              inline_data: {
                mime_type: part.source.media_type,
                data: part.source.data,
              },
            };
          }

          return {
            text: part.text || "",
          };
        })
      : [
          {
            text: String(content || ""),
          },
        ];

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: system,
                },
              ],
            },

            contents: [
              {
                role: "user",
                parts,
              },
            ],

            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.warn("Gemini API call failed, falling back to local dev mock response:", data?.error?.message || response.status);
        return res.json({
          success: true,
          text: generateMockResponse(system, content),
          isMock: true,
        });
      }

      const result = (data.candidates || [])
        .flatMap(
          (candidate) => candidate.content?.parts || []
        )
        .map((part) => part.text || "")
        .join("\n")
        .trim();

      if (!result) {
        return res.json({
          success: true,
          text: generateMockResponse(system, content),
          isMock: true,
        });
      }

      return res.json({
        success: true,
        text: result,
      });
    } catch (apiErr) {
      console.warn("Gemini API network error, falling back to local dev mock response:", apiErr.message);
      return res.json({
        success: true,
        text: generateMockResponse(system, content),
        isMock: true,
      });
    }
  } catch (error) {
    console.error("AI server error:", error);

    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ExamForge server running on port ${PORT}`);
});