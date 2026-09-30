import { QdrantVectorStore } from "@langchain/qdrant"
import { getEmbeddings } from "./embeddings.js"

export const vectorStore = async (docs, collectionName) => {
    if (!process.env.QDRANT_URL) {
        throw new Error("QDRANT_URL is not set (needed for PDF RAG)")
    }

    return await QdrantVectorStore.fromDocuments(docs, getEmbeddings(), {
        url: process.env.QDRANT_URL,
        // Required by Qdrant Cloud; harmless against a local instance.
        apiKey: process.env.QDRANT_API_KEY,
        collectionName
    })
}
