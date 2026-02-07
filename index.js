// index.js - CORRECTED VERSION
import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import DBconncetion from './Config/DB.js';
import ProductRoute from './Routes/ProductRoute.js'
import UserRoute from './Routes/UserRoute.js'
import CartRoute from './Routes/cartRoutes.js'
import OrderRoute from './Routes/orderRoutes.js'
import authRoutes from './Routes/authRoutes.js'; 
import termsRoutes from './Routes/termsRoutes.js';
import adminOrderRoutes from './Routes/adminOrderRoutes.js';
import adminProductRoutes from './Routes/adminProductRoutes.js'; // FIX THIS IMPORT
import partnerProductRoutes from './Routes/partnerProductRoutes.js';

const app = express();
app.use(express.json())
app.use(cors())
DBconncetion()

app.get('/', (req,res) => res.send('This Home Page'))

// Public routes
app.use('/api/products', ProductRoute);
app.use('/api/users', UserRoute)
app.use('/api/auth', authRoutes); 
app.use('/api/cart', CartRoute)

// Protected user routes
app.use('/api/orders', OrderRoute); 

// Admin routes
app.use('/api/orders/admin', adminOrderRoutes);
app.use('/api/products/admin', adminProductRoutes); // This should work now

// Terms routes
app.use('/api/terms', termsRoutes);

// partner routes
app.use('/api/products/partner', partnerProductRoutes);

// ! 404 Route if Route not found
app.use((req,res) => res.status(404).json({ 
  success: false, 
  message: 'Route Not Found 404'
}))

app.listen(process.env.PORT || 8000 , () =>{
    console.log('Server Started....')
}) 
