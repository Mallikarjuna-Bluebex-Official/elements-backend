import mongoose from "mongoose";

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  isSelected: { type: Boolean, default: false }
});

const AddOn = mongoose.model('AddOn', addOnSchema);

export default AddOn;