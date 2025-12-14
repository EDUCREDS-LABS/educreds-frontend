# EduCreds Template System

This document describes the implementation of the EduCreds Template System, which provides a comprehensive solution for creating, customizing, and issuing professional certificates.

## Overview

The Template System allows institutions to:
- Choose from pre-designed certificate templates
- Customize templates with their branding
- Issue certificates with dynamic data binding
- Verify certificate authenticity
- Download certificates in multiple formats

## Architecture

### 1. Template Structure

Templates are defined using SVG/HTML with placeholder variables:
- **Design**: SVG content with placeholders like `{{studentName}}`
- **Metadata**: Template information, fields, and preview images
- **Variants**: Institution-specific customizations

### 2. Database Schema

```sql
-- Templates table
templates (
  id, name, category, description, fields, design, preview_image, created_at, updated_at
)

-- Template variants for institution customizations
template_variants (
  id, template_id, institution_id, name, customizations, created_at, updated_at
)

-- Issued certificates
issued_certificates (
  id, template_id, variant_id, institution_id, data, certificate_hash, blockchain_tx_hash, issued_at, status
)
```

### 3. API Endpoints

#### Template Management
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get template details
- `GET /api/templates/category/:category` - Filter by category

#### Institution Customization
- `POST /api/institutions/:id/variants` - Create template variant
- `GET /api/institutions/:id/variants` - Get institution variants

#### Certificate Operations
- `POST /api/certificates/issue` - Issue new certificate
- `GET /api/certificates/:id/render` - Render certificate
- `GET /api/verify` - Verify certificate authenticity

## Default Templates

The system includes 5 professionally designed templates:

1. **Academic Classic** - Traditional academic certificates
2. **Training Modern** - Corporate training certificates
3. **Corporate Award** - Prestigious awards and recognition
4. **Hackathon Badge** - Tech events and bootcamps
5. **Workshop Minimal** - Clean workshop certificates

## Features

### Sprint 1 ✅ (Completed)
- [x] Template storage & preview system
- [x] 5 default templates with SVG designs
- [x] Template gallery with category filtering
- [x] Dynamic form generation based on template fields
- [x] Certificate issuance pipeline
- [x] QR code generation for verification
- [x] Certificate verification system
- [x] Download certificates as SVG

### Sprint 2 🔄 (In Progress)
- [ ] Institution customization (logo, colors)
- [ ] Template variant management
- [ ] Enhanced certificate rendering
- [ ] PDF export functionality

### Sprint 3 📋 (Planned)
- [ ] On-chain anchoring with Base chain
- [ ] Blockchain verification
- [ ] Bulk issuance (CSV upload)
- [ ] Advanced template editor

## Usage

### For Institutions

1. **Browse Templates**
   ```
   GET /api/templates
   ```

2. **Create Custom Variant**
   ```json
   POST /api/institutions/{id}/variants
   {
     "templateId": "academic-classic",
     "name": "Our University Variant",
     "customizations": {
       "primaryColor": "#1e40af",
       "logo": "data:image/png;base64,..."
     }
   }
   ```

3. **Issue Certificate**
   ```json
   POST /api/certificates/issue
   {
     "templateId": "academic-classic",
     "variantId": "optional-variant-id",
     "institutionId": "institution-id",
     "data": {
       "studentName": "John Doe",
       "courseTitle": "Computer Science",
       "institutionName": "University of Technology",
       "issueDate": "2024-01-15",
       "certificateId": "CERT-1234567890-abc123"
     }
   }
   ```

### For Verification

1. **Verify Certificate**
   ```
   GET /api/verify?certId=CERT-1234567890-abc123
   ```

2. **Download Certificate**
   ```
   GET /api/certificates/{id}/render
   ```

## Development

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize database:
   ```bash
   npm run db:push
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Adding New Templates

1. Create template definition in `shared/templates/default-templates.ts`
2. Design SVG with placeholders
3. Define required fields
4. Add to default templates array

### Customization Options

Institutions can customize:
- **Colors**: Primary and secondary colors
- **Logo**: Institution logo placement
- **Fonts**: Typography choices
- **Signatories**: Authorized signatures
- **Layout**: Position adjustments

## Security

- Certificate hashing for integrity verification
- QR codes link to verification URLs
- Blockchain anchoring for tamper-proof records
- Role-based access control

## Performance

- SVG-based rendering for scalability
- Database indexing on certificate IDs
- Caching for template metadata
- Optimized QR code generation

## Future Enhancements

- Template marketplace
- Drag-and-drop editor
- NFT-gated templates
- Advanced analytics
- Multi-language support
- Mobile-optimized certificates

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure responsive design
5. Test across browsers

## License

MIT License - see LICENSE file for details
