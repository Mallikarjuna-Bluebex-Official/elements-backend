import mongoose from "mongoose";

const paymentGatewaySchema = new mongoose.Schema({
  gateway: { type: String, required: true },  // Payment method (e.g., PayU, PhonePe, Razorpay)
  apiKey: { type: String, required: true },   // API Key
  secretKey: { type: String, required: true } // Secret Key
}, { timestamps: true });

const PaymentGateway = mongoose.model("PaymentGateway", paymentGatewaySchema);

export default PaymentGateway;
