import https from "https";
import dotenv from "dotenv";

/**
 * WhatsApp Provider Abstraction for Meta WhatsApp Cloud API
 * Handles direct HTTP requests to Meta API endpoints securely without leaking access tokens.
 */

export interface SendWhatsAppTextOptions {
    to: string;
    message: string;
    accessToken?: string;
    phoneNumberId?: string;
    apiVersion?: string;
}

export interface SendWhatsAppTemplateOptions {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: any[];
    accessToken?: string;
    phoneNumberId?: string;
    apiVersion?: string;
}

export interface WhatsAppProviderResult {
    success: boolean;
    messageId?: string;
    error?: string;
    metaResponse?: any;
}

/**
 * Format phone number to clean digits string (e.g. "+91 96777-08612" -> "919677708612")
 */
export function formatPhoneNumber(phone: any): string {
    const str = String(phone || "");
    const cleaned = str.replace(/\D/g, "");
    return cleaned;
}

/**
 * Helper function using Node's native https module for maximum reliability
 */
function makeHttpsPost(
    urlStr: string,
    headers: Record<string, string>,
    body: any
): Promise<{ statusCode: number; data: any }> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const postData = JSON.stringify(body);

        const options: https.RequestOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: "POST",
            headers: {
                ...headers,
                "Content-Length": Buffer.byteLength(postData),
            },
        };

        const req = https.request(options, (res) => {
            let responseBody = "";
            res.on("data", (chunk) => {
                responseBody += chunk;
            });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    resolve({ statusCode: res.statusCode || 500, data: parsed });
                } catch {
                    resolve({ statusCode: res.statusCode || 500, data: { raw: responseBody } });
                }
            });
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Send plain text message via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppTextMessage(
    options: SendWhatsAppTextOptions
): Promise<WhatsAppProviderResult> {
    dotenv.config({ override: true });

    const accessToken = options.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = options.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = options.apiVersion || process.env.WHATSAPP_API_VERSION || "v22.0";


    if (!accessToken || !phoneNumberId) {
        return {
            success: false,
            error: "WhatsApp API access token or Phone Number ID is missing in configuration.",
        };
    }

    const recipientPhone = formatPhoneNumber(options.to);
    if (!recipientPhone) {
        return {
            success: false,
            error: "Invalid recipient phone number.",
        };
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientPhone,
        type: "text",
        text: {
            preview_url: false,
            body: options.message,
        },
    };

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await makeHttpsPost(url, headers, payload);
        const data = response.data;

        if (response.statusCode < 200 || response.statusCode >= 300) {
            const errorMsg = data?.error?.message || `Meta API Error ${response.statusCode}`;
            return {
                success: false,
                error: errorMsg,
                metaResponse: data,
            };
        }

        const messageId = data?.messages?.[0]?.id;

        return {
            success: true,
            messageId,
            metaResponse: data,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || err.cause?.message || "Failed to reach Meta WhatsApp API server.",
        };
    }
}

/**
 * Send template message via Meta WhatsApp Cloud API (used for business-initiated notifications)
 */
export async function sendWhatsAppTemplateMessage(
    options: SendWhatsAppTemplateOptions
): Promise<WhatsAppProviderResult> {
    const accessToken = options.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = options.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = options.apiVersion || process.env.WHATSAPP_API_VERSION || "v22.0";

    if (!accessToken || !phoneNumberId) {
        return {
            success: false,
            error: "WhatsApp API access token or Phone Number ID is missing in configuration.",
        };
    }

    const recipientPhone = formatPhoneNumber(options.to);
    if (!recipientPhone) {
        return {
            success: false,
            error: "Invalid recipient phone number.",
        };
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
            name: options.templateName,
            language: {
                code: options.languageCode || "en_US",
            },
            components: options.components || [],
        },
    };

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await makeHttpsPost(url, headers, payload);
        const data = response.data;

        if (response.statusCode < 200 || response.statusCode >= 300) {
            const errorMsg = data?.error?.message || `Meta API Error ${response.statusCode}`;
            return {
                success: false,
                error: errorMsg,
                metaResponse: data,
            };
        }

        const messageId = data?.messages?.[0]?.id;

        return {
            success: true,
            messageId,
            metaResponse: data,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || err.cause?.message || "Failed to reach Meta WhatsApp API server.",
        };
    }
}
