import nodemailer from 'nodemailer';

function getTransporter() {
    const { SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_USER || !SMTP_PASS) return null;

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}

const BRAND_NAME = "Luxe Leather Gear";
const BRAND_COLOR = "#cf1736";

export async function sendAdminOrderNotificationEmail(orderDetails: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: number;
    paymentSlipUrl?: string;
}) {
    try {
        const { SMTP_USER, SMTP_FROM_EMAIL } = process.env;
        const transporter = getTransporter();
        if (!transporter || !SMTP_USER) return false;

        const mailOptions = {
            from: SMTP_FROM_EMAIL || SMTP_USER,
            to: SMTP_USER,
            subject: `New Order Received - Action Required (#${orderDetails.orderId.substring(0, 8)})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${BRAND_COLOR};">New Order Pending Verification</h2>
                    <p>A new order has been placed and is awaiting verification.</p>
                    
                    <div style="background-color: #f6f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Order Details:</h3>
                        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
                        <p><strong>Customer:</strong> ${orderDetails.customerName} (${orderDetails.customerEmail})</p>
                        <p><strong>Total:</strong> $${orderDetails.total.toFixed(2)}</p>
                    </div>

                    ${orderDetails.paymentSlipUrl ? `
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${orderDetails.paymentSlipUrl}" target="_blank" style="background-color: #1b0e10; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                            View Payment Slip
                        </a>
                    </div>` : ''}

                    <p>Please log in to the admin panel to verify the payment and update the order status.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Admin Order notification sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send admin order notification:", error);
        return false;
    }
}

export async function sendCustomerOrderConfirmation(orderDetails: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: number;
}) {
    try {
        const { SMTP_USER, SMTP_FROM_EMAIL } = process.env;
        const transporter = getTransporter();
        if (!transporter) return false;

        const mailOptions = {
            from: SMTP_FROM_EMAIL || SMTP_USER,
            to: orderDetails.customerEmail,
            subject: `Your ${BRAND_NAME} Order Confirmation (#${orderDetails.orderId.substring(0, 8)})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1b0e10;">
                    <h2 style="color: ${BRAND_COLOR};">Thank you for your order, ${orderDetails.customerName}!</h2>
                    <p>We've received your order and are currently processing it. Once the payment is verified, we will begin preparing your premium leather gear.</p>
                    
                    <div style="background-color: #f6f7f8; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h3 style="margin-top: 0; color: #1b0e10;">Order Summary</h3>
                        <p><strong>Order Number:</strong> #${orderDetails.orderId.substring(0, 8)}</p>
                        <p><strong>Total Amount:</strong> $${orderDetails.total.toFixed(2)}</p>
                    </div>

                    <p>You can check the status of your order anytime by logging into your account.</p>
                    <p style="margin-top: 40px; font-size: 12px; color: #666;">
                        If you have any questions, reply to this email or contact our support team.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send customer order confirmation:", error);
        return false;
    }
}

export async function sendAdminCustomRequestNotification(request: {
    id: string;
    name: string;
    email: string;
    itemType: string;
    budget?: string;
    description: string;
}) {
    try {
        const { SMTP_USER, SMTP_FROM_EMAIL } = process.env;
        const transporter = getTransporter();
        if (!transporter || !SMTP_USER) return false;

        const mailOptions = {
            from: SMTP_FROM_EMAIL || SMTP_USER,
            to: SMTP_USER,
            subject: `New Bespoke Request: ${request.itemType}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${BRAND_COLOR};">New Bespoke/Custom Request</h2>
                    <p>A new custom request has been submitted by <strong>${request.name}</strong>.</p>
                    
                    <div style="background-color: #f6f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Item Type:</strong> ${request.itemType}</p>
                        <p><strong>Email:</strong> ${request.email}</p>
                        ${request.budget ? `<p><strong>Estimated Budget:</strong> ${request.budget}</p>` : ''}
                        <p><strong>Description:</strong><br/>${request.description.replace(/\n/g, '<br/>')}</p>
                    </div>

                    <p>Log in to the admin panel to review the request and reply to the customer.</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send admin bespoke notification:", error);
        return false;
    }
}

export async function sendCustomerCustomRequestConfirmation(request: {
    name: string;
    email: string;
    itemType: string;
}) {
    try {
        const { SMTP_USER, SMTP_FROM_EMAIL } = process.env;
        const transporter = getTransporter();
        if (!transporter) return false;

        const mailOptions = {
            from: SMTP_FROM_EMAIL || SMTP_USER,
            to: request.email,
            subject: `We've received your bespoke request - ${BRAND_NAME}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1b0e10;">
                    <h2 style="color: ${BRAND_COLOR};">Hello ${request.name},</h2>
                    <p>Thank you for trusting ${BRAND_NAME} with your custom project.</p>
                    <p>We have successfully received your bespoke request for a <strong>${request.itemType}</strong>. Our master artisans and design team are currently reviewing your requirements.</p>
                    <p>We typically respond within 24-48 hours to discuss the design, timeline, and final quotation.</p>
                    <br/>
                    <p>Best regards,<br/><strong>The ${BRAND_NAME} Team</strong></p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send customer bespoke confirmation:", error);
        return false;
    }
}

export async function sendAdminContactNotification(contact: {
    name: string;
    email: string;
    inquiry_type: string;
    message: string;
}) {
    try {
        const { SMTP_USER, SMTP_FROM_EMAIL } = process.env;
        const transporter = getTransporter();
        if (!transporter || !SMTP_USER) return false;

        const mailOptions = {
            from: SMTP_FROM_EMAIL || SMTP_USER,
            to: SMTP_USER,
            subject: `New Contact Form Submission: ${contact.inquiry_type}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${BRAND_COLOR};">New Contact Form Submission</h2>
                    
                    <div style="background-color: #f6f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Name:</strong> ${contact.name}</p>
                        <p><strong>Email:</strong> ${contact.email}</p>
                        <p><strong>Inquiry Type:</strong> ${contact.inquiry_type}</p>
                        <p><strong>Message:</strong><br/>${contact.message.replace(/\n/g, '<br/>')}</p>
                    </div>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send admin contact notification:", error);
        return false;
    }
}

export async function sendCustomerContactConfirmation(contact: {
    name: string;
    email: string;
}) {
    try {
        const { SMTP_USER, SMTP_FROM_EMAIL } = process.env;
        const transporter = getTransporter();
        if (!transporter) return false;

        const mailOptions = {
            from: SMTP_FROM_EMAIL || SMTP_USER,
            to: contact.email,
            subject: `We've received your message - ${BRAND_NAME}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1b0e10;">
                    <h2 style="color: ${BRAND_COLOR};">Hi ${contact.name},</h2>
                    <p>Thank you for reaching out to ${BRAND_NAME}. We have received your message and our support team will get back to you as soon as possible (usually within 24 hours).</p>
                    <p>If your inquiry is urgent, please note that our working hours are Monday to Friday, 9 AM - 5 PM (EST).</p>
                    <br/>
                    <p>Best regards,<br/><strong>The ${BRAND_NAME} Team</strong></p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send customer contact confirmation:", error);
        return false;
    }
}
