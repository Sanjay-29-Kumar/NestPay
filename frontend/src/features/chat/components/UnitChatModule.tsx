import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { io, Socket } from "socket.io-client";
import {
    getUnitMessagesApi,
    sendChatMessageApi,
    uploadChatPhotoApi,
    markMessagesReadApi,
} from "../services/chatApi";
import type { ChatMessageItem, ChatAttachment } from "../services/chatApi";

interface UnitChatModuleProps {
    orgId: string;
    unitId: string;
    unitNumber?: string;
    occupants?: any[];
}

export const UnitChatModule: React.FC<UnitChatModuleProps> = ({
    orgId,
    unitId,
    unitNumber,
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [accessError, setAccessError] = useState<string>("");

    const [textInput, setTextInput] = useState<string>("");
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);

    // Lightbox modal state for full view of attached images
    const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
    const [showScrollDownButton, setShowScrollDownButton] = useState<boolean>(false);
    const [newMessagesCount, setNewMessagesCount] = useState<number>(0);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setNewMessagesCount(0);
        setShowScrollDownButton(false);
    };

    const handleContainerScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100;
        setShowScrollDownButton(isNotAtBottom);
        if (!isNotAtBottom) {
            setNewMessagesCount(0);
        }
    };

    // 1. Fetch initial message history & mark as read
    const loadMessages = async () => {
        if (!orgId || !unitId) return;
        try {
            const res = await getUnitMessagesApi(orgId, unitId);
            if (res.success && res.data) {
                setMessages(res.data);
                setAccessError("");
                markMessagesReadApi(orgId, unitId).catch(() => {});
                setTimeout(() => scrollToBottom(), 100);
            } else {
                setAccessError("Access Restricted: Only unit occupants and property managers can view this chat thread.");
            }
        } catch (err: any) {
            setAccessError(err?.response?.data?.message || "Failed to load chat history.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        loadMessages();
    }, [orgId, unitId]);

    // 2. Real-time Socket.io Connection & Periodic Polling
    useEffect(() => {
        if (!unitId) return;

        const currentUserIdStr = String((user as any)?.id || user?._id || "");

        // Establish Socket.io connection to backend (port 5000)
        const backendUrl = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).origin
            : "http://localhost:5000";

        const socket = io(backendUrl, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_unit_room", { unitId });
        });

        socket.on("new_message", (newMsg: ChatMessageItem) => {
            if (String(newMsg.unitId) === String(unitId)) {
                setMessages((prev) => {
                    if (prev.some((m) => String(m._id) === String(newMsg._id))) {
                        return prev;
                    }
                    return [...prev, newMsg];
                });

                // Determine if user is currently scrolled up
                if (chatContainerRef.current) {
                    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
                    const isUserScrolledUp = scrollHeight - scrollTop - clientHeight > 100;

                    if (isUserScrolledUp && String(newMsg.senderId) !== currentUserIdStr) {
                        setNewMessagesCount((c) => c + 1);
                        setShowScrollDownButton(true);
                    } else {
                        setTimeout(() => scrollToBottom(), 50);
                    }
                } else {
                    setTimeout(() => scrollToBottom(), 50);
                }

                if ((user as any)?.id || user?._id) {
                    markMessagesReadApi(orgId, unitId).catch(() => {});
                }
            }
        });

        socket.on("messages_read", (data: { unitId: string; userId: string }) => {
            if (String(data.unitId) === String(unitId)) {
                setMessages((prev) =>
                    prev.map((msg) => {
                        if (!msg.readBy.includes(data.userId)) {
                            return { ...msg, readBy: [...msg.readBy, data.userId] };
                        }
                        return msg;
                    })
                );
            }
        });

        // 4-second polling fallback
        const pollInterval = setInterval(() => {
            getUnitMessagesApi(orgId, unitId).then((res) => {
                if (res.success && res.data) {
                    setMessages(res.data);
                }
            }).catch(() => {});
        }, 4000);

        return () => {
            clearInterval(pollInterval);
            if (socket) {
                socket.emit("leave_unit_room", { unitId });
                socket.disconnect();
            }
        };
    }, [orgId, unitId, user]);

    // Handle Photo Selection
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        setSelectedPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreviewUrl(null);
    };

    // Send Message Handler
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = textInput.trim();
        if (!text && !selectedPhoto) return;

        setIsSending(true);

        try {
            let attachments: ChatAttachment[] = [];

            if (selectedPhoto) {
                setIsUploadingPhoto(true);
                const uploadRes = await uploadChatPhotoApi(orgId, unitId, selectedPhoto);
                setIsUploadingPhoto(false);

                if (uploadRes.success && uploadRes.data) {
                    attachments.push({
                        url: uploadRes.data.url,
                        fileName: uploadRes.data.fileName,
                        mimeType: uploadRes.data.mimeType,
                    });
                } else {
                    alert(uploadRes.message || "Failed to upload photo attachment.");
                    setIsSending(false);
                    return;
                }
            }

            const res = await sendChatMessageApi(orgId, unitId, {
                text,
                attachments,
                messageType: attachments.length > 0 ? "IMAGE" : "TEXT",
            });

            if (res.success && res.data) {
                setMessages((prev) => {
                    if (prev.some((m) => String(m._id) === String(res.data._id))) return prev;
                    return [...prev, res.data];
                });
                setTextInput("");
                handleRemovePhoto();
            } else {
                alert("Failed to send message.");
            }
        } catch {
            alert("Error sending message.");
        } finally {
            setIsSending(false);
            setIsUploadingPhoto(false);
        }
    };

    const currentUserId = String((user as any)?.id || user?._id || "");

    if (isLoading) {
        return (
            <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                ⏳ Loading unit chat thread...
            </div>
        );
    }

    if (accessError) {
        return (
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "48px 24px",
                    textAlign: "center",
                    maxWidth: "520px",
                    margin: "40px auto",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
                }}
            >
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔒</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                    Access Restricted
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                    {accessError}
                </p>
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                height: "620px",
                overflow: "hidden",
            }}
        >
            {/* Chat Thread Header */}
            <div
                style={{
                    padding: "14px 20px",
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                        }}
                    >
                        💬
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                            Unit {unitNumber || ""} — Interactive Chat
                        </h3>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                            Real-time thread for property owners, admins & unit tenants
                        </span>
                    </div>
                </div>

                <span
                    style={{
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontSize: "0.725rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                    }}
                >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                    Live Sync
                </span>
            </div>

            {/* Messages Body Scroll Container */}
            <div style={{ position: "relative", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div
                    ref={chatContainerRef}
                    onScroll={handleContainerScroll}
                    style={{
                        flex: 1,
                        padding: "20px",
                        overflowY: "auto",
                        backgroundColor: "#f1f5f9",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    {messages.length === 0 ? (
                        <div style={{ textAlign: "center", margin: "auto", color: "#94a3b8" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💬</div>
                            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>No messages in this chat yet.</p>
                            <p style={{ margin: "4px 0 0", fontSize: "0.8rem" }}>Start the conversation below!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isSystem = msg.senderRole === "SYSTEM" || msg.messageType === "SYSTEM";
                            const isMe = String(msg.senderId) === currentUserId;

                            if (isSystem) {
                                return (
                                    <div
                                        key={msg._id}
                                        style={{
                                            alignSelf: "center",
                                            maxWidth: "85%",
                                            backgroundColor: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            borderRadius: "12px",
                                            padding: "10px 16px",
                                            textAlign: "center",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                        }}
                                    >
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                            <span
                                                style={{
                                                    backgroundColor: "#3b82f6",
                                                    color: "#ffffff",
                                                    fontSize: "0.65rem",
                                                    fontWeight: 800,
                                                    padding: "1px 6px",
                                                    borderRadius: "4px",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                System Notice
                                            </span>
                                            <span style={{ fontSize: "0.725rem", color: "#64748b" }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e3a8a" }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={msg._id}
                                    style={{
                                        alignSelf: isMe ? "flex-end" : "flex-start",
                                        maxWidth: "75%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: isMe ? "flex-end" : "flex-start",
                                    }}
                                >
                                    {/* Sender Info Header */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            marginBottom: "4px",
                                            padding: "0 4px",
                                        }}
                                    >
                                        <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "#475569" }}>
                                            {isMe ? "You" : msg.senderName}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                padding: "1px 6px",
                                                borderRadius: "4px",
                                                backgroundColor: ["OWNER", "ADMIN"].includes(msg.senderRole) ? "#e0e7ff" : "#e2e8f0",
                                                color: ["OWNER", "ADMIN"].includes(msg.senderRole) ? "#3730a3" : "#334155",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {msg.senderRole}
                                        </span>
                                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>

                                    {/* Message Content Bubble */}
                                    <div
                                        style={{
                                            backgroundColor: isMe ? "#4f46e5" : "#ffffff",
                                            color: isMe ? "#ffffff" : "#0f172a",
                                            borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                                            padding: "12px 16px",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                            border: isMe ? "none" : "1px solid #e2e8f0",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {/* Text Content */}
                                        {msg.text && (
                                            <div style={{ fontSize: "0.925rem", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                                                {msg.text}
                                            </div>
                                        )}

                                        {/* Photo Attachments Inline Thumbnails */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "8px",
                                                    marginTop: msg.text ? "8px" : "0",
                                                }}
                                            >
                                                {msg.attachments.map((att, idx) => {
                                                    const fullUrl = att.url.startsWith("http")
                                                        ? att.url
                                                        : `${import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : "http://localhost:5000"}${att.url}`;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => setActiveLightboxImage(fullUrl)}
                                                            style={{
                                                                position: "relative",
                                                                borderRadius: "8px",
                                                                overflow: "hidden",
                                                                cursor: "pointer",
                                                                border: "2px solid rgba(255,255,255,0.2)",
                                                                maxWidth: "220px",
                                                                maxHeight: "220px",
                                                            }}
                                                            title="Click to expand full image"
                                                        >
                                                            <img
                                                                src={fullUrl}
                                                                alt={att.fileName || "Attachment"}
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "cover",
                                                                    display: "block",
                                                                    transition: "transform 0.2s ease",
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Floating Scroll / New Message Pill Button */}
                {showScrollDownButton && (
                    <button
                        type="button"
                        onClick={scrollToBottom}
                        title="Scroll to latest messages"
                        style={{
                            position: "absolute",
                            bottom: "16px",
                            right: "20px",
                            backgroundColor: newMessagesCount > 0 ? "#10b981" : "#4f46e5",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: newMessagesCount > 0 ? "24px" : "50%",
                            padding: newMessagesCount > 0 ? "8px 16px" : "0",
                            width: newMessagesCount > 0 ? "auto" : "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            zIndex: 10,
                            transition: "all 0.2s ease",
                        }}
                    >
                        {newMessagesCount > 0 ? (
                            <>
                                <span>📩 New Message ({newMessagesCount})</span>
                                <span style={{ fontSize: "1rem" }}>⬇️</span>
                            </>
                        ) : (
                            <span style={{ fontSize: "1.1rem" }}>⬇️</span>
                        )}
                    </button>
                )}
            </div>

            {/* Photo Attachment Preview Bar */}
            {photoPreviewUrl && (
                <div
                    style={{
                        padding: "10px 16px",
                        backgroundColor: "#f8fafc",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                            src={photoPreviewUrl}
                            alt="Preview"
                            style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover" }}
                        />
                        <div>
                            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#0f172a" }}>
                                {selectedPhoto?.name || "Photo attachment"}
                            </div>
                            <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                                Ready to upload
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                        }}
                    >
                        ✕ Remove
                    </button>
                </div>
            )}

            {/* Chat Input Form */}
            <form
                onSubmit={handleSendMessage}
                style={{
                    padding: "12px 16px",
                    backgroundColor: "#ffffff",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                {/* Photo Upload Attachment Button */}
                <label
                    style={{
                        cursor: "pointer",
                        padding: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#f1f5f9",
                        color: "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                    }}
                    title="Attach Photo"
                >
                    <span style={{ fontSize: "1.2rem" }}>📷</span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        style={{ display: "none" }}
                    />
                </label>

                {/* Text Message Input */}
                <input
                    type="text"
                    placeholder="Type your message to unit participants..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isSending}
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: "24px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.925rem",
                        outline: "none",
                        backgroundColor: "#f8fafc",
                    }}
                />

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={isSending || (!textInput.trim() && !selectedPhoto)}
                    style={{
                        backgroundColor: isSending || (!textInput.trim() && !selectedPhoto) ? "#cbd5e1" : "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "24px",
                        padding: "12px 22px",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        cursor: isSending || (!textInput.trim() && !selectedPhoto) ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 6px rgba(79,70,229,0.25)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {isUploadingPhoto ? "Uploading..." : isSending ? "Sending..." : "Send Send ➔"}
                </button>
            </form>

            {/* Photo Full-Screen Lightbox Modal */}
            {activeLightboxImage && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.85)",
                        zIndex: 99999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                    onClick={() => setActiveLightboxImage(null)}
                >
                    <div
                        style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveLightboxImage(null)}
                            style={{
                                position: "absolute",
                                top: "-40px",
                                right: 0,
                                background: "none",
                                border: "none",
                                color: "#ffffff",
                                fontSize: "1.8rem",
                                cursor: "pointer",
                                fontWeight: 800,
                            }}
                        >
                            ✕
                        </button>
                        <img
                            src={activeLightboxImage}
                            alt="Full View"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "85vh",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitChatModule;
