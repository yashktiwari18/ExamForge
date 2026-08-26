import { AIServiceError, AI_ERROR_CODES } from "../aiErrors";

function classifyGeminiError(status, message) {
  const msg = String(message || "").toLowerCase();

  if (status === 401 || status === 403) {
    return {
      code: AI_ERROR_CODES.AUTH,
      userMessage: "AI authentication failed. Check your API configuration.",
      retriable: false,
    };
  }

  if (status === 429 || /quota|rate limit|resource exhausted|too many requests/.test(msg)) {
    return {
      code: AI_ERROR_CODES.QUOTA,
      userMessage: "AI quota limit reached. Please retry in a few moments.",
      retriable: true,
    };
  }

  if (status === 400) {
    return {
      code: AI_ERROR_CODES.INVALID_REQUEST,
      userMessage: "AI request was rejected. Please try a different topic or clearer image.",
      retriable: false,
    };
  }

  if (status >= 500) {
    return {
      code: AI_ERROR_CODES.PROVIDER,
      userMessage: "AI provider is temporarily unavailable. Please try again.",
      retriable: true,
    };
  }

  return {
    code: AI_ERROR_CODES.PROVIDER,
    userMessage: "Something went wrong while building your test. Please try again.",
    retriable: true,
  };
}

async function parseJsonBody(response) {
  try {
    return await response.json();
  } catch (cause) {
    throw new AIServiceError("Gemini returned non-JSON response.", {
      code: AI_ERROR_CODES.INVALID_RESPONSE,
      provider: "gemini",
      status: response?.status,
      retriable: true,
      userMessage: "AI returned an unreadable response. Please try again.",
      cause,
    });
  }
}

function ensureBrowserKeySafety(apiKey) {
  const allowProdBrowserKey = import.meta.env.VITE_ALLOW_BROWSER_AI_KEY === "true";

  if (import.meta.env.PROD && apiKey && !allowProdBrowserKey) {
    throw new AIServiceError("Browser AI key usage is blocked in production mode.", {
      code: AI_ERROR_CODES.CONFIGURATION,
      provider: "gemini",
      retriable: false,
      userMessage: "AI client key is disabled in production. Use a server-side AI endpoint.",
    });
  }
}

export async function requestGeminiJson(system, content) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new AIServiceError("Missing VITE_GEMINI_API_KEY.", {
      code: AI_ERROR_CODES.CONFIGURATION,
      provider: "gemini",
      retriable: false,
      userMessage: "AI service is not configured. Add VITE_GEMINI_API_KEY for local development.",
    });
  }

  ensureBrowserKeySafety(apiKey);

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

  let response;
  try {
    response = await fetch(
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
  } catch (cause) {
    throw new AIServiceError("Network error while calling Gemini.", {
      code: AI_ERROR_CODES.NETWORK,
      provider: "gemini",
      retriable: true,
      userMessage: "Network issue while contacting AI service. Please check your connection and retry.",
      cause,
    });
  }

  const data = await parseJsonBody(response);

  if (!response.ok || data.error) {
    const message = data?.error?.message || `Gemini API request failed (${response.status})`;
    const meta = classifyGeminiError(response.status, message);

    throw new AIServiceError(message, {
      ...meta,
      provider: "gemini",
      status: response.status,
    });
  }

  const result = (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();

  if (!result) {
    throw new AIServiceError("Gemini returned an empty response.", {
      code: AI_ERROR_CODES.INVALID_RESPONSE,
      provider: "gemini",
      status: response.status,
      retriable: true,
      userMessage: "AI returned an empty response. Please try again.",
    });
  }

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

  let clean = result
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = clean.search(/[\{\[]/);
  const lastBrace = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
function repairJSONSyntax(str) {
  let s = str;

  // 1. Remove trailing commas before ] or }
  s = s.replace(/,\s*([\]\}])/g, "$1");

  // 2. Insert missing commas between object properties:
  s = s.replace(/([0-9]|true|false|null|"[^"\\]*(?:\\.[^"\\]*)*"|\]|\})\s*[\r\n]+\s*("[\w\-]+\s*":)/g, "$1,\n$2");

  // 3. Insert missing commas between objects in an array: } \n { -> }, \n {
  s = s.replace(/\}\s*[\r\n]+\s*\{/g, "},\n{");

  return s;
}

  try {
    return JSON.parse(clean);
  } catch (cause) {
    let repaired = repairJSONSyntax(clean);
    try {
      return JSON.parse(repaired);
    } catch (e2) {}

    repaired = sanitizeAndRepairJSONString(clean);
    try {
      return JSON.parse(repaired);
    } catch (e3) {}

    repaired = repairJSONSyntax(sanitizeAndRepairJSONString(clean));
    try {
      return JSON.parse(repaired);
    } catch (e4) {
      console.error("Gemini response:", result);
      throw new AIServiceError("Gemini returned invalid JSON.", {
        code: AI_ERROR_CODES.INVALID_RESPONSE,
        provider: "gemini",
        status: response.status,
        retriable: true,
        userMessage: "AI returned an invalid response. Please try again.",
        cause,
      });
    }
  }
}
