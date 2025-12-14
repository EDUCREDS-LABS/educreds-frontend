export interface TemplateField {
  name: string;
  type: 'text' | 'date' | 'number' | 'image';
  required: boolean;
  placeholder: string;
  defaultValue?: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  category: 'academic' | 'training' | 'corporate' | 'hackathon' | 'workshop';
  description: string;
  fields: TemplateField[];
  previewImage: string;
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariant {
  id: string;
  templateId: string;
  institutionId: string;
  name: string;
  customizations: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    signatories?: Array<{
      name: string;
      title: string;
      signature?: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  metadata: TemplateMetadata;
  design: string; // SVG or HTML content
  variants?: TemplateVariant[];
}

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  institutionName: string;
  issueDate: string;
  certificateId: string;
  [key: string]: string; // Additional dynamic fields
}

export interface IssuedCertificate {
  id: string;
  templateId: string;
  variantId?: string;
  institutionId: string;
  data: CertificateData;
  certificateHash: string;
  blockchainTxHash?: string;
  issuedAt: Date;
  status: 'issued' | 'pending' | 'failed';
}
