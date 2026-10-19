import { PLANS } from "../config/Plans.js";
import { updateUserPayment } from "../../auth/controllers/auth.controller.js";
import { callHandler } from "../../../server/internal.js";
import { getRazorpay } from "../config/razorpay.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body ?? {};
        const userId = req.headers["x-user-id"];
        const selectedPlan = plan ? PLANS[plan] : undefined;

        if (!selectedPlan) {
            return res.status(404).json({ message: "plan not found" });
        }

        const order = await getRazorpay().orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`,
        });

        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            plan_name: selectedPlan.name,
            currency: order.currency,
            status: "created",
        });

        return res.status(200).json({ order, plan: selectedPlan });
    } catch (error) {
        return res.status(500).json({ message: `create order error ${error}` });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            req.body ?? {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "missing razorpay verify fields" });
        }

        const generateSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generateSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment Verification Failed" });
        }

        const payment = await Payment.findOne({ orderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({ message: "Payment Not Found" });
        }

        if (payment.status === "paid") {
            return res.status(200).json({ message: "Payment Already Verified" });
        }

        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;
        await payment.save();

        const { data } = await callHandler(updateUserPayment, {
            body: {
                userId: payment.userId,
                plan: payment.plan,
                credits: payment.credits,
                plan_name: payment.plan_name,
            },
        });

        return res
            .status(200)
            .json({ message: "Payment Verified", status: data?.status, credits: data?.credits });
    } catch (error) {
        return res
            .status(500)
            .json({ message: `verify payment error ${error?.message || error}` });
    }
};

export const paymentWebhook = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "method not allowed" });
    }

    try {
        const signature =
            req.headers["x-razorpay-signature"] || req.body.razorpay_signature;

        const { razorpay_order_id, razorpay_payment_id, razorpay_payment_status, error } =
            req.body ?? {};

        if (!signature) {
            return res.status(400).json({ message: "missing razorpay signature" });
        }

        if (error || razorpay_payment_status !== "captured") {
            const payment = await Payment.findOne({ orderId: razorpay_order_id });

            if (payment) {
                payment.status = "failed";
                await payment.save();
            }

            return res
                .status(200)
                .json({ message: "webhook received", status: "failed", error });
        }

        const generateSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generateSignature !== signature) {
            return res.status(400).json({ message: "invalid signature" });
        }

        const payment = await Payment.findOne({ orderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({ message: "Payment Not Found" });
        }

        if (payment.status === "paid") {
            return res.status(200).json({ message: "Payment Already Verified" });
        }

        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;
        await payment.save();

        const { data } = await callHandler(updateUserPayment, {
            body: {
                userId: payment.userId,
                plan: payment.plan,
                credits: payment.credits,
                plan_name: payment.plan_name,
            },
        });

        return res
            .status(200)
            .json({ message: "Payment Verified", status: data?.status, credits: data?.credits });
    } catch (error) {
        return res
            .status(500)
            .json({ message: `webhook error ${error?.message || error}` });
    }
};
