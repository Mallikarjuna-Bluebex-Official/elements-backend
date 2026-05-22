import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs'
import userRouter from './routes/userRoute.js'
import adminRouter from './routes/adminRoute.js'
import promoRouter from './routes/promoRoute.js'
import mediaRoutes from './Mediaroute.js'

const app = express();

app.use(cors());
app.use(express.json());

// Middleware for URL-encoded form data (text fields in form-data)
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'"
  );
  next();
});


// Connect to MongoDB
connectDB();
connectCloudinary();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/user',userRouter)
app.use('/api/admin',adminRouter)
app.use('/api/promo',promoRouter)

// SERVE STATIC FILES
app.use("/uploads",express.static("/var/www/assets"));
app.use("/api/media", mediaRoutes);

app.get('/', (req, res) => {
    res.send('Event booking backend is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));