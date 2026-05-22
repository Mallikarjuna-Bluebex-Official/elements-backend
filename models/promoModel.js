import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  ctaText: { type: String, default: "" },
  ctaLink: { type: String, default: "" },
  emoji: { type: String, default: "🎁" },
  delaySeconds: { type: Number, default: 1 },
  colorFrom: { type: String, default: "#7F77DD" },
  colorTo: { type: String, default: "#534AB7" },
});

const Promo = mongoose.model("Promo", promoSchema);

export default Promo;