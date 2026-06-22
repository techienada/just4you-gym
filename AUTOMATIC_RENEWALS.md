# Automatic Renewals

This project now includes a Supabase Edge Function scaffold for automatic renewal reminders:

- SQL table: `supabase/sql/renewal_reminders.sql`
- Edge function: `supabase/functions/send-renewal-reminders/index.ts`
- Vercel relay endpoint: `api/msg91-renewal-relay.js`

## What it does

The function checks `members.expiry_date` every day and sends one reminder for:

- `three_days_before`
- `expiry_day`
- `expired_followup`

Each send attempt is logged in `renewal_reminders`, so the same reminder is not sent twice on the same day for the same stage.

## What you still need

Automatic WhatsApp or SMS sending needs a real provider. This code uses a webhook so you can connect:

- WhatsApp Business API
- Twilio
- MSG91
- Interakt
- your own backend relay

This repo is now prepared for `MSG91 WhatsApp` through the Vercel relay route.

## Supabase setup

Run this SQL in Supabase:

1. Your existing app tables
2. `assessment_history`
3. `supabase/sql/renewal_reminders.sql`

## Vercel environment variables

Add these in Vercel:

- `RENEWAL_RELAY_SECRET`
- `MSG91_RENEWAL_API_URL`
- `MSG91_AUTH_KEY`
- `MSG91_WHATSAPP_NUMBER`
- `MSG91_TEMPLATE_LANGUAGE`
- `MSG91_TEMPLATE_THREE_DAYS_BEFORE`
- `MSG91_TEMPLATE_EXPIRY_DAY`
- `MSG91_TEMPLATE_EXPIRED_FOLLOWUP`

Notes:

- `MSG91_RENEWAL_API_URL` must be the exact MSG91 WhatsApp template-send endpoint from your account/docs.
- The three template values must be approved MSG91 WhatsApp template names.
- The relay sends body parameters in this order:
  1. member name
  2. package type
  3. expiry date
  4. amount

## Supabase secrets

In Supabase project settings, add these secrets:

- `RENEWAL_REMINDER_WEBHOOK_URL`
- `RENEWAL_REMINDER_WEBHOOK_SECRET`

Recommended values:

- `RENEWAL_REMINDER_WEBHOOK_URL=https://your-domain.vercel.app/api/msg91-renewal-relay`
- `RENEWAL_REMINDER_WEBHOOK_SECRET=<same value as RENEWAL_RELAY_SECRET in Vercel>`

Example webhook payload sent by the function:

```json
{
  "memberId": "uuid",
  "memberName": "Nada",
  "phone": "919063216560",
  "expiryDate": "2026-06-30",
  "packageType": "Monthly",
  "amount": 1300,
  "reminderType": "expiry_day",
  "message": "Hi Nada, your Monthly at Just4You Ladies Gym expires today..."
}
```

## Deploy the function

If you have Supabase CLI installed:

```bash
supabase functions deploy send-renewal-reminders
```

## Schedule it

Set a daily cron job to call the function once per day.

Recommended schedule:

- every day at 9:00 AM India time

You can do that from:

- Supabase scheduled functions setup
- external cron service hitting the function URL

## Payment QR

The member payment QR is already added in:

- `src/components/MemberDashboard.jsx`

Members can:

- scan the QR
- tap `Open UPI App`
- submit their payment request after paying

## Important production note

The QR is ready in the frontend, but payment submission will only work cleanly if the `upi_payments` table includes:

- `member_name`
- `package_type`
- `status`
- `submitted_at`
- `confirmed_at`

## Recommended next test

1. Deploy latest frontend to Vercel
2. Run the SQL files in Supabase
3. Deploy the edge function
4. Add the Vercel MSG91 env vars
5. Trigger the function once manually
6. Confirm one reminder row appears in `renewal_reminders`
7. Confirm the relay endpoint returns success from MSG91
