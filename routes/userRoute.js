import express from 'express'
import { bookingEvent,getEvents,getEventSlots,getAddOn,activeGatewayInUser,updatePaymentStatus,countVisits,updateVisits} from '../controllers/userController.js'
import {initiatePhonePePayment,phonepeStatus,initiateRazorpayPayment, verifyRazorpay, initiatePaypalPayment, executePaypalPayment,initiatePayuPayment,verifyStatus} from '../controllers/paymentController.js'

const userRouter = express.Router()

userRouter.post('/visit',countVisits)
userRouter.put('update-count',updateVisits)

userRouter.post('/booking',bookingEvent)
userRouter.get('/get-event',getEvents)
//userRouter.get('/event-slots/:eventId/:date', getEventSlots)
userRouter.get('/getAddOn',getAddOn)

//payment
userRouter.post('/pay',initiatePayuPayment)
userRouter.post('/verify/:txnid',verifyStatus)


//phonepe
userRouter.post('/initiate-payment',initiatePhonePePayment)
userRouter.post('/payment-status/:id',phonepeStatus)

//razorpay
userRouter.post("/create-order",initiateRazorpayPayment)
userRouter.post("/verify-payment",verifyRazorpay)

//paypal
userRouter.post('/create-payment',initiatePaypalPayment)
userRouter.get('/execute-payment', executePaypalPayment);

userRouter.get('/active-gateway',activeGatewayInUser)

userRouter.put('/bookings/:bookingId/payment-status',updatePaymentStatus)

export default userRouter