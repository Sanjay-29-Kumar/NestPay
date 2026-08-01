import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
    },
});

export async function sendVerificationEmail(toEmail: string, token: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
        from: `"NestPay Support" <${process.env.SMTP_USER || "noreply@nestpay.com"}>`,
        to: toEmail,
        subject: "Verify Your Email - NestPay",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563eb; text-align: center;">Welcome to NestPay!</h2>
                <p>Thank you for signing up. Please verify your email address to activate your account and start setting up your workspace.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #666666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 13px; color: #2563eb;">${verificationLink}</p>
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                <p style="color: #999999; font-size: 12px; text-align: center;">If you did not create a NestPay account, please ignore this email.</p>
            </div>
        `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("=================================================");
        console.log("📬 [DEV MODE] VERIFICATION LINK GENERATED:");
        console.log(verificationLink);
        console.log("=================================================");
        return true;
    }

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send verification email:", error);
        return false;
    }
}

export async function sendInvitationEmail(
    toEmail: string,
    inviterName: string,
    orgName: string,
    role: string,
    token: string
): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

    const mailOptions = {
        from: `"NestPay Workspace" <${process.env.SMTP_USER || "noreply@nestpay.com"}>`,
        to: toEmail,
        subject: `Invitation to join ${orgName} on NestPay`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563eb; text-align: center;">Workspace Invitation</h2>
                <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong> on NestPay.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Accept Invitation & Join Workspace
                    </a>
                </div>
                <p style="color: #666666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 13px; color: #2563eb;">${inviteLink}</p>
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
                <p style="color: #999999; font-size: 12px; text-align: center;">This invitation link will expire in 7 days.</p>
            </div>
        `,
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("=================================================");
        console.log("📬 [DEV MODE] INVITATION LINK GENERATED:");
        console.log(`To: ${toEmail} | Org: ${orgName} | Role: ${role}`);
        console.log(inviteLink);
        console.log("=================================================");
        return true;
    }

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send invitation email:", error);
        return false;
    }
}
