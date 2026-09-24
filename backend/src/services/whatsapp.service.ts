import https from "https";
import dotenv from "dotenv";

/**
 * Meta WhatsApp Business Cloud API Configuration Interface
 */
export interface WhatsAppConfig {
    apiVersion: string;
    phoneNumberId: string;
    businessAccountId?: string;
    accessToken: string;
}

/**
 * Result object returned by WhatsApp sending operations
 */
export interface WhatsAppSendResult {
    success: boolean;
    messageId?: string;
    error?: {
        code: string;
        message: string;
    };
    metaResponse?: any;
}

export interface SendTextMessageOptions {
    organizationId?: string;
    phoneNumberId?: string;
    accessToken?: string;
    apiVersion?: string;
    defaultCountryCode?: string;
}

export interface SendTemplateMessageOptions {
    organizationId?: string;
    phoneNumberId?: string;
    accessToken?: string;
    apiVersion?: string;
    languageCode?: string;
    components?: any[];
    defaultCountryCode?: string;
}

/**
 * Normalizes phone numbers to E.164 digits-only format:
 * - Strips non-digit characters (+, spaces, dashes, parentheses).
 * - Strips leading zeros.
 * - If 10 digits without country code, prepends defaultCountryCode (default: '91').
 * - Validates length (must be 10-15 digits).
 */
export function normalizePhoneNumber(
    phone: string | number | undefined | null,
    defaultCountryCode: string = "91"
): { isValid: boolean; normalized: string; error?: string } {
    if (!phone) {
        return { isValid: false, normalized: "", error: "Phone number is required." };
    }

    const str = String(phone).trim();
    if (!str) {
        return { isValid: false, normalized: "", error: "Phone number cannot be empty." };
    }

    // Strip all non-digit characters
    let cleaned = str.replace(/\D/g, "");

    // Strip leading zeros
    cleaned = cleaned.replace(/^0+/, "");

    if (!cleaned) {
        return { isValid: false, normalized: "", error: "Invalid phone number: No digits found." };
    }

    const cleanDefaultCode = String(defaultCountryCode).replace(/\D/g, "") || "91";

    // Prepend default country code if exactly 10 digits
    if (cleaned.length === 10) {
        cleaned = `${cleanDefaultCode}${cleaned}`;
    }

    // Check E.164 length boundaries (10 to 15 digits total)
    if (cleaned.length < 10 || cleaned.length > 15) {
        return {
            isValid: false,
            normalized: cleaned,
            error: `Invalid phone number length (${cleaned.length} digits). Must be between 10 and 15 digits with country code.`,
        };
    }

    return { isValid: true, normalized: cleaned };
}

/**
 * Mask phone number for developer-safe logging (e.g. "919677708612" -> "91******8612")
 */
export function maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 6) return "***";
    const start = phone.slice(0, 2);
    const end = phone.slice(-4);
    return `${start}${"*".repeat(Math.max(2, phone.length - 6))}${end}`;
}

/**
 * Retrieve & validate WhatsApp environment credentials
 */
export function getWhatsAppEnvConfig(): { config?: WhatsAppConfig; error?: string } {
    dotenv.config({ override: true });

    const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!accessToken || !phoneNumberId) {
        return {
            error: "Meta WhatsApp credentials missing. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in backend/.env",
        };
    }

    return {
        config: {
            apiVersion,
            phoneNumberId,
            businessAccountId,
            accessToken,
        },
    };
}

/**
 * HTTP Client using Node's native HTTPS module for direct Meta Graph API communication
 */
