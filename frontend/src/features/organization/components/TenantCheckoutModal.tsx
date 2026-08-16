import React, { useState } from "react";

interface BankDetails {
    upiId?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
}

interface TenantCheckoutModalProps {
    unitNumber: string;
    amount: number;
    billingMonth: string;
    bankDetails?: BankDetails;
    onClose: () => void;
}

export const TenantCheckoutModal: React.FC<TenantCheckoutModalProps> = ({
    unitNumber,
    amount,
    billingMonth,
    bankDetails,
    onClose,
}) => {
    const upiId = bankDetails?.upiId || "nestpayowner@upi";
    const accountHolderName = bankDetails?.accountHolderName || "Property Owner / NestPay";
    const accountNumber = bankDetails?.accountNumber || "9182736450192";
    const ifscCode = bankDetails?.ifscCode || "HDFC0001234";
    const bankName = bankDetails?.bankName || "HDFC Bank, Main Branch";

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [utrNumber, setUtrNumber] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(accountHolderName)}&am=${amount}&cu=INR`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;

    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSubmitUtr = (e: React.FormEvent) => {
        e.preventDefault();
        if (!utrNumber.trim()) return;
        setIsSubmitted(true);
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1200,
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "18px",
                    maxWidth: "520px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    padding: "28px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                            Owner Payment Details & Checkout
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                            Unit {unitNumber} • {billingMonth} Rent Demand
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.4rem",
                            color: "#94a3b8",
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Amount Banner */}
                <div
                    style={{
                        backgroundColor: "#eef2ff",
                        border: "1px solid #c7d2fe",
                        borderRadius: "14px",
                        padding: "16px 20px",
                        textAlign: "center",
                        marginBottom: "20px",
                    }}
                >
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#3730a3", textTransform: "uppercase" }}>
                        Total Amount Due
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#4f46e5", marginTop: "2px" }}>
                        ₹{amount.toLocaleString()}
                    </div>
                </div>

                {isSubmitted ? (
                    <div style={{ padding: "24px", textAlign: "center", backgroundColor: "#f0fdf4", borderRadius: "14px", border: "1px solid #bbf7d0" }}>
                        <h4 style={{ margin: "0 0 6px", color: "#166534", fontSize: "1.1rem", fontWeight: 800 }}>
                            Payment UTR Submitted Successfully!
                        </h4>
                        <p style={{ margin: "0 0 16px", fontSize: "0.875rem", color: "#15803d" }}>
                            Ref / UTR: <strong>{utrNumber}</strong>. The owner will verify and reconcile your payment receipt shortly.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                backgroundColor: "#166534",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "9px 20px",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                            }}
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Section 1: Scannable Dynamic UPI QR Code */}
                        <div
                            style={{
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "20px",
                                textAlign: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
                                Scan UPI QR Code to Pay ₹{amount.toLocaleString()}
                            </div>

                            <img
                                src={qrCodeUrl}
                                alt="Owner UPI Payment QR Code"
                                style={{
                                    width: "180px",
                                    height: "180px",
                                    borderRadius: "12px",
                                    border: "3px solid #ffffff",
                                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                                    margin: "0 auto 12px",
                                }}
                            />

                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
                            </div>

                            {/* Direct Deep-link Button for Mobile */}
                            <a
                                href={upiUri}
                                style={{
                                    display: "inline-block",
                                    marginTop: "12px",
                                    backgroundColor: "#4f46e5",
                                    color: "#ffffff",
                                    padding: "8px 18px",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    fontSize: "0.825rem",
                                    textDecoration: "none",
                                }}
                            >
                                Open Installed UPI App →
                            </a>
                        </div>

                        {/* Section 2: Owner Bank & Account Details with 1-Click Copy */}
                        <div style={{ marginBottom: "20px" }}>
                            <h4 style={{ margin: "0 0 10px", fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>
                                Owner Bank & UPI Account Details
                            </h4>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {/* UPI ID */}
                                <div style={rowStyle}>
                                    <div>
                                        <div style={labelStyle}>UPI ID</div>
                                        <div style={valueStyle}>{upiId}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(upiId, "upiId")}
                                        style={copyBtnStyle}
                                    >
                                        {copiedField === "upiId" ? "Copied!" : "Copy"}
                                    </button>
                                </div>

                                {/* Account Holder Name */}
                                <div style={rowStyle}>
                                    <div>
                                        <div style={labelStyle}>Account Holder Name</div>
                                        <div style={valueStyle}>{accountHolderName}</div>
                                    </div>
                                </div>

                                {/* Bank Account Number */}
                                <div style={rowStyle}>
                                    <div>
                                        <div style={labelStyle}>Bank Account Number</div>
                                        <div style={valueStyle}>{accountNumber}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(accountNumber, "accNum")}
                                        style={copyBtnStyle}
                                    >
                                        {copiedField === "accNum" ? "Copied!" : "Copy"}
                                    </button>
                                </div>

                                {/* IFSC Code & Bank Name */}
                                <div style={rowStyle}>
                                    <div>
                                        <div style={labelStyle}>IFSC Code & Bank</div>
                                        <div style={valueStyle}>{ifscCode} • {bankName}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(ifscCode, "ifsc")}
                                        style={copyBtnStyle}
                                    >
                                        {copiedField === "ifsc" ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Enter Payment UTR Reference */}
                        <form onSubmit={handleSubmitUtr} style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                            <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                                Enter Transaction UTR / Ref Number <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 423819203912"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: "#4f46e5",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "9px 18px",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        cursor: "pointer",
                                    }}
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
};

const labelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
};

const valueStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    fontWeight: 800,
    color: "#0f172a",
    marginTop: "2px",
};

const copyBtnStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#4f46e5",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "0.775rem",
    fontWeight: 700,
    cursor: "pointer",
};

export default TenantCheckoutModal;
