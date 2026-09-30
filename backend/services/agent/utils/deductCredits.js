import { deductCredits as authDeductCredits } from "../../auth/controllers/auth.controller.js"
import { callHandler } from "../../../server/internal.js"

export const deductCredits = async (userId, agent) => {
    try {
        const { data } = await callHandler(authDeductCredits, {
            body: { userId, agent }
        })
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}