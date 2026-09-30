import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import cookieParser from "cookie-parser"
import morgan from "morgan"

import protect from "../gateway/middleware/auth.middleware.js"
import { getCurrentUser } from "../gateway/controllers/user.controller.js"
import authRouter from "../services/auth/routes/auth.route.js"
import chatRouter from "../services/chat/routes/chat.routes.js"
import billingRouter from "../services/billing/routes/billing.route.js"
import agentRouter from "../services/agent/routes/agent.route.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const createApp = () => {
    const app = express()

    // Render (and any proxy) terminates TLS in front of us, so trust the
    // forwarded protocol/ip. Needed for correct CORS + secure cookies.
    app.set("trust proxy", 1)

    // Same-origin by default. FRONTEND_URL only matters if you ever host the
    // SPA on a different domain.
    app.use(cors({
        origin: process.env.FRONTEND_URL || true,
        credentials: true
    }))
    app.use(morgan("dev"))
    app.use(cookieParser())
    app.use(express.json())

    // Liveness probe. Renders healthCheckPath points here; also used by the
    // external keep-alive pinger that prevents free-tier spin-down.
    app.get("/api/health", (req, res) => {
        return res.status(200).json({
            status: "ok",
            uptime: process.uptime(),
            db: ["disconnected", "connected", "connecting", "disconnecting"][
                mongoose.connection.readyState
            ]
        })
    })

    // The old gateway proxied these four prefixes to four sibling services.
    // Mounting the routers directly gives identical URLs with no network hop.
    app.use("/api/auth", authRouter)
    app.use("/api/chat", protect, chatRouter)
    app.use("/api/agent", protect, agentRouter)
    app.use("/api/billing", protect, billingRouter)
    app.get("/api/me", protect, getCurrentUser)

    // Serve the built React app from the same origin. This is what keeps the
    // session cookie first-party (sameSite: "strict" would break across domains).
    const clientDir = path.resolve(__dirname, "../../frontend/dist")

    if (fs.existsSync(clientDir)) {
        app.use(express.static(clientDir))
        // Express 5 rejects app.get("*"), so match any non-API path explicitly.
        app.get(/^(?!\/api).*/, (req, res) => {
            return res.sendFile(path.join(clientDir, "index.html"))
        })
    } else {
        app.get("/", (req, res) => {
            return res.json({
                message: "Hivemind AI API",
                hint: "frontend/dist not found - run the frontend build"
            })
        })
    }

    // Error handler carried over from the agent service. The agent's rate
    // limiter throws {status, data} which must reach the client as-is.
    app.use((err, req, res, next) => {
        console.log(err)

        if (err.status) {
            return res.status(err.status).json(err.data)
        }

        return res.status(500).json({ message: `server error ${err}` })
    })

    return app
}
