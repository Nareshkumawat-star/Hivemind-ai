import Razorpay from "razorpay"

let client

// Built on first use rather than at import time. Constructing it eagerly threw
// when the keys were absent, which crashed the process before it could bind a
// port - so a missing secret looked like a totally dead deploy.
export const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
        throw new Error("Razorpay credentials missing: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET")
    }

    if (!client) {
        client = new Razorpay({ key_id, key_secret })
    }

    return client
}

export default getRazorpay
