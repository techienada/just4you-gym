export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const expectedSecret = process.env.RENEWAL_RELAY_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const {
    memberId,
    memberName,
    phone,
    expiryDate,
    packageType,
    amount,
    reminderType,
    message,
  } = req.body || {};

  if (!phone || !message || !reminderType) {
    return res.status(400).json({ ok: false, error: "Missing phone, message, or reminderType" });
  }

  const msg91Endpoint = process.env.MSG91_RENEWAL_API_URL;
  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  const msg91IntegratedNumber = process.env.MSG91_WHATSAPP_NUMBER;

  const templateMap = {
    three_days_before: process.env.MSG91_TEMPLATE_THREE_DAYS_BEFORE,
    expiry_day: process.env.MSG91_TEMPLATE_EXPIRY_DAY,
    expired_followup: process.env.MSG91_TEMPLATE_EXPIRED_FOLLOWUP,
  };

  const templateName = templateMap[reminderType];

  if (!msg91Endpoint || !msg91AuthKey || !msg91IntegratedNumber || !templateName) {
    return res.status(500).json({
      ok: false,
      error: "MSG91 relay is not fully configured",
      missing: {
        MSG91_RENEWAL_API_URL: !msg91Endpoint,
        MSG91_AUTH_KEY: !msg91AuthKey,
        MSG91_WHATSAPP_NUMBER: !msg91IntegratedNumber,
        template: !templateName,
      },
    });
  }

  const payload = {
    integrated_number: msg91IntegratedNumber,
    content_type: "template",
    payload: {
      to: String(phone),
      type: "template",
      template: {
        name: templateName,
        language: {
          code: process.env.MSG91_TEMPLATE_LANGUAGE || "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: memberName || "Member" },
              { type: "text", text: packageType || "Membership" },
              { type: "text", text: expiryDate || "-" },
              { type: "text", text: amount ? `Rs. ${Number(amount).toLocaleString("en-IN")}` : "-" },
            ],
          },
        ],
      },
      meta: {
        memberId,
        reminderType,
        fallbackMessage: message,
      },
    },
  };

  try {
    const response = await fetch(msg91Endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: msg91AuthKey,
      },
      body: JSON.stringify(payload),
    });

    let providerResponse;
    try {
      providerResponse = await response.json();
    } catch {
      providerResponse = await response.text();
    }

    return res.status(response.ok ? 200 : 502).json({
      ok: response.ok,
      provider: "msg91",
      templateName,
      providerResponse,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Could not reach MSG91",
    });
  }
}
