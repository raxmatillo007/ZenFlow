# ZenFlow Global Release Checklist

## Already done
- Legal modal added: privacy, terms, refund, contact
- Support email exposed on landing page
- Production-style CORS env support added in backend
- `.env.example` added for frontend and backend
- Billing modal no longer grants premium instantly
- Production API fallback uses `/api` when `VITE_API_URL` is missing

## Still required before launch

### 1. Infrastructure
- Buy a production domain
- Enable HTTPS
- Deploy frontend and backend
- Prepare a production PostgreSQL database

### 2. Environment
- Fill `.env` from `.env.example`
- Set `APP_URL`
- Set `VITE_API_URL`
- Set `CORS_ORIGIN`
- Set a strong `AUTH_SECRET`
- Set `VITE_SUPPORT_EMAIL`

### 3. Database
- Run `npm run db:generate`
- Run `npm run db:push` or `npm run db:migrate`

### 4. Auth
- Add production Google OAuth credentials
- Add production redirect URLs in Google console

### 5. Billing
- Stripe for Visa/Mastercard
- Click or Payme for Uzcard/Humo
- Add webhook handling
- Store confirmed subscription state in database

### 6. Product quality
- Review all RU translations and replace remaining broken encoding
- Test auth, settings, stats, and premium flows on production URLs
- Add monitoring/logging for backend errors and webhook failures

## Recommended launch order
1. Deploy frontend/backend
2. Configure env values
3. Run Prisma migration/generate
4. Verify auth and bootstrap
5. Connect Stripe
6. Connect Click/Payme
7. Test real payment flow
