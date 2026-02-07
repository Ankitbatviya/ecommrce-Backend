import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your email password or app password
  }
});

// Send reset password email
export const sendResetPasswordEmail = async (email, name, resetUrl) => {
  try {
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #121212; color: white; padding: 30px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; }
          .reset-button { display: inline-block; padding: 12px 30px; background: #121212; color: white; 
                          text-decoration: none; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          .warning { background: #fff8e1; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Dear ${name},</p>
            
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            
            <center>
              <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
            </center>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>Important:</strong> This password reset link will expire in 15 minutes.
              If you didn't request a password reset, please ignore this email.
            </div>
            
            <p style="margin-top: 30px; color: #666;">
              If you're having trouble clicking the button, copy and paste the URL above into your web browser.
            </p>
          </div>

          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Your Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reset password email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Reset password email sending error:', error);
    throw error;
  }
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const itemsHTML = order.items.map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong><br>
          ${item.size ? `Size: ${item.size}` : ''} 
          ${item.color ? `Color: ${item.color}` : ''}<br>
          Quantity: ${item.quantity}
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
          ₹${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #121212; color: white; padding: 30px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; }
          .order-number { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #c5a059; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total-row { background: #f9f9f9; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #121212; color: white; text-decoration: none; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🎉</h1>
          </div>
          
          <div class="content">
            <p>Dear ${order.shippingAddress.fullName},</p>
            
            <p>Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
            
            <div class="order-number">
              <strong>Order Number:</strong> ${order.orderNumber}<br>
              <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>

            <h2 style="border-bottom: 2px solid #121212; padding-bottom: 10px;">Order Details</h2>
            
            <table>
              <thead>
                <tr style="background: #f9f9f9;">
                  <th style="padding: 15px; text-align: left;">Item</th>
                  <th style="padding: 15px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                <tr>
                  <td style="padding: 15px; text-align: right;"><strong>Subtotal:</strong></td>
                  <td style="padding: 15px; text-align: right;">₹${order.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; text-align: right;"><strong>Tax (GST 18%):</strong></td>
                  <td style="padding: 15px; text-align: right;">₹${order.tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 15px; text-align: right;"><strong>Shipping:</strong></td>
                  <td style="padding: 15px; text-align: right;">FREE</td>
                </tr>
                <tr class="total-row">
                  <td style="padding: 15px; text-align: right; font-size: 18px;">Total:</td>
                  <td style="padding: 15px; text-align: right; font-size: 18px;">₹${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <h2 style="border-bottom: 2px solid #121212; padding-bottom: 10px;">Shipping Address</h2>
            <p>
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.addressLine1}<br>
              ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}<br>
              ${order.shippingAddress.country}<br>
              Phone: ${order.shippingAddress.phone}
            </p>

            <h2 style="border-bottom: 2px solid #121212; padding-bottom: 10px;">Payment Method</h2>
            <p><strong>${order.paymentMethod}</strong></p>

            <center>
              <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="button">Track Your Order</a>
            </center>

            <p style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eee; color: #666;">
              If you have any questions, please contact us at support@yourstore.com or call +91-XXXXXXXXXX
            </p>
          </div>

          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Your Store" <${process.env.EMAIL_USER}>`,
      to: order.shippingAddress.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: emailHTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Order confirmation email sending error:', error);
    throw error;
  }
};

// utils/emailService.js - Add this function
export const sendOrderUpdateEmail = async (order, oldStatus, newStatus) => {
  try {
    if (!order.user || !order.user.Email) {
      console.log('No email address found for order update notification');
      return;
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Updated</h2>
        <p>Hello ${order.shippingAddress.fullName},</p>
        
        <p>Your order <strong>#${order.orderNumber}</strong> status has been updated:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>New Status:</strong> <span style="color: #28a745; font-weight: bold;">${newStatus}</span></p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        </div>
        
        <h3>Order Details:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #007bff; color: white;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: left;">Quantity</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
          <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          <p><strong>Shipping Address:</strong><br>
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.addressLine1}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}
          </p>
        </div>
        
        <p>If you have any questions about your order, please contact our customer support.</p>
        
        <p>Best regards,<br>Your Store Team</p>
      </div>
    `;

    // Send email using your email service
    // This depends on your email setup (Nodemailer, SendGrid, etc.)
    console.log('Order update email would be sent to:', order.user.Email);
    
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: '"Your Store" <noreply@yourstore.com>',
    //   to: order.user.Email,
    //   subject: `Order #${order.orderNumber} Status Updated to ${newStatus}`,
    //   html: emailContent
    // });

  } catch (error) {
    console.error('Error sending order update email:', error);
    throw error;
  }
};