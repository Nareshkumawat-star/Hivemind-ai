import { getModel } from "../config/llmModels.js"
import { generatePdf } from "../utils/generatePdf.js"
import { saveArtifact, artifactUrl } from "../../../shared/files/fileStore.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"
export const pdfAgent=async (state) => {
    try {
        const rate=await checkAgentLimit(state.userId,"pdf")
        
        
        const llm=await getModel("pdf")
        const prompt=`
        You are an expert document writer.

Return ONLY valid JSON.

Do NOT return markdown.

Do NOT return explanations.

Structure:

{
"title":"",
"subtitle":"",
"sections":[
{
"heading":"",
"points":[]
}
]
}

Generate 4-8 sections.

Each section should have 3-6 concise bullet points.

Topic:

${state.prompt}
        `

        const res=await llm.invoke(prompt)

        // Strip ```json fences some models add, so a fenced reply still parses.
        const raw=String(res.content ?? "").trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim()
        const data=JSON.parse(raw)
       await deductCredits(state.userId,"pdf")
        
        const pdfBuffer=await generatePdf(data)

        const filename=`pdf-${Date.now()}.pdf`
        const key=await saveArtifact(filename,pdfBuffer,"application/pdf")

        const downloadUrl=artifactUrl(key)

        return {
          ...state,
          aiResponse:`# PDF Generated

**${data.title}**

📥 [Download PDF](${downloadUrl})

_Link stays valid for 7 days._`
        }

    } catch (error) {
       console.log(error)
         return {
            ...state,
            aiResponse:error?.data?.message || `failed to generate pdf: ${error.message}`
        }
    }
}