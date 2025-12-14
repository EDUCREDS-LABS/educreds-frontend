import { db } from '../lib/db';
import { templates, templateVariants, issuedCertificates } from '../../shared/schema/templates';
import { defaultTemplates } from '../../shared/templates/default-templates';
import { Template, TemplateVariant, IssuedCertificate, CertificateData } from '../../shared/types/template';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Define customizations interface
interface TemplateCustomizations {
  primaryColor?: string;
  secondaryColor?: string;
}

export class TemplateService {
  // Initialize default templates in database
  static async initializeDefaultTemplates() {
    try {
      console.log('Starting to initialize default templates...');
      console.log('Number of default templates:', defaultTemplates.length);
      
      for (const template of defaultTemplates) {
        console.log('Processing template:', template.metadata.name);
        console.log('Template fields:', template.metadata.fields);
        const existing = await db.select().from(templates).where({ id: template.metadata.id });
        console.log('Existing templates found:', existing.length);
        
        if (existing.length === 0) {
          console.log('Inserting template:', template.metadata.name);
          const insertResult = await db.insert(templates).values({
            id: template.metadata.id,
            name: template.metadata.name,
            category: template.metadata.category,
            description: template.metadata.description,
            fields: template.metadata.fields,
            design: template.design,
            previewImage: template.metadata.previewImage,
            createdAt: template.metadata.createdAt,
            updatedAt: template.metadata.updatedAt,
          });
          console.log('Insert result:', insertResult);
        } else {
          console.log('Template already exists:', template.metadata.name);
        }
      }
      console.log('Default templates initialized successfully');
    } catch (error) {
      console.error('Error initializing default templates:', error);
      throw error;
    }
  }

