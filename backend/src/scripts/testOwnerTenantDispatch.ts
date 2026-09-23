import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import Organization from "../models/Organization.js";
import Unit from "../models/Unit.js";
import Customer from "../models/Customer.js";
import { dispatchMultiChannelNotification } from "../services/multiChannelDispatch.js";

// Fix Node.js DNS SRV record resolution on Windows
try {
    dns.setDefaultResultOrder("ipv4first");
} catch {}
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function testOwnerTenantDispatch() {
    try {
        console.log("Connecting to MongoDB...");
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not set in environment.");
        }
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB.");

        // 1. Find Organization
        let org = await Organization.findOne({ name: { $regex: /abc/i } });
        if (!org) {
            org = await Organization.findOne({});
        }

        if (!org) {
            console.error("❌ No Organization found in database.");
            return;
        }

        const orgId = org._id.toString();
        console.log(`Using Organization: "${org.name}" (${orgId})`);

        // 2. Configure Owner Email Sender Identity for Org
        org.emailSenderConfig = {
            senderName: "Sanjay Saravanan",
            senderEmail: "sanjaysaravanan306@gmail.com",
            replyToEmail: "sanjaysaravanan306@gmail.com",
            isVerified: true,
        };
        await org.save();
        console.log(`✅ Configured Owner Sender Identity: "Sanjay Saravanan" <sanjaysaravanan306@gmail.com>`);

        // 3. Find Unit 101
        let unit = await Unit.findOne({ organizationId: orgId, unitNumber: "101" });
        if (!unit) {
            unit = await Unit.findOne({ organizationId: orgId });
        }

        if (!unit) {
            console.error("❌ No Unit found in database.");
            return;
        }

        const unitId = unit._id.toString();
        console.log(`Using Unit: "${unit.unitNumber}" (${unitId})`);

        // 4. Find or Create Tenant Customer with target email & phone
        const tenantEmail = "sanjay8612ssk@gmail.com";
        const tenantPhone = "918344226412";

        let customer = await Customer.findOne({ organizationId: orgId, unitId });
        if (customer) {
            customer.name = "Sanjay Tenant";
            customer.email = tenantEmail;
            customer.phone = tenantPhone;
            customer.status = "ACTIVE";
            await customer.save();
        } else {
            customer = await Customer.create({
                organizationId: orgId,
                unitId,
                name: "Sanjay Tenant",
                email: tenantEmail,
                phone: tenantPhone,
                status: "ACTIVE",
            });
        }
        console.log(`✅ Configured Tenant Customer: "${customer.name}" <${tenantEmail}> (Phone: ${tenantPhone})`);

        // 5. Trigger Multi-Channel Dispatch Test
        console.log("\n🚀 Triggering Multi-Channel Dispatch Test for Unit " + unit.unitNumber + "...");
        const result = await dispatchMultiChannelNotification({
            organizationId: orgId,
            unitId,
            recipients: "ALL",
            messageType: "AMOUNT_SET",
            amount: 15000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            billingPeriod: "Feb 2026",
            dayRuleLabel: "Bill Update Notice",
        });

        console.log("\n📊 Dispatch Results:");
        console.log(`- Success: ${result.success}`);
        console.log(`- Total Recipients: ${result.totalRecipients}`);
        console.log(`- Dispatched Count: ${result.dispatchedCount}`);
        console.log(`- Failed Count: ${result.failedCount}`);
        console.log("- Details:", JSON.stringify(result.details, null, 2));

        console.log("\n✅ Test completed!");
    } catch (error) {
        console.error("❌ Error running dispatch test:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    }
}

testOwnerTenantDispatch();
