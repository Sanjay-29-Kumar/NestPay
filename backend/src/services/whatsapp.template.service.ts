import { sendWhatsAppTemplateMessage, WhatsAppProviderResult } from "./whatsapp.provider.js";

export interface RentReminderVariables {
    tenantName: string;
    rentAmount: string | number;
    organizationName: string;
    unitNumber: string;
    dueDate: string;
}

export interface SendRentReminderOptions {
    to: string;
    variables: RentReminderVariables;
    templateName?: string;
    languageCode?: string;
    accessToken?: string;
    phoneNumberId?: string;
}

/**
 * Rent Reminder Template Dispatcher
 * Formats positional text parameters for Meta Cloud API template messaging.
 */
export async function sendRentReminderWhatsApp(
    options: SendRentReminderOptions
): Promise<WhatsAppProviderResult> {
    const { tenantName, rentAmount, organizationName, unitNumber, dueDate } = options.variables;

    // Build Meta Cloud API body parameters array
    const bodyParameters = [
        { type: "text", text: String(tenantName) },
        { type: "text", text: typeof rentAmount === "number" ? `$${rentAmount.toFixed(2)}` : String(rentAmount) },
        { type: "text", text: String(organizationName) },
        { type: "text", text: String(unitNumber) },
        { type: "text", text: String(dueDate) },
    ];

    const components = [
        {
            type: "body",
            parameters: bodyParameters,
        },
    ];

    // Default template or fallback to 'hello_world' for Meta developer sandbox testing
    const templateName = options.templateName || "hello_world";

    return sendWhatsAppTemplateMessage({
        to: options.to,
        templateName,
        languageCode: options.languageCode || "en_US",
        components: templateName === "hello_world" ? [] : components,
        accessToken: options.accessToken,
        phoneNumberId: options.phoneNumberId,
    });
}
