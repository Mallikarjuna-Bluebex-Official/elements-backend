import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: { type: String,  unique: true },
  email: { type: String,  unique: true },
  image:{ type:String },
  password: { type: String, },
  role: { type: String, default: "Admin" },
  companyName: { type: String },
  companyWebsite: { type: String },
  companyAddress: { type: String },
  companyEmail: { type: String },
}, { timestamps: true });

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;