import Booking from "../models/userModel.js";
import Event from "../models/eventModel.js";
import AddOn from "../models/addonModel.js";
import PaymentGateway from "../models/paymentGatewayModel.js";
import SiteVisit from "../models/sitevisitModel.js";
import moment from 'moment';
import TimeSlot from '../models/slotModel.js'
import DayCapacity from "../models/dayCapacity.js";
import mongoose from "mongoose";

const today = moment().format('YYYY-MM-DD'); // e.g., "2025-06-10"

// Increment visit
const countVisits = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    let siteVisit = await SiteVisit.findOne();

    if (!siteVisit) {
      // First time setup
      siteVisit = new SiteVisit({
        visits: 1,
        prevVisits: 0,
        lastVisitMonth: currentMonth,
      });
    } else {
      if (siteVisit.lastVisitMonth !== currentMonth) {
        // Month has changed
        siteVisit.prevVisits = siteVisit.visits;
        siteVisit.visits = 1;
        siteVisit.lastVisitMonth = currentMonth;
      } else {
        // Same month, increment
        siteVisit.visits += 1;
      }
    }

    await siteVisit.save();

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Decrement visit
const updateVisits = async (req, res) => {
  try {

    let siteVisit = await SiteVisit.findOne();
      
    // Decrement
    siteVisit.visits -= 1;

    await siteVisit.save();

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


const bookingEvent = async (req, res) => {
  try {
    const { selectedDate, services, addOns, userInfo, priceSummary, paymentStatus } = req.body;

    if (!services || services.length === 0) {
      return res.status(400).json({ message: 'No services selected' });
    }

     // Get or create day capacity
    let dayData = await DayCapacity.findOne({ date: selectedDate });

    if (!dayData) {
      dayData = new DayCapacity({date: selectedDate, slots: new Map()});
    }

    const updatedServices = [];

     // 🔥 STEP 1: CHECK ALL SERVICES FIRST
        for (const service of services) {
            const event = await Event.findById(service._id);

            if (!event) {
                throw new Error(`Event not found: ${service.name}`);
            }

            const { start, end } = parseTimeRange(event.time);
            const slots = getTimeSlots(start, end);

            for (let slot of slots) {
                if (!dayData.slots.has(slot)) {
                  dayData.slots.set(slot, 0);
                }

                const current = dayData.slots.get(slot);

                if (current + service.quantity > MAX_CAPACITY) {
                  res.status(500).send(`Slot full for ${event.name}`);
                  //throw new Error(`Slot full for ${event.name}`);
                }
          }
             // ✅ Push service
            updatedServices.push({
            ...service,
            eventId: event._id,
          });
        }

    // ✅ Create booking
    const newBooking = new Booking({
      selectedDate,
      services: updatedServices,
      addOns,
      userInfo,
      priceSummary,
      paymentStatus,
    });

    await newBooking.save();

    res.status(201).json({ bookingId: newBooking._id });

  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).send('Error saving booking');
  }
};

// Convert "5:00 am - 8:30 pm" → minutes
const parseTimeRange = (timeStr) => {
    if (!timeStr) {
        throw new Error("Event time is missing");
    }

    // 🔥 Normalize all dash types to standard "-"
    const normalized = timeStr.replace(/–|—/g, '-');

    const parts = normalized.split('-');

    if (parts.length !== 2) {
        throw new Error(`Invalid time format: ${timeStr}`);
    }

    const [startStr, endStr] = parts.map(s => s.trim());

    const toMinutes = (str) => {
        let [time, modifier] = str.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
        if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;

        return hours * 60 + minutes;
    };

    return {
        start: toMinutes(startStr),
        end: toMinutes(endStr)
    };
};

// Break into 30-min slots
const getTimeSlots = (start, end, step = 30) => {
    const slots = [];
    for (let i = start; i < end; i += step) {
        slots.push(`${i}-${i + step}`);
    }
    return slots;
};



const MAX_CAPACITY = 5;

const updatePaymentStatus = async (req, res) => {
    console.log("🔥 updatePaymentStatus CALLED");

    const { bookingId } = req.params;
    const { paymentStatus, selectedDate, services } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { paymentStatus },
            { new: true, session }
        );

        if (!updatedBooking) {
            throw new Error('Booking not found');
        }

        // Get or create day capacity
        let dayData = await DayCapacity.findOne({ date: selectedDate }).session(session);

        if (!dayData) {
            dayData = new DayCapacity({date: selectedDate, slots: new Map()});
        }
        
        console.log("STEP 1: CHECK ALL SERVICES FIRST")
        // 🔥 STEP 1: CHECK ALL SERVICES FIRST
        for (const service of services) {
            const event = await Event.findById(service._id).session(session);

            if (!event) {
                throw new Error(`Event not found: ${service.name}`);
            }

            const { start, end } = parseTimeRange(event.time);
            const slots = getTimeSlots(start, end);

            for (let slot of slots) {
                if (!dayData.slots.has(slot)) {
                  dayData.slots.set(slot, 0);
                }

                const current = dayData.slots.get(slot);

                if (current + service.quantity > MAX_CAPACITY) {
                    throw new Error(`Slot full for ${event.name}`);
                }
            }
        }

        console.log("STEP 2: UPDATE AFTER VALIDATION")
        // 🔥 STEP 2: UPDATE AFTER VALIDATION
        for (const service of services) {
            const event = await Event.findById(service._id).session(session);

            if (!event) {
              throw new Error(`Event not found: ${service.name}`);
            }

            const dateKey = new Date(selectedDate).toISOString().split("T")[0];

            // Ensure Map exists
            if (!event.slotsByDate) {
                event.slotsByDate = new Map();
            }

            // Ensure Map exists
            if (!event.bookingsByDate) {
                event.bookingsByDate = new Map();
            }

            // ✅ Get current values
            const availableSlots = event.slotsByDate.get(dateKey) ?? event.slotsLeft;
            const bookedCount = event.bookingsByDate.get(dateKey) ?? 0;

           // ✅ Validation
            if (availableSlots < service.quantity) {
             throw new Error(`Not enough slots for ${service.name}`);
            }

           // ✅ Update values
            event.slotsByDate.set(dateKey, availableSlots - service.quantity);
            event.bookingsByDate.set(dateKey, bookedCount + service.quantity);

          // Save WITH session
            await event.save({ session });

            const { start, end } = parseTimeRange(event.time);
            const slots = getTimeSlots(start, end);

            for (let slot of slots) {
              const current = dayData.slots.get(slot) || 0;
              //console.log(`Updating ${slot}: ${current} → ${current + service.quantity}`);
              dayData.slots.set(slot, current + service.quantity);
           }
        }
        
        dayData.markModified('slots');
        await dayData.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedBooking);

    } catch (error) {
    console.error("❌ ERROR:", error.message);

    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ message: error.message });
}
};

