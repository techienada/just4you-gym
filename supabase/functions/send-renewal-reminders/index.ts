import { createClient } from "npm:@supabase/supabase-js@2";

type MemberRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  expiry_date: string | null;
  package_type: string | null;
  fee_amount: number | null;
};

type ReminderStage = "three_days_before" | "expiry_day" | "expired_followup";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const reminderWebhookUrl = Deno.env.get("RENEWAL_REMINDER_WEBHOOK_URL");
const reminderWebhookSecret = Deno.env.get("RENEWAL_REMINDER_WEBHOOK_SECRET");

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function normalizePhone(phone: string | null) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
}

function getReminderMessage(member: MemberRow, stage: ReminderStage) {
  const packageLabel = member.package_type || "membership";
  const amount = member.fee_amount ? ` Rs. ${Number(member.fee_amount).toLocaleString("en-IN")}` : "";

  if (stage === "three_days_before") {
    return `Hi ${member.full_name || "Member"}, your ${packageLabel} at Just4You Ladies Gym will expire in 3 days on ${member.expiry_date}. Please renew to continue your workouts smoothly.${amount ? ` Renewal amount:${amount}.` : ""}`;
  }

  if (stage === "expiry_day") {
    return `Hi ${member.full_name || "Member"}, your ${packageLabel} at Just4You Ladies Gym expires today (${member.expiry_date}). Please complete your renewal today to keep your access active.${amount ? ` Renewal amount:${amount}.` : ""}`;
  }

  return `Hi ${member.full_name || "Member"}, your Just4You Ladies Gym membership expired on ${member.expiry_date}. Please contact the trainer and renew your plan to continue your workouts.${amount ? ` Renewal amount:${amount}.` : ""}`;
}

async function sendReminder(member: MemberRow, stage: ReminderStage) {
  if (!reminderWebhookUrl) {
    return {
      ok: false,
      providerMessage: "RENEWAL_REMINDER_WEBHOOK_URL is not configured",
      responsePayload: null,
    };
  }

  const payload = {
    memberId: member.id,
    memberName: member.full_name,
    phone: normalizePhone(member.phone),
    expiryDate: member.expiry_date,
    packageType: member.package_type,
    amount: member.fee_amount,
    reminderType: stage,
    message: getReminderMessage(member, stage),
  };

  const response = await fetch(reminderWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(reminderWebhookSecret ? { Authorization: `Bearer ${reminderWebhookSecret}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  let responsePayload: unknown = null;
  try {
    responsePayload = await response.json();
  } catch {
    responsePayload = await response.text();
  }

  return {
    ok: response.ok,
    providerMessage: response.ok ? "sent" : `provider_error_${response.status}`,
    responsePayload,
  };
}

async function alreadySent(memberId: string, stage: ReminderStage, reminderDate: string) {
  const { data, error } = await supabase
    .from("renewal_reminders")
    .select("id")
    .eq("member_id", memberId)
    .eq("reminder_type", stage)
    .eq("reminder_date", reminderDate)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function logReminder(memberId: string, stage: ReminderStage, reminderDate: string, result: { ok: boolean; providerMessage: string; responsePayload: unknown }) {
  const { error } = await supabase.from("renewal_reminders").insert([{
    member_id: memberId,
    reminder_type: stage,
    reminder_date: reminderDate,
    status: result.ok ? "sent" : "failed",
    provider_message: result.providerMessage,
    response_payload: result.responsePayload,
    updated_at: new Date().toISOString(),
  }]);

  if (error) throw error;
}

Deno.serve(async () => {
  const today = new Date();
  const todayStr = formatDate(today);
  const threeDaysLater = formatDate(addDays(today, 3));
  const yesterdayStr = formatDate(addDays(today, -1));

  const { data: members, error } = await supabase
    .from("members")
    .select("id, full_name, phone, expiry_date, package_type, fee_amount")
    .not("expiry_date", "is", null);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const member of (members || []) as MemberRow[]) {
    if (!member.phone || !member.expiry_date) continue;

    let stage: ReminderStage | null = null;
    if (member.expiry_date === threeDaysLater) stage = "three_days_before";
    if (member.expiry_date === todayStr) stage = "expiry_day";
    if (member.expiry_date === yesterdayStr) stage = "expired_followup";
    if (!stage) continue;

    const exists = await alreadySent(member.id, stage, todayStr);
    if (exists) {
      results.push({ memberId: member.id, stage, status: "skipped_duplicate" });
      continue;
    }

    const sendResult = await sendReminder(member, stage);
    await logReminder(member.id, stage, todayStr, sendResult);
    results.push({
      memberId: member.id,
      memberName: member.full_name,
      stage,
      status: sendResult.ok ? "sent" : "failed",
      providerMessage: sendResult.providerMessage,
    });
  }

  return new Response(JSON.stringify({ ok: true, processedOn: todayStr, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
