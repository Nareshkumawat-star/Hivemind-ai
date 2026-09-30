import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter"

// Clients are built on first use and cached per agent. Eagerly constructing all
// three requires GROQ/GOOGLE/OPENROUTER keys just to import the module, which
// took down the entire server when any one was missing.
const cache = {}

const build = (agent) => {
    if (agent === "coding") {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("OPENROUTER_API_KEY is not set (needed for the coding agent)")
        }

        return new ChatOpenRouter({
            model: "deepseek/deepseek-chat",
            temperature: 0,
            maxTokens: 2500
        })
    }

    if (agent === "imageAnalyzer") {
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error("GOOGLE_API_KEY is not set (needed for the image analyzer)")
        }

        return new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash"
        })
    }

    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not set")
    }

    return new ChatGroq({
        model: "openai/gpt-oss-120b"
    })
}

// Routing is unchanged: "coding" -> OpenRouter, "imageAnalyzer" -> Gemini,
// everything else (chat/search/pdf/ppt/vision/router/intent) -> Groq.
export const getModel = async (agent) => {
    if (!cache[agent]) {
        cache[agent] = build(agent)
    }

    return cache[agent]
}
