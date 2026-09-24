/**
 * WhatsApp Manual Send & Direct Link Generator Utility for NESTPAY
 * 
 * Generates robust wa.me click-to-chat links with normalized recipient numbers
 * and proper URL encoding of composed messages (handling newlines, ₹ symbol, and punctuation).
 */

export interface NormalizedPhoneResult {
    isValid: boolean;
    normalized: string;
    error?: string;
}

export interface WhatsAppLinkResult {
    success: boolean;
    url?: string;
    normalizedPhone?: string;
    error?: string;
}

/**
 * 1. Correct phone number formatting before building the link:
 * - Strips all non-digit characters (+, spaces, dashes, parentheses).
 * - Removes leading zeros (e.g. "0919677708612" -> "919677708612", "09677708612" -> "9677708612").
 * - If 10 digits without country code, prepends default country code (e.g. 91 for India).
 * - Validates length (must be between 10 and 15 digits according to E.164).
 */
export function normalizePhoneNumber(
    rawPhone: string | number | undefined | null,
    defaultCountryCode: string = "91"
): NormalizedPhoneResult {
    if (rawPhone === undefined || rawPhone === null) {
        return {
            isValid: false,
            normalized: "",
            error: "Phone number is required.",
        };
    }

    const str = String(rawPhone).trim();
    if (!str) {
        return {
            isValid: false,
            normalized: "",
            error: "Phone number cannot be empty.",
        };
    }

    // Strip all non-digit characters (+, spaces, dashes, brackets, etc.)
    let cleaned = str.replace(/\D/g, "");

    // Remove leading zeros (e.g. "0919677708612" -> "919677708612", "09677708612" -> "9677708612")
    cleaned = cleaned.replace(/^0+/, "");

    if (!cleaned) {
        return {
            isValid: false,
            normalized: "",
            error: "Invalid phone number: No digits found.",
        };
    }

    const cleanDefaultCode = String(defaultCountryCode).replace(/\D/g, "") || "91";

    // If standard 10-digit number (common in India and several countries), default-prepend country code
    if (cleaned.length === 10) {
        cleaned = `${cleanDefaultCode}${cleaned}`;
    }

    // Validate overall length according to international E.164 standard (10 to 15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
        return {
            isValid: false,
            normalized: cleaned,
            error: "Invalid phone number for this tenant — please update their contact details.",
        };
    }

    return {
        isValid: true,
        normalized: cleaned,
    };
}

/**
 * 2 & 3. Construct the final https://wa.me/ link with URL-encoded message
 * Handles newlines (\n), Rupee symbol (₹), special characters, and punctuation.
 */
export function buildWhatsAppLink(
    phone: string | number | undefined | null,
    message: string,
    defaultCountryCode: string = "91"
): WhatsAppLinkResult {
    const phoneResult = normalizePhoneNumber(phone, defaultCountryCode);

    if (!phoneResult.isValid) {
        return {
            success: false,
            error: phoneResult.error || "Invalid phone number for this tenant — please update their contact details.",
        };
    }

    // Properly URL-encode the message
    const encodedMessage = encodeURIComponent(message || "");
    const url = `https://wa.me/${phoneResult.normalized}?text=${encodedMessage}`;

    return {
        success: true,
        url,
        normalizedPhone: phoneResult.normalized,
    };
}

/**
 * 4. Open WhatsApp in a new browser tab/window
 * Directs to WhatsApp Web on desktop or WhatsApp mobile app on smartphones.
 */
export function openWhatsAppDirect(
    phone: string | number | undefined | null,
    message: string,
    defaultCountryCode: string = "91"
): { success: boolean; error?: string } {
    const linkResult = buildWhatsAppLink(phone, message, defaultCountryCode);

    if (!linkResult.success || !linkResult.url) {
        return {
            success: false,
            error: linkResult.error,
        };
    }

    // Open in a new tab/window without losing current session
    window.open(linkResult.url, "_blank", "noopener,noreferrer");

    return {
        success: true,
    };
}
