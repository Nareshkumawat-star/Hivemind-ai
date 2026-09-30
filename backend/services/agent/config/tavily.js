import { TavilySearch } from "@langchain/tavily"

let searchTool

// Lazy: an eager TavilySearch() throws without TAVILY_API_KEY.
export const getSearchTool = () => {
    if (!process.env.TAVILY_API_KEY) {
        throw new Error("TAVILY_API_KEY is not set (needed for the search agent)")
    }

    if (!searchTool) {
        searchTool = new TavilySearch({
            maxResults: 5,
            topic: "general",
            includeImages: true
        })
    }

    return searchTool
}
