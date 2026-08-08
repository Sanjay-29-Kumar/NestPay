export type DocumentTypeEnum =
    | "RENTAL_AGREEMENT"
    | "PAN"
    | "AADHAAR"
    | "PASSPORT"
    | "DRIVING_LICENSE"
    | "INSURANCE"
    | "PROPERTY_DOCUMENT"
    | "OTHER";

export interface CreateDocumentInput {
    title: string;
    documentType: DocumentTypeEnum;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    relatedPropertyId?: string;
    relatedUnitId?: string;
    relatedCustomerId?: string;
}
