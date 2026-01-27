# Quick Reference - GHL Onboarding Agent API

One-page reference for developers working with the API.

## 🔗 Base URL

```
Development: http://localhost:3000/api
Production:  https://yourapp.com/api
```

## 🔑 Authentication

All endpoints (except `/health`) require JWT Bearer token:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📋 All Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/form/submit` | POST | ✅ | Save/submit form |
| `/form/{id}` | GET | ✅ | Get form by ID |
| `/form/{id}` | DELETE | ✅ | Delete form (drafts only) |
| `/form/{id}/stage/{n}` | PUT | ✅ | Update stage |
| `/form/{id}/stage/{n}` | GET | ✅ | Get stage |
| `/form/list` | GET | ✅ | List all forms |
| `/implementation/start` | POST | ✅ | Start implementation |
| `/implementation/{id}` | GET | ✅ | Get status + logs |
| `/implementation/{id}/progress` | GET | ✅ | Get progress only |
| `/implementation/{id}/cancel` | POST | ✅ | Cancel implementation |
| `/auth/ghl/authorize` | GET | ✅ | Start OAuth |
| `/auth/ghl/callback` | GET | ❌ | OAuth callback (GHL) |
| `/auth/ghl/disconnect` | POST | ✅ | Disconnect GHL |
| `/auth/ghl/status` | GET | ✅ | Check connection |
| `/user/me` | GET | ✅ | Get profile |
| `/user/me` | PUT | ✅ | Update profile |
| `/organization` | GET | ✅ | Get org |
| `/organization` | PUT | ✅ | Update org |
| `/health` | GET | ❌ | Health check |
| `/metrics` | GET | ✅ | App metrics |

## 🔢 Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description",
    "details": { ... }
  }
}
```

## 🚦 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

## 🛡️ Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Default | 100/min |
| Auth | 10/min |
| Form | 50/min |
| Implementation | 20/min |
| Health | 200/min |
| Progress | 60/min |

## 📝 Common Requests

### Create Form Submission
```bash
curl -X POST /api/form/submit \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage_number": 1,
    "stage_data": { ... }
  }'
```

### Get Implementation Progress
```bash
curl /api/implementation/{id}/progress \
  -H "Authorization: Bearer TOKEN"
```

### Check Health
```bash
curl /api/health
```

## 🔧 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_GHL_CLIENT_ID=xxx
GHL_CLIENT_SECRET=xxx
GHL_REDIRECT_URI=https://yourapp.com/api/auth/ghl/callback
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token is valid |
| 429 Rate Limited | Wait or increase limits |
| 500 Server Error | Check Supabase connection |
| CORS Error | Add domain to allowed origins |
| OAuth Failed | Verify redirect URI matches exactly |

## 📦 Project Structure

```
app/api/
├── form/
│   ├── submit/
│   ├── [formId]/
│   ├── [formId]/stage/[stageNumber]/
│   └── list/
├── implementation/
│   ├── start/
│   └── [implementationId]/
│       ├── progress/
│       └── cancel/
├── auth/ghl/
│   ├── authorize/
│   ├── callback/
│   ├── disconnect/
│   └── status/
├── user/me/
├── organization/
├── health/
└── metrics/
```

## 🧪 Test Commands

```bash
# Health check
curl http://localhost:3000/api/health

# Get user (replace TOKEN)
curl http://localhost:3000/api/user/me \
  -H "Authorization: Bearer TOKEN"

# Submit form
curl -X POST http://localhost:3000/api/form/submit \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage_number": 1, "stage_data": {...}}'
```

## 📚 Documentation Files

- **README.md** - Getting started
- **API-DOCUMENTATION.md** - Complete API reference
- **DEPLOYMENT-GUIDE.md** - Production deployment
- **IMPLEMENTATION-SUMMARY.md** - What's included
- **QUICK-REFERENCE.md** - This file

## 🎯 Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp env.example .env.local
# Edit .env.local

# 3. Run
npm run dev

# 4. Test
curl http://localhost:3000/api/health
```

## 🔐 Security Checklist

- [ ] RLS enabled on all tables
- [ ] JWT validation on protected routes
- [ ] Input validation with Zod
- [ ] Rate limiting configured
- [ ] Service role key secured
- [ ] HTTPS in production
- [ ] CORS configured
- [ ] Error messages sanitized

## 📊 Key Files

| File | Purpose |
|------|---------|
| `types/api.ts` | Types & schemas |
| `lib/auth.ts` | Authentication |
| `lib/errors.ts` | Error handling |
| `lib/supabase.ts` | Database client |
| `lib/middleware/rate-limit.ts` | Rate limiting |

## 🚀 Deploy to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel
# Import from GitHub

# 3. Add Environment Variables
# Paste from .env.local

# 4. Deploy
# Click Deploy button
```

## 💡 Tips

- Use `/progress` endpoint for polling (lighter)
- Use `/implementation/{id}` for full details
- Enable real-time subscriptions for live updates
- Cache GHL auth status to reduce calls
- Use service role key only server-side
- Monitor `/health` endpoint for uptime
- Review `/metrics` for usage patterns

## 🆘 Need Help?

1. **Check docs**: API-DOCUMENTATION.md
2. **Deployment issues**: DEPLOYMENT-GUIDE.md
3. **Understanding code**: IMPLEMENTATION-SUMMARY.md
4. **Quick answers**: This file

## 📞 Support

- GitHub Issues: [your-repo/issues]
- Email: support@yourapp.com
- Docs: https://docs.yourapp.com

---

**Keep this handy while developing! 📌**
