import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    time: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    slotsLeft: { type: Number, required: true },//Total slots of service
    description: { type: String },
    slotsByDate: { type: Map, of: Number }, //Track slots left from total slots per day
    bookingsByDate: { type: Map, of: Number }, //Track booked slots from total slots per day
});


const Event = mongoose.model('Event', eventSchema);

export default Event;
