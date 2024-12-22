import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // Replace with your Gmail address
        pass: process.env.PASSWORD,  // Replace with your Gmail password
    },
});

export async function sendVerificationEmail(email: string, token: string): Promise<{ code: number, message: string }> {
    const mailOptions = {
        from: process.env.EMAIL, // Replace with your Gmail address
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Please verify your email by clicking on the following link: <a href="${process.env.FRONT_END_ADDR}/user/verify/${token}">Verify Email</a></p>`,
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent:', result);

        if (result.accepted.length > 0) {
            return { code: 1, message: "Accepted" }; // Email sent successfully
        } else if (result.rejected.length > 0) {
            return { code: 3, message: "Rejected" }; // Email rejected
        } else if (result.pending.length > 0) {
            return { code: 2, message: "Blocked" }; // Email blocked or pending
        } else {
            return { code: 4, message: "Unknown" }; // General failure
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return { code: 4, message: "Others" }; // General failure
    }
}

export async function sendMail(email: string, message: string, subject: string = "Verify your Email"): Promise<{ code: number, message: string }> {
    const mailOptions = {
        from: process.env.EMAIL, // Replace with your Gmail address
        to: email,
        subject: subject,
        html: `<p>${message}</p>`,
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent:', result);

        if (result.accepted.length > 0) {
            return { code: 1, message: "Accepted" }; // Email sent successfully
        } else if (result.rejected.length > 0) {
            return { code: 3, message: "Rejected" }; // Email rejected
        } else if (result.pending.length > 0) {
            return { code: 2, message: "Blocked" }; // Email blocked or pending
        } else {
            return { code: 4, message: "Unknown" }; // General failure
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return { code: 4, message: "Others" }; // General failure
    }
}
