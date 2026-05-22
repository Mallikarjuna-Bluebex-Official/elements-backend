import mongoose from "mongoose";

const dayCapacitySchema = new mongoose.Schema({
    date: { type: String, required: true },
    // ✅ MUST be Map
    slots: { type: Map, of: Number, default: {} }
});
const DayCapacity = mongoose.model('DayCapacity', dayCapacitySchema);

export default DayCapacity