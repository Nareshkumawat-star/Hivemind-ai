import Redis from "ioredis"

const redis=new Redis(process.env.REDIS_URL)

redis.on("connect",()=>{
    console.log("redis connected")
})

// Without an error listener, ioredis emits an 'error' event that Node treats as
// an uncaught exception and the whole process dies. A missing or unreachable
// REDIS_URL is a config mistake we want to survive, not crash on.
redis.on("error",(error)=>{
    console.error(`redis error ${error.message}`)
})

export default redis