function postToMetaGraph(
    urlStr: string,
    headers: Record<string, string>,
    payload: any
): Promise<{ statusCode: number; data: any }> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const postData = JSON.stringify(payload);

        const options: https.RequestOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: "POST",
            headers: {
                ...headers,
                "Content-Length": Buffer.byteLength(postData),
            },
            timeout: 15000, // 15 second network timeout
        };

        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ statusCode: res.statusCode || 500, data: parsed });
                } catch {
                    resolve({ statusCode: res.statusCode || 500, data: { raw: body } });
                }
            });
        });

        req.on("timeout", () => {
            req.destroy();
            reject(new Error("Meta WhatsApp API request timed out after 15 seconds."));
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Maps raw Meta Graph API errors to clean, developer-actionable messages
 */
function mapMetaError(statusCode: number, metaData: any): { code: string; message: string } {
    const errorObj = metaData?.error;
    const metaCode = errorObj?.code;
    const metaSubcode = errorObj?.error_subcode;
    const metaMessage = errorObj?.message || "Unknown Meta API error";

    // 1. Recipient not in allowed tester list (Test mode constraint)
    if (metaCode === 131030 || metaMessage.toLowerCase().includes("not in allowed list") || metaMessage.toLowerCase().includes("recipient phone number not in allowed list")) {
        return {
            code: "RECIPIENT_NOT_IN_ALLOWLIST",
            message: "Meta Sandbox Error (131030): Recipient number is not in the allowed tester list for this test sender. Please add this number to the 'To' list in Meta App Dashboard (WhatsApp -> API Setup -> Step 1).",
        };
    }

    // 2. 24-hour messaging window violation (Free-form text sent without recipient messaging first)
    if (metaCode === 131047 || metaMessage.toLowerCase().includes("re-engagement") || metaMessage.toLowerCase().includes("24 hour") || metaMessage.toLowerCase().includes("conversation")) {
        return {
            code: "MESSAGING_WINDOW_RESTRICTION",
            message: "Meta 24h Window Error (131047): Free-form text can only be sent within 24 hours of the recipient messaging the business number first. Please send an opening message from your recipient phone to +1 (646) 589-4168, or use an approved template message (e.g. 'hello_world').",
        };
    }

    // 3. Invalid or expired Access Token / OAuthException
    if (metaCode === 190 || errorObj?.type === "OAuthException" || metaMessage.toLowerCase().includes("access token") || metaMessage.toLowerCase().includes("session has expired")) {
        return {
            code: "INVALID_ACCESS_TOKEN",
            message: `Meta Auth Error (190): ${metaMessage}. If token expired, generate a fresh token from the Meta Developer Portal and update WHATSAPP_ACCESS_TOKEN in backend/.env.`,
        };
    }

    // 4. Invalid Phone Number ID or parameter
    if (metaCode === 100 || metaMessage.toLowerCase().includes("phone number id") || metaMessage.toLowerCase().includes("param")) {
        return {
            code: "INVALID_PARAMETER_OR_PHONE_ID",
            message: `Meta Parameter Error (100): ${metaMessage}. Verify WHATSAPP_PHONE_NUMBER_ID in backend/.env.`,
        };
    }

    // 5. Rate limit exceeded
    if (metaCode === 80007 || metaCode === 4 || statusCode === 429) {
        return {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Meta Rate Limit Error: ${metaMessage}`,
        };
    }

    return {
        code: `META_ERROR_${metaCode || statusCode}`,
        message: `Meta API Error (${statusCode}): ${metaMessage}`,
    };
}

/**
 * STEP 3 — Reusable WhatsApp Service
 * Sends outbound free-form text message via Meta WhatsApp Business Cloud API.
 */
export async function sendTextMessage(
    recipientPhoneNumber: string,
    message: string,
    options: SendTextMessageOptions = {}
): Promise<WhatsAppSendResult> {
    // 1. Validate & Normalize Phone Number
    const phoneResult = normalizePhoneNumber(recipientPhoneNumber, options.defaultCountryCode || "91");
    if (!phoneResult.isValid) {
        return {
            success: false,
            error: {
                code: "INVALID_PHONE_NUMBER",
                message: phoneResult.error || "Invalid recipient phone number format.",
            },
        };
    }

    // 2. Validate Message Content & Length limit (~4096 characters per WhatsApp spec)
    if (!message || typeof message !== "string" || !message.trim()) {
        return {
            success: false,
            error: {
                code: "EMPTY_MESSAGE",
                message: "Message content cannot be empty.",
            },
        };
    }

    if (message.length > 4096) {
        return {
            success: false,
            error: {
                code: "MESSAGE_TOO_LONG",
                message: `Message exceeds WhatsApp limit of 4096 characters (length: ${message.length}).`,
            },
        };
    }

    // 3. Resolve Meta configuration
    const envResult = getWhatsAppEnvConfig();
    const accessToken = options.accessToken || envResult.config?.accessToken;
    const phoneNumberId = options.phoneNumberId || envResult.config?.phoneNumberId;
    const apiVersion = options.apiVersion || envResult.config?.apiVersion || "v22.0";

    if (!accessToken || !phoneNumberId) {
        return {
            success: false,
            error: {
                code: "CONFIG_MISSING",
                message: envResult.error || "WhatsApp API access token or Phone Number ID is missing.",
            },
        };
    }

    const maskedTo = maskPhoneNumber(phoneResult.normalized);
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phoneResult.normalized,
        type: "text",
        text: {
            preview_url: false,
            body: message,
        },
    };

    const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    };

    try {
        console.log(`💬 [WhatsApp Service] Outbound text dispatch -> ${maskedTo} (length: ${message.length} chars)`);

        const response = await postToMetaGraph(url, headers, payload);
        const data = response.data;

        if (response.statusCode < 200 || response.statusCode >= 300) {
            const mappedErr = mapMetaError(response.statusCode, data);
            console.error(`❌ [WhatsApp Service] Meta Error for ${maskedTo}: [${mappedErr.code}] ${mappedErr.message}`);
            return {
                success: false,
                error: mappedErr,
                metaResponse: data,
            };
        }

        const messageId = data?.messages?.[0]?.id;
        console.log(`✅ [WhatsApp Service] Dispatched successfully to ${maskedTo} | Meta MsgID: ${messageId}`);

        return {
            success: true,
            messageId,
            metaResponse: data,
        };
    } catch (err: any) {
        console.error(`❌ [WhatsApp Service] Network exception dispatching to ${maskedTo}:`, err?.message || err);
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: err?.message || "Failed to reach Meta WhatsApp API endpoint.",
            },
        };
    }
}

/**
 * Sends outbound template message via Meta WhatsApp Business Cloud API.
 * Useful for business-initiated test notifications in development mode (e.g. 'hello_world').
 */
export async function sendTemplateMessage(
    recipientPhoneNumber: string,
    templateName: string,
    options: SendTemplateMessageOptions = {}
): Promise<WhatsAppSendResult> {
    const phoneResult = normalizePhoneNumber(recipientPhoneNumber, options.defaultCountryCode || "91");
    if (!phoneResult.isValid) {
        return {
            success: false,
            error: {
                code: "INVALID_PHONE_NUMBER",
                message: phoneResult.error || "Invalid recipient phone number format.",
            },
        };
    }

    if (!templateName || !templateName.trim()) {
        return {
            success: false,
            error: {
                code: "EMPTY_TEMPLATE_NAME",
                message: "Template name is required.",
            },
        };
    }

    const envResult = getWhatsAppEnvConfig();
    const accessToken = options.accessToken || envResult.config?.accessToken;
    const phoneNumberId = options.phoneNumberId || envResult.config?.phoneNumberId;
    const apiVersion = options.apiVersion || envResult.config?.apiVersion || "v22.0";

    if (!accessToken || !phoneNumberId) {
        return {
            success: false,
            error: {
                code: "CONFIG_MISSING",
                message: envResult.error || "WhatsApp API access token or Phone Number ID is missing.",
            },
        };
    }

    const maskedTo = maskPhoneNumber(phoneResult.normalized);
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        to: phoneResult.normalized,
        type: "template",
        template: {
            name: templateName,
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
        console.log(`💬 [WhatsApp Service] Outbound template dispatch ('${templateName}') -> ${maskedTo}`);

        const response = await postToMetaGraph(url, headers, payload);
        const data = response.data;

        if (response.statusCode < 200 || response.statusCode >= 300) {
            const mappedErr = mapMetaError(response.statusCode, data);
            console.error(`❌ [WhatsApp Service] Meta Template Error for ${maskedTo}: [${mappedErr.code}] ${mappedErr.message}`);
            console.error("📋 [WhatsApp Service] Meta Raw Error Details:", JSON.stringify(data));
            return {
                success: false,
                error: mappedErr,
                metaResponse: data,
            };
        }

        const messageId = data?.messages?.[0]?.id;
        console.log(`✅ [WhatsApp Service] Template dispatched successfully to ${maskedTo} | Meta MsgID: ${messageId}`);

        return {
            success: true,
            messageId,
            metaResponse: data,
        };
    } catch (err: any) {
        console.error(`❌ [WhatsApp Service] Network exception dispatching template to ${maskedTo}:`, err?.message || err);
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: err?.message || "Failed to reach Meta WhatsApp API endpoint.",
            },
        };
    }
}