  // Get all templates
  static async getAllTemplates(): Promise<Template[]> {
    try {
      console.log('Getting all templates from database...');
      const dbTemplates = await db.select().from(templates);
      console.log('Raw dbTemplates:', JSON.stringify(dbTemplates, null, 2));
      console.log('Type of dbTemplates:', typeof dbTemplates);
      console.log('Is Array:', Array.isArray(dbTemplates));
      console.log('Length:', Array.isArray(dbTemplates) ? dbTemplates.length : 'N/A');
      
      // Ensure we have an array and handle the case properly
      if (!Array.isArray(dbTemplates)) {
        console.log('dbTemplates is not an array, returning empty array');
        return [];
      }
      
      return dbTemplates.map(dbTemplate => {
        console.log('Processing template in array:', dbTemplate);
        return {
          metadata: {
            id: dbTemplate.id,
            name: dbTemplate.name,
            category: dbTemplate.category as any,
            description: dbTemplate.description,
            fields: dbTemplate.fields as any,
            previewImage: dbTemplate.previewImage,
            createdAt: dbTemplate.createdAt,
            updatedAt: dbTemplate.updatedAt,
          },
          design: dbTemplate.design,
        };
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  // Get template by ID
  static async getTemplateById(id: string): Promise<Template | null> {
    try {
      const [dbTemplate] = await db.select().from(templates).where({ id });
      
      if (!dbTemplate) return null;

      return {
        metadata: {
          id: dbTemplate.id,
          name: dbTemplate.name,
          category: dbTemplate.category as any,
          description: dbTemplate.description,
          fields: dbTemplate.fields as any,
          previewImage: dbTemplate.previewImage,
          createdAt: dbTemplate.createdAt,
          updatedAt: dbTemplate.updatedAt,
        },
        design: dbTemplate.design,
      };
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  // Get templates by category
  static async getTemplatesByCategory(category: string): Promise<Template[]> {
    try {
      const dbTemplates = await db.select().from(templates).where({ category });
      return dbTemplates.map(dbTemplate => ({
        metadata: {
          id: dbTemplate.id,
          name: dbTemplate.name,
          category: dbTemplate.category as any,
          description: dbTemplate.description,
          fields: dbTemplate.fields as any,
          previewImage: dbTemplate.previewImage,
          createdAt: dbTemplate.createdAt,
          updatedAt: dbTemplate.updatedAt,
        },
        design: dbTemplate.design,
      }));
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      throw error;
    }
  }

  // Create template variant
  static async createTemplateVariant(
    templateId: string,
    institutionId: string,
    name: string,
    customizations: any
  ): Promise<TemplateVariant> {
    try {
      const [variant] = await db.insert(templateVariants).values({
        templateId,
        institutionId,
        name,
        customizations,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return {
        id: variant.id,
        templateId: variant.templateId,
        institutionId: variant.institutionId,
        name: variant.name,
        customizations: variant.customizations as any,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      };
    } catch (error) {
      console.error('Error creating template variant:', error);
      throw error;
    }
  }

  // Get institution variants
  static async getInstitutionVariants(institutionId: string): Promise<TemplateVariant[]> {
    try {
      const variants = await db.select().from(templateVariants).where({ institutionId });
      return variants.map(variant => ({
        id: variant.id,
        templateId: variant.templateId,
        institutionId: variant.institutionId,
        name: variant.name,
        customizations: variant.customizations as any,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching institution variants:', error);
      throw error;
    }
  }

  // Render certificate with data
  static async renderCertificate(
    templateId: string,
    variantId: string | null,
    data: CertificateData
  ): Promise<string> {
    try {
      // Get template
      const template = await this.getTemplateById(templateId);
      if (!template) throw new Error('Template not found');

      // Get variant if specified
      let customizations: TemplateCustomizations = {};
      if (variantId) {
        const [variant] = await db.select().from(templateVariants).where({ id: variantId });
        if (variant) {
          customizations = variant.customizations as TemplateCustomizations;
        }
      }

      // Replace placeholders in design
      let renderedDesign = template.design;
      
      // Replace data placeholders
      Object.entries(data).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        renderedDesign = renderedDesign.replace(new RegExp(placeholder, 'g'), value);
      });

      // Apply customizations
      if (customizations.primaryColor) {
        renderedDesign = renderedDesign.replace(/#1e40af/g, customizations.primaryColor);
      }
      if (customizations.secondaryColor) {
        renderedDesign = renderedDesign.replace(/#3b82f6/g, customizations.secondaryColor);
      }

      // Generate QR code
      const verifyUrl = `https://verify.educreds.xyz/c/${data.certificateId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);

      // Replace QR placeholder with actual QR code
      renderedDesign = renderedDesign.replace(
        /<rect x="650" y="500" width="80" height="80"[^>]*>[\s\S]*?<\/rect>/,
        `<image x="650" y="500" width="80" height="80" href="${qrCodeDataUrl}"/>`
      );

      return renderedDesign;
    } catch (error) {
      console.error('Error rendering certificate:', error);
      throw error;
    }
  }

  // Issue certificate
  static async issueCertificate(
    templateId: string,
    variantId: string | null,
    institutionId: string,
    data: CertificateData
  ): Promise<IssuedCertificate> {
    try {
      // Render certificate
      const renderedCertificate = await this.renderCertificate(templateId, variantId, data);
      
      // Generate hash
      const certificateHash = crypto.createHash('sha256').update(renderedCertificate).digest('hex');
      
      // Store in database
      const [issuedCert] = await db.insert(issuedCertificates).values({
        templateId,
        variantId,
        institutionId,
        data,
        certificateHash,
        issuedAt: new Date(),
        status: 'issued',
      }).returning();

      return {
        id: issuedCert.id,
        templateId: issuedCert.templateId,
        variantId: issuedCert.variantId,
        institutionId: issuedCert.institutionId,
        data: issuedCert.data as any,
        certificateHash: issuedCert.certificateHash,
        blockchainTxHash: issuedCert.blockchainTxHash,
        issuedAt: issuedCert.issuedAt,
        status: issuedCert.status as any,
      };
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  // Verify certificate
  static async verifyCertificate(certificateId: string): Promise<{
    isValid: boolean;
    certificate?: IssuedCertificate;
    template?: Template;
  }> {
    try {
      const [certificate] = await db.select().from(issuedCertificates).where({ id: certificateId });
      
      if (!certificate) {
        return { isValid: false };
      }

      const template = await this.getTemplateById(certificate.templateId);
      
      return {
        isValid: true,
        certificate: {
          id: certificate.id,
          templateId: certificate.templateId,
          variantId: certificate.variantId,
          institutionId: certificate.institutionId,
          data: certificate.data as any,
          certificateHash: certificate.certificateHash,
          blockchainTxHash: certificate.blockchainTxHash,
          issuedAt: certificate.issuedAt,
          status: certificate.status as any,
        },
        template: template ?? undefined,
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }
}
