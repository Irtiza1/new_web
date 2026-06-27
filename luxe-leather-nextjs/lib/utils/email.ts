import nodemailer from 'nodemailer';

export async function sendOrderNotificationEmail(orderDetails: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: number;
    paymentSlipUrl: string;
}) {
    try {
        const { SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = process.env;

        if (!SMTP_USER || !SMTP_PASS) {
            console.warn("SMTP credentials not found in environment variables. Email will not be sent.");
            return false;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Default to Gmail as per user request
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        const mailOptions = {
            from: SMTP_FROM_EMAIL || SMTP_USER,
            to: SMTP_USER, // Sending to the admin (themselves)
            subject: `New Order Received - Action Required (#${orderDetails.orderId.substring(0, 8)})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #cf1736;">New Order Pending Verification</h2>
                    <p>A new order has been placed via manual bank transfer and is awaiting payment verification.</p>
                    
                    <div style="background-color: #f6f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Order Details:</h3>
                        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
                        <p><strong>Customer:</strong> ${orderDetails.customerName} (${orderDetails.customerEmail})</p>
                        <p><strong>Total:</strong> $${orderDetails.total.toFixed(2)}</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${orderDetails.paymentSlipUrl}" target="_blank" style="background-color: #1b0e10; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                            View Payment Slip
                        </a>
                    </div>

                    <p>Please log in to the admin panel to verify the payment and update the order status to Processing.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Order notification email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send order notification email:", error);
        return false;
    }
}
