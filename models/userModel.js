import mongoose from "mongoose";
import { type } from "os";


const bookingSchema = new mongoose.Schema({
  selectedDate: {
    type: String,
    required: true
  },
  services: [
    {
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity:{
        type:Number
      },
      eventId:{
        type: mongoose.Schema.Types.ObjectId,  // Corrected eventId type
        ref: "Event",  //Establish relationship with Event model
        
      }
    }
  ],
  addOns:[
    {
      name: {
        type: String,
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
    }
  ],
  userInfo: {
    id:{
      type:String,
      required:true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email address']
    },
    contactNumber: {
      type: String,
      required: true,
     // match: [/^\d{10}$/, 'Please enter a valid 10-digit contact number']
    },
    city: {
      type: String,
      required: true
    },
    referralSource: {
      type: String,
      default: 'Other'
    }
  },
  priceSummary: {
    ItemPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  paymentStatus: {
    type: String,
   // enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);



export default Booking