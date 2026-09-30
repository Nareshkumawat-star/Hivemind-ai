import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"

let embeddingsClient

// Lazy for the same reason as the other clients: an eager constructor turns a
// missing GOOGLE_API_KEY into a dead server instead of a clear error.
export const getEmbeddings = () => {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not set (needed for Gemini embeddings)")
    }

    if (!embeddingsClient) {
        embeddingsClient = new GoogleGenerativeAIEmbeddings({
            model: "gemini-embedding-001"
        })
    }

    return embeddingsClient
}
