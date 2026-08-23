import nodemailer from "nodemailer";

export interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const fromAddress = options.fromName
        ? `"${options.fromName}" <${options.fromEmail || user}>`
        : process.env.SMTP_FROM || `"NestPay Notifications" <${user}>`;

    if (!host || !user || !pass) {
        console.log(`📧 [Email Fallback Log] From: ${fromAddress} (Reply-To: ${options.replyTo || "default"}) | To: ${options.to} | Subject: ${options.subject}\nMessage: ${options.text}`);
        return {
            success: true,
            messageId: `mock-email-${Date.now()}`,
        };
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: {
                user,
                pass,
            },
        });

        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: options.replyTo || options.fromEmail,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">${options.text.replace(/\n/g, "<br/>")}</div>`,
        });

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (err: any) {
        console.error("❌ Error sending email via SMTP:", err?.message || err);
        return {
            success: false,
            error: err?.message || "Failed to dispatch email",
        };
    }
}
