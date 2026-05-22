import express from 'express'
import { loginAdmin, registerAdmin, viewBookingData, createAdmin, getProfile, updateProfile, generateInvoice, updateInvoice, getUpdatedInvoice, updateInvoiceTemplate, setActivePaymentGateway, getActivePaymentGateway, sendConfirmEmail, sendMessage,getBookedUserInfo,getVisitCount } from '../controllers/adminController.js'
import {addEvents,viewEvents,viewOneEvent,updateEvent,deleteEvent} from '../controllers/eventController.js'
import {createAddOn,viewAddOn,updateAddOn,deleteAddOn} from '../controllers/addOnController.js'
import authUser from '../middleware/authUser.js'
import upload from '../middleware/multer.js'; // <-- your multer setup

const adminRouter = express.Router()

adminRouter.post('/generate-invoice', generateInvoice);

adminRouter.get('/count',getVisitCount)

adminRouter.post('/register',registerAdmin)
adminRouter.post('/login',loginAdmin)
adminRouter.get('/view',viewBookingData)

adminRouter.post('/add-event',addEvents)
adminRouter.get('/get-event',viewEvents)
adminRouter.get('/get-service/:serviceId',viewOneEvent)
adminRouter.put('/update-event/:id',updateEvent)
adminRouter.delete('/delete-event/:id',deleteEvent)

adminRouter.post('/createAddOn',createAddOn)
adminRouter.get('/getAddOn',viewAddOn)
adminRouter.put('/updateAddOn/:id',updateAddOn)
adminRouter.delete('/delete/:id',deleteAddOn)

adminRouter.post('/create-admin',createAdmin)
adminRouter.get('/get-profile',authUser,getProfile)
adminRouter.put('/update-admin/:email',updateProfile)

adminRouter.put('/update-invoice',upload.single("logo"),updateInvoice)
adminRouter.put('/update-template',updateInvoiceTemplate)
adminRouter.get('/get-invoiceinfo',getUpdatedInvoice)

adminRouter.post('/set-paymentgateway',setActivePaymentGateway)
adminRouter.get("/get-paymentgateway",getActivePaymentGateway)

adminRouter.post('/booking/send-confirmation-email',sendConfirmEmail)

adminRouter.post('/message',sendMessage)

adminRouter.get('/get-userinfo/:id',getBookedUserInfo)


export default adminRouter