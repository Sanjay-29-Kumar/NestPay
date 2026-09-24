import {
    sendTextMessage,
    sendTemplateMessage,
    normalizePhoneNumber,
    WhatsAppSendResult,
    SendTextMessageOptions,
    SendTemplateMessageOptions,
} from "./whatsapp.service.js";

export interface SendWhatsAppTextOptions {
    to: string;
    message: string;
    accessToken?: string;
    phoneNumberId?: string;
    apiVersion?: string;
    organizationId?: string;
}

export interface SendWhatsAppTemplateOptions {
    to: string;
    templateName: string;
    languageCode?: string;
    components?: any[];
    accessToken?: string;
    phoneNumberId?: string;
    apiVersion?: string;
    organizationId?: string;
}

export interface WhatsAppProviderResult {
    success: boolean;
    messageId?: string;
    error?: string;
    metaResponse?: any;
}

/**
 * Format / normalize phone number for WhatsApp
 */
export function formatPhoneNumber(phone: any): string {
    const res = normalizePhoneNumber(phone);
    return res.normalized;
}

/**
 * Backward-compatible wrapper for sendWhatsAppTextMessage
 */
export async function sendWhatsAppTextMessage(
    options: SendWhatsAppTextOptions
): Promise<WhatsAppProviderResult> {
    const result: WhatsAppSendResult = await sendTextMessage(options.to, options.message, {
        accessToken: options.accessToken,
        phoneNumberId: options.phoneNumberId,
        apiVersion: options.apiVersion,
        organizationId: options.organizationId,
    });

    return {
        success: result.success,
        messageId: result.messageId,
        error: result.error?.message,
        metaResponse: result.metaResponse,
    };
}

/**
 * Backward-compatible wrapper for sendWhatsAppTemplateMessage
 */
export async function sendWhatsAppTemplateMessage(
    options: SendWhatsAppTemplateOptions
): Promise<WhatsAppProviderResult> {
    const result: WhatsAppSendResult = await sendTemplateMessage(options.to, options.templateName, {
        languageCode: options.languageCode,
        components: options.components,
        accessToken: options.accessToken,
        phoneNumberId: options.phoneNumberId,
        apiVersion: options.apiVersion,
        organizationId: options.organizationId,
    });

    return {
        success: result.success,
        messageId: result.messageId,
        error: result.error?.message,
        metaResponse: result.metaResponse,
    };
}

export { sendTextMessage, sendTemplateMessage, normalizePhoneNumber };
