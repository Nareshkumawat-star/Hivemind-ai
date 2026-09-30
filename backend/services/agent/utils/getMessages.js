import { getMessages as chatGetMessages } from "../../chat/controllers/chat.controller.js"
import { callHandler } from "../../../server/internal.js"

export const getMessages = async (conversationId) => {
    try {
        const { data } = await callHandler(chatGetMessages, {
            params: { conversationId }
        })
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}