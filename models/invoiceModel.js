import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    //invoiceId: { type: String,  },
    invoiceTemplate:{ type:String },
    companyName: { type: String },
    companyAddress: { type: String, },
    companyContact: { type: String,},
    companyWebsite: { type: String, },
    headerBg: { type: String,  },
    logo: { type: String, }, // Cloudinary image URL
  });
  const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;