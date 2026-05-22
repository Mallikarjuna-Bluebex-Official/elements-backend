import Booking from "../models/userModel.js";
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer';
import PaymentGateway from "../models/paymentGatewayModel.js";
import Admin from "../models/adminModel.js"
import bcrypt from "bcryptjs";
import validator from "validator";
import {v2 as cloudinary} from 'cloudinary'
import Invoice from "../models/invoiceModel.js";
import SiteVisit from "../models/sitevisitModel.js";
import ejs from 'ejs'
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data'
import axios from 'axios'

const registerAdmin = async(req,res) => {
  try{
    const {name,email,password} = req.body;

    if(!name || !password || !email){
      return res.json({success:false,message:'Missing details'})
    }

    if(!validator.isEmail(email)){
      return res.json({success:false,message:'enter a valid email'})
    }

    const adminEmail = await Admin.findOne({email})
    if(adminEmail){
        return res.json({success:false,message:'User Already Exists with this Email'})
    }
    if(password.length < 8){
        return res.json({success:false,message:'enter a strong password'})
    }

   //hashing your password
   const salt = await bcrypt.genSalt(10)
   const hashedPassword = await bcrypt.hash(password,salt)

   const adminData = {
    username:name,
    email,
    password:hashedPassword
   }

   const newAdmin = new Admin(adminData)
   const admin = await newAdmin.save()

   const token = jwt.sign({id:admin._id},process.env.JWT_SECRET, { expiresIn: '24h' })

   res.json({success:true,token})

  }catch(error){
      console.log(error)
      res.json({success:false,message:error.message})
  }
}

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.json({ success: false, message: 'Admin not found' });
    }

   const isMatch = await bcrypt.compare(password.trim(), admin.password.trim());
  
   //console.log("password-match: ",isMatch);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid password' });
    }

    // If we reach here, password matched
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ success: true, token });

  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const getVisitCount = async (req, res) => {
  try {
    // Assuming there's only one document
    const stat = await SiteVisit.findOne(); // or use findById if you know the _id
    if (!stat) {
      return res.status(404).json({ error: "SiteVisit not found" });
    }
    return res.json({ stat });
  } catch (error) {
    console.error("Error in getVisitCount:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


const viewBookingData = async(req,res) => {
    try {
        const bookings = await Booking.find();
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching booking data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}   

const getBookedUserInfo = async(req,res) => {
  try{
    const bookingId = req.params.id;
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }
    
  const response = await Booking.findById(bookingId);
  res.status(200).json({ success: true, data: response });

  }catch(error){
    res.status(500).json({ error: error.message });
  }
}

const sendConfirmEmail = async (req, res) => {
    const { bookingId } = req.body;
  
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }
  
    try {
      const booking = await Booking.findById(bookingId);
  
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.userInfo.email,
        subject: 'Booking Confirmation',
        text: `Hi ${booking.userInfo.fullName},\n\n your booking with ID ${bookingId} has been confirmed.\n\nAny queries contact 1234567890.\n\nThank you!`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log("Confirmation email sent successfully")
      res.status(200).json({ message: 'Confirmation email sent successfully' });
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      res.status(500).json({ message: 'Failed to send confirmation email' });
    }
  };

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;


const sendMessage = async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "Phone number and message are required." });
  }

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, response: response.data });
  } catch (error) {
    res.status(500).json({ error: error.response.data });
  }
};

const setActivePaymentGateway = async (req, res) => {
  const { gateway, apiKey, secretKey } = req.body;

  if (!gateway || !apiKey || !secretKey) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Remove any existing gateway and save the new one
    await PaymentGateway.deleteMany(); 
    const newGateway = new PaymentGateway({ gateway, apiKey, secretKey });
    await newGateway.save();

    res.json({ message: `${gateway} enabled successfully!` });
  } catch (error) {
    res.status(500).json({ message: "Error saving payment gateway", error });
  }
};

