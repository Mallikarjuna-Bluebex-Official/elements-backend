import AddOn from "../models/addonModel.js";

// Add a new add-on
const createAddOn = async (req, res) => {
    try {
      const addOn = new AddOn(req.body);
      await addOn.save();
      res.status(201).json(addOn);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  // Get all add-ons
const viewAddOn =  async (req, res) => {
    try {
      const addOns = await AddOn.find();
      res.json(addOns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Update an add-on
const updateAddOn = async (req, res) => {
  //console.log(req.body);
  const {id} = req.params;
  let {name,price,description} = req.body;
    try {
      price = Number(price);

      if (isNaN(price)) {
        return res.status(400).json({ error: "Invalid price. Must be a number." });
      }

      //console.log("Updating Add-On with ID:", id);
      //console.log("Updated Data:", { name, price, description });
      
      const addOn = await AddOn.findByIdAndUpdate(id, { name, price, description }, { new: true });

      if (!addOn) {
        return res.status(404).json({ error: "Add-On not found" });
      }
      res.json(addOn);
    } catch (error) {
      console.error("Error updating Add-On:", error);
      res.status(400).json({ error: error.message });
    }
  };
  
  // Delete an add-on
const deleteAddOn = async (req, res) => {
    const {id} = req.params;
    try {
      await AddOn.findByIdAndDelete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

export {createAddOn,viewAddOn,updateAddOn,deleteAddOn}