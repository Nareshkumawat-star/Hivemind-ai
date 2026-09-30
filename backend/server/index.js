import "dotenv/config"
import mongoose from "mongoose"

import { createApp } from "./app.js"

// Render injects PORT (default 10000) and requires binding 0.0.0.0.
const port = process.env.PORT || 10000

const start = async () => {
    // One connection for the whole app. Previously auth, chat, billing and
    // agent each opened their own mongoose connection to the same database.
    if (!process.env.MONGODB_URI) {
        console.warn("MONGODB_URI is not set - database routes will fail")
    } else {
        try {
            await mongoose.connect(process.env.MONGODB_URI)
            console.log("db connected")
        } catch (error) {
            // Don't exit: keep serving so /api/health stays up and the
            // problem is visible instead of crash-looping on the free tier.
            console.error(`db error ${error}`)
        }
    }

    if (!process.env.REDIS_URL) {
        console.warn("REDIS_URL is not set - sessions will not work")
    }

    const app = createApp()

    app.listen(port, "0.0.0.0", () => {
        console.log(`server started at ${port}`)
    })
}

start()
