import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  date: String, // "2026-04-30"
  start: Number, // minutes (e.g., 300 for 5:00 AM)
  end: Number,   // minutes (e.g., 540 for 9:00 AM)
  booked: { type: Number, default: 0 }
});

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

export default TimeSlot;