## Deploy

This project is a Vite static app and can be deployed directly to Vercel or Netlify.

### Required environment variables

Set these in your hosting dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

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
