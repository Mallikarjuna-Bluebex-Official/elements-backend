import Event from "../models/eventModel.js";

// Admin Controller: Add or Update Events
const addEvents = async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();

        res.status(201).json({message: 'Event added successfully', event});
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
  
   // Get all Events
   const viewEvents =  async (req, res) => {
    try {
      const events = await Event.find();
      //console.log(events)
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  const viewOneEvent = async(req,res) => {
    try {
      const { serviceId } = req.params;
      const event = await Event.findOne({ "options._id": serviceId });
  
      if (!event) {
        return res.status(404).json({ error: "Service not found" });
      }
  
      // Extract the specific service
      const service = event.options.find((s) => s._id.toString() === serviceId);
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Error fetching service details" });
    }
  }
  
  
  const updateEvent = async (req, res) => {
  try {
    const { id } = req.params; // ✅ get from URL
    console.log("update: ",id)
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        ...req.body,
        price: req.body.price ? Number(req.body.price) : undefined,
        discount: req.body.discount ? Number(req.body.discount) : 0,
        slotsLeft: req.body.slotsLeft ? Number(req.body.slotsLeft) : undefined,
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json({
      message: "Event updated successfully",
      updatedEvent,
    });

  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
  
  const deleteEvent = async (req, res) => { 
    
    try {
        console.log("Params:", req.params);
  
        const { id } = req.params;
        const deletedEvent = await Event.findByIdAndDelete(id);

        if (!deletedEvent) {
          return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error('Error deleting option:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  };
  
export {addEvents,viewEvents,viewOneEvent,updateEvent,deleteEvent}