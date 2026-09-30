import redis from "../../shared/redis/redis.js"

const protect = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.session
        if (!sessionId) {
            return res.status(400).json({ message: "unauthorized" })
        }
        const session = await redis.get(`session-${sessionId}`)
        console.log(session)
        if (!session) {
            return res.status(400).json({ message: "session expired" })
        }
        req.user = JSON.parse(session)
        // The chat/billing/agent controllers read the user id from this header.
        // The gateway used to inject it while proxying; now that every service
        // runs in one process we set it here so their code stays unchanged.
        req.headers["x-user-id"] = req.user.userId
        next()

    } catch (error) {
        return res.status(500).json({ message: `protect error ${error}` })
    }
}

export default protect