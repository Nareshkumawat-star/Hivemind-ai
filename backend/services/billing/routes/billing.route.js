import express from "express";
import { createOrder, verifyPayment, paymentWebhook } from "../controllers/billing.controller.js";

const router = express.Router();

// createOrder - POST only (must be locked behind auth in production)
router.post("/create", createOrder);

// verifyPayment - POST only: Razorpay POSTs the signature here; GET would
// let anyone masquerade as a paid customer by guessing order ids.
router.post("/verify", verifyPayment);

// Razorpay pushes this POST to the live server once (IPN). Never GET.
router.post("/webhook", paymentWebhook);

export default router;
