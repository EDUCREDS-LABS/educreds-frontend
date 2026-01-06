# EduCreds Marketplace - Deployment Guide

## 🚀 Quick Start

### 1. Database Setup
```bash
# Connect to PostgreSQL
psql -U postgres -d your_database

# Run marketplace schema
\i cert_backend/marketplace_schema.sql
```

### 2. Backend Setup (cert_backend)
```bash
cd cert_backend
npm install

# Add to .env
echo "DB_NAME=educreds_marketplace" >> .env
echo "PORT=3001" >> .env

# Start backend
npm run start:dev
```

### 3. Frontend Setup (Educreds-frontend)
```bash
cd Educreds-frontend
npm install

# Add to .env
echo "VITE_CERT_API_BASE=http://localhost:3001" >> .env

# Start frontend
npm run dev
```

## 📍 Access Points

- **Certificate Marketplace**: http://localhost:5173/cert-marketplace
- **Designer Tools**: http://localhost:5173/cert-designer  
- **Institution Library**: http://localhost:5173/template-library
- **API Docs**: http://localhost:3001/marketplace

## 🔧 Configuration

### Environment Variables
```bash
# cert_backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=educreds_marketplace
PORT=3001

# Educreds-frontend/.env
VITE_CERT_API_BASE=http://localhost:3001
```

### Database Schema
- `marketplace_templates` - Designer templates
- `institution_templates` - Purchased templates
- `template_usage` - Certificate issuance tracking

## 🎯 Testing

### 1. Test Marketplace
- Visit `/cert-marketplace`
- Browse EduCreds-compatible templates
- Filter by category and price

### 2. Test Designer Tools
- Visit `/cert-designer`
- Create certificate template
- Publish to marketplace

### 3. Test Institution Flow
- Visit `/template-library`
- Purchase template from marketplace
- Issue certificate using template

## 📊 Business Metrics

### Revenue Tracking
- Template sales: 70% designer, 30% platform
- Monthly recurring revenue from subscriptions
- Usage analytics per template

### Performance Metrics
- Template conversion rates
- Designer engagement
- Institution adoption

## 🔒 Security

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- Authentication for sensitive operations

### Data Protection
- Encrypted template storage
- Secure payment processing
- GDPR compliance for user data

## 🚀 Production Deployment

### Docker Setup
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run db:migrate
```

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
DB_SSL=true
REDIS_URL=redis://localhost:6379
```

## 📈 Scaling

### Database Optimization
- Index on frequently queried fields
- Connection pooling
- Read replicas for analytics

### Caching Strategy
- Redis for template metadata
- CDN for template assets
- Browser caching for static content

## 🔍 Monitoring

### Health Checks
- `/api/health` - Service status
- Database connectivity
- External service dependencies

### Analytics
- Template usage metrics
- Revenue tracking
- Performance monitoring

## 🆘 Troubleshooting

### Common Issues
1. **Database Connection**: Check PostgreSQL service and credentials
2. **API Errors**: Verify backend is running on port 3001
3. **Template Loading**: Check CORS settings and API endpoints

### Debug Mode
```bash
# Enable debug logging
DEBUG=marketplace:* npm run dev
```

## ✅ Deployment Checklist

- [ ] Database schema migrated
- [ ] Environment variables configured
- [ ] Backend service running
- [ ] Frontend service running
- [ ] API endpoints responding
- [ ] Template marketplace accessible
- [ ] Designer tools functional
- [ ] Institution library working
- [ ] Certificate issuance integrated

**Status: READY FOR PRODUCTION** 🎉