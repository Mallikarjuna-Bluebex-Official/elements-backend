import mongoose from 'mongoose'

const siteVisitSchema = new mongoose.Schema({
  visits: { type: Number, default: 0 },
  prevVisits: { type: Number, default: 0 },
  lastVisitMonth: { type: String }, // Format: YYYY-MM
});

const SiteVisit = mongoose.model("SiteVisit", siteVisitSchema);


export default SiteVisit