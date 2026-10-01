import { getModel } from "../config/llmModels.js"
import { generatePpt } from "../utils/generatePpt.js"
import { saveArtifact, artifactUrl } from "../../../shared/files/fileStore.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"
export const pptAgent=async (state) => {
    try {
        await checkAgentLimit(state.userId,"ppt")
        const llm=await getModel("ppt")
        const prompt=`You are a professional presentation designer.

Return ONLY valid JSON.

Format:

{
"title":"",
"subtitle":"",
"slides":[
{
"title":"",
"points":[
"",
"",
"",
""
]
}
]
}

Rules:

- Generate exactly 6 content slides.
- Each slide should have 4-6 concise bullet points.
- No markdown.
- No explanation.
- No code block.
- Return ONLY JSON.

Topic:

${state.prompt}`

const res=await llm.invoke(prompt)

// Models sometimes wrap the JSON in ```json fences despite the prompt asking
// for none. Strip them so a fenced reply doesn't become "failed to generate ppt".
const raw=String(res.content ?? "").trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim()
const data=JSON.parse(raw)
await deductCredits(state.userId,"ppt")
const ppt=await generatePpt(data)
const buffer=await ppt.write({
    outputType:"nodebuffer"
})

const filename=`ppt-${Date.now()}.pptx`

const key=await saveArtifact(filename,buffer,"application/vnd.openxmlformats-officedocument.presentationml.presentation")
const downloadUrl=artifactUrl(key)

return {
    ...state,
    aiResponse:`# ✅ Presentation Generated

**${data.title}**

📥 [Download PPT](${downloadUrl})

_Link stays valid for 7 days._`
}

    } catch (error) {
        console.log(error)
         return {
            ...state,
            aiResponse:error?.data?.message || `failed to generate ppt: ${error.message}`
        }
       

       
    }
}