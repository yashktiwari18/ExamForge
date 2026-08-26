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