// User Controller: Get Event Slots for a Date
const getEventSlots = async (req, res) => {
  try {
      const { eventId, date } = req.params;

      const event = await Event.findById(eventId);
      if (!event) {
          return res.status(404).json({ message: 'Event not found' });
      }

      const dayData = await DayCapacity.findOne({ date });

      const { start, end } = parseTimeRange(event.time);
      const slots = getTimeSlots(start, end);

      let minAvailable = MAX_CAPACITY;

      for (let slot of slots) {
          const booked = dayData?.slots?.get(slot) || 0;
          const available = MAX_CAPACITY - booked;
          minAvailable = Math.min(minAvailable, available);
      }

      res.json({ slotsLeft: minAvailable });

  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const { date } = req.query;
    console.log("datekey: ",date)
    // convert selected date into YYYY-MM-DD
    const dateKey = new Date(date).toISOString().split("T")[0];
    console.log("datekey: ",dateKey)
    // get all events
    const events = await Event.find();

    // get capacity data for selected date
    const dayData = await DayCapacity.findOne({ date: dateKey });

    const result = events.map(event => {

      // get start and end time
      const { start, end } = parseTimeRange(event.time);

      // generate all 30-min slots
      const slots = getTimeSlots(start, end);

      console.log("Start:", start);
      console.log("End:", end);
      console.log("Slots:", slots);

      let isTimeBlocked = false;

      // start with very large number
      let minRemaining = Infinity;

      // event slots for selected date
      const slotsLeft =
        event.slotsByDate?.get(dateKey) ?? event.slotsLeft;

      console.log("Event Slots Left:", slotsLeft);

      // loop through each time slot
      for (let slot of slots) {

        // already booked in this slot
        const current = dayData?.slots?.get(slot) || 0;

        // remaining capacity for this slot
        const remaining = MAX_CAPACITY - current;

        console.log("Slot:", slot);
        console.log("Current:", current);
        console.log("Remaining:", remaining);

        // if capacity finished
        if (remaining <= 0) {
          isTimeBlocked = true;
        }

        // store minimum remaining capacity
        minRemaining = Math.min(minRemaining, remaining);
      }

      /*
        final remaining slots should consider:
        1. event slots left
        2. day capacity remaining
      */
      const finalRemaining = Math.min(slotsLeft, minRemaining);

      console.log("Final Remaining:", finalRemaining);

      return {
        ...event.toObject(),

        // no event slots
        isSoldOut: slotsLeft <= 0,

        // no day capacity
        isTimeBlocked,

        // frontend uses this
        remainingSlots: isTimeBlocked ? 0 : finalRemaining
      };
    });

    console.log(result);

    res.status(200).json(result);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
};

//get AddOn
const getAddOn =  async (req, res) => {
  try {
    const addOns = await AddOn.find();
    res.json(addOns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const activeGatewayInUser = async (req, res) => {
  //console.log("enter into activeGateway")
  try {
    const activeGateway = await PaymentGateway.findOne();
    //console.log("activeGateway",activeGateway)
    //console.log("activeGateway name: ",activeGateway.gateway)
    if (!activeGateway) {
      return res.json({ gateway: null });
    }
    res.json({ gateway: activeGateway.gateway }); // Send only the gateway name
  } catch (error) {
    res.status(500).json({ message: "Error fetching active gateway", error });
  }
};


const makePaymentToGateway = async (req, res) => {
  const { amount, userId } = req.body;

  try {
    const activeGateway = await PaymentGateway.findOne();
    if (!activeGateway) return res.status(400).json({ message: "No active gateway enabled" });

    let paymentResponse;

    if (activeGateway.gateway === "Razorpay") {
      paymentResponse = await processRazorpayPayment(amount, activeGateway.apiKey, activeGateway.secretKey);
    } else if (activeGateway.gateway === "PayU") {
      paymentResponse = await processPayUPayment(amount, activeGateway.apiKey, activeGateway.secretKey);
    }
    
    res.json(paymentResponse);
  } catch (error) {
    res.status(500).json({ message: "Payment processing error", error });
  }
};

export {bookingEvent,getEvents,getEventSlots,getAddOn,updatePaymentStatus,makePaymentToGateway,activeGatewayInUser, countVisits,updateVisits}