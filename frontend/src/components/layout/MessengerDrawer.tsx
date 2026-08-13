import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import api from "@/services/api";

interface MessengerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialMessage?: string;
    recipientName?: string;
    initialUnitId?: string;
}

export function MessengerDrawer({
    isOpen,
    onClose,
    initialMessage = "",
    recipientName = "",
    initialUnitId = "",
}: MessengerDrawerProps) {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const { user } = useSelector((state: RootState) => state.auth);

    const orgId = activeMembership?.organizationId?._id;

    const [units, setUnits] = useState<any[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string>(initialUnitId);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState(initialMessage);
    const [recipient, setRecipient] = useState(recipientName);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (isOpen && orgId) {
            setNewMessage(initialMessage);
            if (recipientName) setRecipient(recipientName);
            if (initialUnitId) setSelectedUnitId(initialUnitId);
            fetchUnits();
        }
    }, [isOpen, orgId, initialMessage, recipientName, initialUnitId]);

    useEffect(() => {
        if (isOpen && orgId) {
            fetchUnitMessages();
        }
    }, [isOpen, orgId, selectedUnitId]);

    const fetchUnits = async () => {
        if (!orgId) return;
        setLoadingUnits(true);
        try {
            const res = await api.get(`/organizations/${orgId}/units`);
            if (res.data?.success && Array.isArray(res.data.data?.units)) {
                const fetchedUnits = res.data.data.units;
                setUnits(fetchedUnits);
                if (!selectedUnitId && fetchedUnits.length > 0) {
                    setSelectedUnitId(fetchedUnits[0]._id);
                }
            }
        } catch {
            // Handled gracefully
        }
        setLoadingUnits(false);
    };

    const fetchUnitMessages = async () => {
        if (!orgId) return;
        setLoadingMessages(true);
        try {
            let url = `/notifications/unit-messages?organizationId=${orgId}`;
            if (selectedUnitId) {
                url += `&unitId=${selectedUnitId}`;
            }
            const res = await api.get(url);
            if (res.data?.success && Array.isArray(res.data.data)) {
                setMessages(res.data.data);
            } else {
                setMessages([]);
            }
        } catch {
            setMessages([]);
        }
        setLoadingMessages(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        setFeedback(null);

        const currentUnit = units.find((u) => u._id === selectedUnitId);
        const unitLabel = currentUnit ? `Unit ${currentUnit.unitNumber}` : recipient || "Unit";

        try {
            const payload = {
                title: `Chat — ${unitLabel}`,
                message: newMessage,
                type: "IN_APP_MESSAGE",
                organizationId: orgId,
                unitId: selectedUnitId || null,
                senderName: user?.name || "You",
            };

            const res = await api.post("/notifications/in-app-message", payload);

            if (res.data?.success) {
                setFeedback({ type: "success", text: `Message sent to ${unitLabel} chat thread.` });
                const newMsgObj = res.data.data || {
                    _id: Date.now().toString(),
                    title: payload.title,
                    message: newMessage,
                    createdAt: new Date().toISOString(),
                    senderName: user?.name || "You",
                    unitId: selectedUnitId,
                };
                setMessages((prev) => [...prev, newMsgObj]);
                setNewMessage("");
            } else {
                setFeedback({ type: "error", text: "Failed to deliver message." });
            }
        } catch {
            setFeedback({ type: "error", text: "Error sending message." });
        }
        setSending(false);
    };

    const activeUnit = units.find((u) => u._id === selectedUnitId);

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="💬 NESTPAY Unit Messenger"
            subtitle="Unit-wise shared chat thread for family occupants & property owner"
        >
            <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "14px" }}>
                {feedback && (
                    <div
                        style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                            color: feedback.type === "success" ? "#166534" : "#991b1b",
                            border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        }}
                    >
                        {feedback.text}
                    </div>
                )}

                {/* Unit List Selection Chips */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>
                        Select Unit Chat Thread:
                    </label>
                    {loadingUnits ? (
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Loading units...</div>
                    ) : units.length === 0 ? (
                        <div style={{ fontSize: "0.82rem", color: "#64748b", fontStyle: "italic" }}>
                            No units available in workspace.
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                            {units.map((u) => {
                                const isSelected = u._id === selectedUnitId;
                                return (
                                    <button
                                        key={u._id}
                                        onClick={() => setSelectedUnitId(u._id)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            border: `1px solid ${isSelected ? "#2563eb" : "#cbd5e1"}`,
                                            backgroundColor: isSelected ? "#2563eb" : "#ffffff",
                                            color: isSelected ? "#ffffff" : "#0f172a",
                                            fontSize: "0.82rem",
                                            fontWeight: isSelected ? 800 : 600,
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        Unit {u.unitNumber} ({u.unitType || "1 BHK"})
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {activeUnit && (
                    <div
                        style={{
                            padding: "8px 12px",
                            backgroundColor: "#eff6ff",
                            borderRadius: "8px",
                            border: "1px solid #bfdbfe",
                            fontSize: "0.82rem",
                            color: "#1e40af",
                            fontWeight: 700,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>📍 Active Thread: Unit {activeUnit.unitNumber} ({activeUnit.unitType})</span>
                        <span style={{ color: "#2563eb" }}>Status: {activeUnit.status}</span>
                    </div>
                )}

                {/* Messages Thread Box */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        padding: "12px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        minHeight: "220px",
                    }}
                >
                    {loadingMessages ? (
                        <div style={{ padding: "30px 0", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                            Loading unit messages...
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ padding: "30px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "6px" }}>💬</div>
                            <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem", fontWeight: 600 }}>
                                {activeUnit ? `No chat messages for Unit ${activeUnit.unitNumber} yet.` : "Select a unit to view conversation thread."}
                            </p>
                            <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "0.78rem" }}>
                                Messages sent here are visible to unit family occupants and the owner.
                            </p>
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isMe = m.senderName === user?.name || m.senderName === "You";
                            return (
                                <div
                                    key={m._id}
                                    style={{
                                        alignSelf: isMe ? "flex-end" : "flex-start",
                                        maxWidth: "85%",
                                        padding: "10px 14px",
                                        borderRadius: "12px",
                                        backgroundColor: isMe ? "#2563eb" : "#ffffff",
                                        color: isMe ? "#ffffff" : "#0f172a",
                                        border: `1px solid ${isMe ? "#2563eb" : "#e2e8f0"}`,
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                        fontSize: "0.88rem",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
                                        <strong style={{ fontSize: "0.78rem", opacity: isMe ? 0.9 : 0.75 }}>
                                            {m.senderName || "Member"}
                                        </strong>
                                        <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>
                                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                                        {m.message}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Send Message Form */}
                <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <textarea
                            rows={2}
                            placeholder={activeUnit ? `Message Unit ${activeUnit.unitNumber} thread...` : "Type a message..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            required
                            style={{
                                flex: 1,
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid #94a3b8",
                                fontSize: "0.9rem",
                                fontFamily: "inherit",
                                resize: "none",
                            }}
                        />
                        <Button variant="primary" type="submit" disabled={sending} style={{ alignSelf: "flex-end", height: "100%", padding: "12px 18px" }}>
                            {sending ? "Sending..." : "Send"}
                        </Button>
                    </div>
                </form>
            </div>
        </Drawer>
    );
}

export default MessengerDrawer;

