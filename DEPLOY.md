## Deploy

This project is a Vite static app and can be deployed directly to Vercel or Netlify.

### Required environment variables

Set these in your hosting dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

If using automatic MSG91 renewal reminders through the Vercel relay, also add:

- `RENEWAL_RELAY_SECRET`
- `MSG91_RENEWAL_API_URL`
- `MSG91_AUTH_KEY`
- `MSG91_WHATSAPP_NUMBER`
- `MSG91_TEMPLATE_LANGUAGE`
- `MSG91_TEMPLATE_THREE_DAYS_BEFORE`
- `MSG91_TEMPLATE_EXPIRY_DAY`
- `MSG91_TEMPLATE_EXPIRED_FOLLOWUP`

You can copy the names from [.env.example](C:/Users/AD/OneDrive/Desktop/Just4youladiesgym/just4you-gym/.env.example).

### Recommended launch flow

1. Import this folder into Vercel.
2. Add the two `VITE_...` environment variables.
3. Deploy the site.
4. Add your custom domain in Vercel.
5. Update the domain DNS records where your domain is managed.

### Notes

- If your domain originally came from Google Domains, DNS is now commonly managed in Squarespace Domains after the Google Domains migration.
- Supabase bucket and database setup must already exist for tea orders, member photos, and payments to work in production.
- For automatic reminders, point Supabase secret `RENEWAL_REMINDER_WEBHOOK_URL` to your deployed Vercel endpoint:
  `https://your-domain.vercel.app/api/msg91-renewal-relay`
- Set Supabase secret `RENEWAL_REMINDER_WEBHOOK_SECRET` to match `RENEWAL_RELAY_SECRET`.
