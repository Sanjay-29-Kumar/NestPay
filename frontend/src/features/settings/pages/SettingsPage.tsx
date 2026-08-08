import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Drawer from "@/components/ui/Drawer";
import { sendWhatsAppTestApi, triggerCronRemindersApi } from "@/features/notifications/services/notificationsApi";

function SettingsPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;
    const orgName = activeMembership?.organizationId?.name || "Active Workspace";
    const userRole = activeMembership?.role;

    const [testDrawerOpen, setTestDrawerOpen] = useState(false);
    const [recipientNumber, setRecipientNumber] = useState("919677708612");
    const [testMessage, setTestMessage] = useState("Hello from NestPay! Real-world WhatsApp Business Platform integration test is working.");
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string; messageId?: string } | null>(null);

    // Cron Trigger state
    const [runningCron, setRunningCron] = useState(false);
    const [cronResult, setCronResult] = useState<any | null>(null);

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setFeedback(null);

        const res = await sendWhatsAppTestApi({
            recipientNumber,
            message: testMessage,
            organizationId: orgId,
        });

        setSending(false);

        if (res.success) {
            setFeedback({
                type: "success",
                message: res.message || "Message dispatched successfully!",
                messageId: res.messageId,
            });
        } else {
            setFeedback({
                type: "error",
                message: res.message || "Failed to dispatch WhatsApp message.",
            });
        }
    };

    const handleTriggerCron = async () => {
        setRunningCron(true);
        setCronResult(null);

        const res = await triggerCronRemindersApi();
        setRunningCron(false);

        if (res.success) {
            setCronResult(res.summary);
        } else {
            alert(res.message || "Failed to execute cron job.");
        }
    };

    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Organization & Account Settings
                    </h1>
                    <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                        Manage integration credentials, automated WhatsApp cron schedules, and security settings.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
                    {/* User Profile */}
                    <Card title="User Account Details" subtitle="Personal account information">
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
                            <div>
                                <span style={{ color: "#64748b" }}>User Name: </span>
                                <strong>{user?.name}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Email: </span>
                                <strong>{user?.email}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Role in Workspace: </span>
                                <span style={{ backgroundColor: "#e0e7ff", color: "#3730a3", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                                    {userRole || "MEMBER"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* WhatsApp Business Cloud API Settings */}
                    <Card
                        title="WhatsApp Business Cloud API Settings"
                        subtitle={`Organization notification integration for ${orgName}`}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ color: "#64748b" }}>Provider Status:</span>
                                <span style={{ backgroundColor: "#dcfce7", color: "#15803d", fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: "12px", border: "1px solid #86efac" }}>
                                    ● ACTIVE (Meta Cloud API)
                                </span>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>API Version: </span>
                                <strong>v22.0 (Official Meta Graph API)</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Phone Number ID: </span>
                                <code style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "0.85rem" }}>1208620762341597</code>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Business Account ID: </span>
                                <code style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "0.85rem" }}>2045554146104477</code>
                            </div>

                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <Button variant="primary" onClick={() => setTestDrawerOpen(true)}>
                                    💬 Test WhatsApp Message Dispatch
                                </Button>
                                <Button variant="outline" onClick={handleTriggerCron} disabled={runningCron}>
                                    {runningCron ? "Executing Cron..." : "⚡ Run Daily Cron Reminders Now"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Automated Cron Batch Execution Summary */}
                {cronResult && (
                    <Card title="Automated WhatsApp Cron Execution Results" subtitle={`Event: ${cronResult.reminderEvent} (Day ${cronResult.dayOfMonth} of month)`}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                                <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Processed</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{cronResult.totalProcessed} tenants</div>
                                </div>
                                <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#166534" }}>Dispatched</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#16a34a" }}>{cronResult.totalDispatched} messages</div>
                                </div>
                                <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#991b1b" }}>Failed</div>
                                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#dc2626" }}>{cronResult.totalFailed}</div>
                                </div>
                            </div>

                            {cronResult.details && cronResult.details.length > 0 && (
                                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", marginTop: "4px" }}>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.88rem", color: "#334155" }}>Processed Tenants Log:</h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {cronResult.details.map((item: any, idx: number) => (
                                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", padding: "6px 10px", background: "#f8fafc", borderRadius: "6px" }}>
                                                <div>
                                                    <strong>{item.tenantName}</strong> ({item.phone})
                                                </div>
                                                <span style={{ fontWeight: 700, color: item.status === "DISPATCHED" ? "#16a34a" : "#dc2626" }}>
                                                    {item.status} {item.messageId ? `(${item.messageId.slice(0, 16)}...)` : item.reason ? `- ${item.reason}` : ""}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Test WhatsApp Drawer */}
                <Drawer
                    isOpen={testDrawerOpen}
                    onClose={() => setTestDrawerOpen(false)}
                    title="Send Test WhatsApp Message"
                    subtitle="Dispatch a real-world test message using Meta WhatsApp Cloud API."
                >
                    <form onSubmit={handleSendTest} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {feedback && (
                            <div
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: "8px",
                                    fontSize: "0.88rem",
                                    backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                                    color: feedback.type === "success" ? "#166534" : "#991b1b",
                                    border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                                }}
                            >
                                <div style={{ fontWeight: 700 }}>{feedback.message}</div>
                                {feedback.messageId && (
                                    <div style={{ marginTop: "4px", fontSize: "0.78rem", wordBreak: "break-all" }}>
                                        Meta Message ID: <code>{feedback.messageId}</code>
                                    </div>
                                )}
                            </div>
                        )}

                        <Input
                            label="Recipient Phone Number (with Country Code) *"
                            name="recipientNumber"
                            placeholder="e.g. 919677708612"
                            value={recipientNumber}
                            onChange={(e) => setRecipientNumber(e.target.value)}
                            required
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Test Message Body *
                            </label>
                            <textarea
                                rows={4}
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                required
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.9rem",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                            <Button variant="outline" type="button" onClick={() => setTestDrawerOpen(false)}>
                                Close
                            </Button>
                            <Button variant="primary" type="submit" disabled={sending}>
                                {sending ? "Dispatching to Meta..." : "Send Test WhatsApp"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default SettingsPage;
