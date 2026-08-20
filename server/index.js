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
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server",
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
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(response.status || 500).json({
        error:
          data?.error?.message ||
          "AI provider request failed",
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
      return res.status(500).json({
        error: "AI provider returned an empty response",
      });
    }

    res.json({
      success: true,
      text: result,
    });
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