const getActivePaymentGateway = async (req, res) => {
  try {
    const savedSetting = await PaymentGateway.findOne();
    //console.log("savedSetting: ",savedSetting)
    if (savedSetting) {
      res.json(savedSetting);
    } else {
      res.json({ gateway: "", apiKey: "", secretKey: "" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment settings" });
  }
};

const updateInvoice = async(req,res) => {
  try{
    const { invoiceId, invoice, companyName, companyAddress, companyContact, companyWebsite, headerBg } = req.body;

    const file = req.file.path;

  
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'invoices',
    });
    

    const imageUrl = result.secure_url;

    //console.log("imageUrl: ",imageUrl);
    
    await Invoice.deleteMany(); 
   
    const updatedInvoice = new Invoice (
      {
        invoiceId,
        invoiceTemplate:invoice,
        companyName,
        companyAddress,
        companyContact,
        logo:imageUrl,
        companyWebsite,
        headerBg,
      }
    );
  
    updatedInvoice.save();
  
    res.status(200).json({ message: "Invoice updated successfully" });
  }catch(error){
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const updateInvoiceTemplate = async (req,res) => {

 try{
  
  const updatedInvoice = await Invoice.findOneAndUpdate(
    {}, // no filter needed since there's only one document
    { $set: { invoiceTemplate: req.body.invoiceTemplate } }, // update only this field
    { new: true } // return the updated document
  );
  
  
  res.status(200).json({ message: "Invoice template updated successfully" });
 }catch(error){
  console.error("Error changing invoice template:", error);
  res.status(500).json({ error: "Internal Server Error" });
 }
}


const getUpdatedInvoice = async (req, res) => {
  //console.log("Entering into getUpdatedInvoice")
  try {
      {/*const { invoiceId } = req.params; // Get invoiceId from request parameters
      console.log("invoiceId: ",invoiceId)*/}

      // Find the updated invoice in the database
      const invoice = await Invoice.findOne();
      //console.log("invoice: ",invoice)

      // If invoice not found, return an error
      if (!invoice) {
          console.log("Invoice not found")
          return res.status(404).json({ error: "Invoice not found" });
      }
     
      // Return the updated invoice data
      res.status(200).json({ success: true, invoice });
  } catch (error) {
      console.error("Error fetching updated invoice:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};



// admin profile
const createAdmin = async (req, res) => {
  try {
    const { username, email, password, role, companyName, companyWebsite, companyAddress, companyEmail } = req.body;
    const file = req.file.image;

    {/*let result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "event-images",
    });

    const imageUrl = result.secure_url; */}

    // Check if the email already exists
    let existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new Admin({
      username, email, image:imageUrl, password: hashedPassword, role,
      companyName, companyWebsite, companyAddress, companyEmail
    });

    await user.save();
    res.status(201).json({ message: "Admin created successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//API to get user profile data
const getProfile = async(req,res) => {
  try{
    const {userId} = req.body;
    const userData = await Admin.findById(userId)
    res.json({success:true,userData})
  }catch(error){
      console.log(error)
      res.json({success:false,message:error.message})
  }
}

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { username, password, role, companyName, companyWebsite, companyAddress, companyEmail } = req.body;
    let user = await Admin.findOne({ email: req.params.email });

    if (!user) return res.status(404).json({ message: "Admin not found" });

    // Update user fields
    user.username = username || user.username;
    user.role = role || user.role;
    user.companyName = companyName || user.companyName;
    user.companyWebsite = companyWebsite || user.companyWebsite;
    user.companyAddress = companyAddress || user.companyAddress;
    user.companyEmail = companyEmail || user.companyEmail;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Route to generate invoice PDF
const generateInvoice = async (req, res) => {
  const invoiceData = req.body;

  const response = await Invoice.findOne();
  const template = response.invoiceTemplate;


  try {
    
    const html = await ejs.renderFile(path.join(__dirname, '..', 'views', `${template}.ejs`),invoiceData);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Optional: add delay for Tailwind
    //await new Promise(resolve => setTimeout(resolve, 1000));

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

  //const media_id = await uploadPdfToWhatsapp(pdfBuffer);
  //await sendPdfViaWhatsApp(media_id,invoiceData.userInfo.fullName,invoiceData.userInfo.contactNumber,);

   // Return Cloudinary PDF URL
   res.status(200).json({
    success: true,
    message: 'Invoice generated, uploaded to Cloudinary, and sent via WhatsApp'
  });

 
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating invoice');
  }
};

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;


const uploadPdfToWhatsapp = async (pdfBuffer) => {
const form = new FormData();
const buffer = Buffer.from(pdfBuffer); // Ensures it's a Node.js Buffer

form.append('file', buffer, {
filename: 'invoice.pdf',
contentType: 'application/pdf',
});


form.append('type', 'application/pdf');
form.append('messaging_product', 'whatsapp');

const response = await axios.post(
  `https://graph.facebook.com/v18.0/${phoneNumberId}/media`,
  form,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
  }
);

return response.data.id; // media_id
};

const sendPdfViaWhatsApp = async (media_id,userName,phoneNumber) => {
try {
  const response = await axios.post(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: "bluebex_invoice",
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  filename: "Bluebex_invoice.pdf",
                  id: media_id
                }
              }
            ]
          },
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: `${userName}`
              }
            ]
          }
        ]
      }
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("WhatsApp message sent:", response.data);
} catch (error) {
  console.error("Error sending WhatsApp message:", error.response?.data || error.message);
}
};


export {generateInvoice, getVisitCount,getProfile,viewBookingData,registerAdmin,loginAdmin,getBookedUserInfo,sendConfirmEmail,sendMessage,setActivePaymentGateway,getActivePaymentGateway,createAdmin,updateProfile,updateInvoice,getUpdatedInvoice,updateInvoiceTemplate}