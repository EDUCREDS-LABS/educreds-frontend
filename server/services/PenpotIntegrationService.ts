import axios, { AxiosInstance } from 'axios';
import { Template } from '../../shared/types/template';

export interface PenpotFile {
  id: string;
  name: string;
  projectId: string;
  data: any;
  thumbnailUrl?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface PenpotProject {
  id: string;
  name: string;
  teamId: string;
  files: PenpotFile[];
}

export interface CertificateData {
  [key: string]: string | number | Date;
}

export class PenpotIntegrationService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Get all projects accessible to the authenticated user
   */
  async getProjects(): Promise<PenpotProject[]> {
    try {
      const response = await this.client.get('/api/rpc/command/get-projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching Penpot projects:', error);
      throw new Error('Failed to fetch projects from Penpot');
    }
  }

  /**
   * Get files from a specific project
   */
  async getProjectFiles(projectId: string): Promise<PenpotFile[]> {
    try {
      const response = await this.client.get(`/api/rpc/command/get-project-files`, {
        params: { projectId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching project files:', error);
      throw new Error('Failed to fetch project files from Penpot');
    }
  }

  /**
   * Get a specific file with its design data
   */
  async getFile(fileId: string): Promise<PenpotFile> {
    try {
      const response = await this.client.get(`/api/rpc/command/get-file`, {
        params: { fileId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw new Error('Failed to fetch file from Penpot');
    }
  }

  /**
   * Create a new file in Penpot from template data
   */
  async createFileFromTemplate(projectId: string, templateName: string, templateData: any): Promise<PenpotFile> {
    try {
      const response = await this.client.post('/api/rpc/command/create-file', {
        projectId,
        name: templateName,
        data: templateData
      });
      return response.data;
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error('Failed to create file in Penpot');
    }
  }

  /**
   * Export a file as SVG with dynamic data injection
   */
  async exportFileAsSvg(fileId: string, certificateData?: CertificateData): Promise<string> {
    try {
      // Get the file data
      const file = await this.getFile(fileId);
      
      // If certificate data is provided, inject it into the design
      let exportData = file.data;
      if (certificateData) {
        exportData = this.injectCertificateData(file.data, certificateData);
      }

      // Export as SVG
      const response = await this.client.post('/api/rpc/command/export-svg', {
        fileId,
        data: exportData
      });

      return response.data.svg;
    } catch (error) {
      console.error('Error exporting SVG:', error);
      throw new Error('Failed to export SVG from Penpot');
    }
  }

  /**
   * Get file thumbnail URL
   */
  async getFileThumbnail(fileId: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/rpc/command/get-file-thumbnail`, {
        params: { fileId }
      });
      return response.data.thumbnailUrl;
    } catch (error) {
      console.error('Error fetching thumbnail:', error);
      throw new Error('Failed to fetch thumbnail from Penpot');
    }
  }

  /**
   * Convert Penpot file to EduCreds template format
   */
  async convertToTemplate(penpotFile: PenpotFile): Promise<Partial<Template>> {
    try {
      // Extract certificate fields from Penpot file data
      const fields = this.extractCertificateFields(penpotFile.data);
      
      // Get thumbnail
      const thumbnailUrl = await this.getFileThumbnail(penpotFile.id);

      return {
        metadata: {
          id: `penpot-${penpotFile.id}`,
          name: penpotFile.name,
          category: 'penpot-template',
          description: `Professional template created with Penpot`,
          fields,
          previewImage: thumbnailUrl,
          createdAt: new Date(penpotFile.createdAt),
          updatedAt: new Date(penpotFile.modifiedAt),
        },
        design: await this.exportFileAsSvg(penpotFile.id),
        penpotFileId: penpotFile.id,
        penpotProjectId: penpotFile.projectId,
      };
    } catch (error) {
      console.error('Error converting to template:', error);
      throw new Error('Failed to convert Penpot file to template');
    }
  }

  /**
   * Sync templates from Penpot project
   */
  async syncTemplatesFromProject(projectId: string): Promise<Partial<Template>[]> {
    try {
      const files = await this.getProjectFiles(projectId);
      const templates: Partial<Template>[] = [];

      for (const file of files) {
        try {
          const template = await this.convertToTemplate(file);
          templates.push(template);
        } catch (error) {
          console.error(`Failed to convert file ${file.id}:`, error);
          // Continue with other files
        }
      }

      return templates;
    } catch (error) {
      console.error('Error syncing templates:', error);
      throw new Error('Failed to sync templates from Penpot');
    }
  }

  /**
   * Create SSO token for Penpot access
   */
  async createSSOToken(userId: string, userEmail: string): Promise<string> {
    try {
      const response = await this.client.post('/api/rpc/command/create-sso-token', {
        userId,
        email: userEmail,
        expiresIn: 3600 // 1 hour
      });
      return response.data.token;
    } catch (error) {
      console.error('Error creating SSO token:', error);
      throw new Error('Failed to create SSO token for Penpot');
    }
  }

  /**
   * Extract certificate fields from Penpot design data
   */
  private extractCertificateFields(designData: any): Array<{ name: string; type: string; required: boolean; placeholder: string }> {
    const fields: Array<{ name: string; type: string; required: boolean; placeholder: string }> = [];
    
    // This is a simplified implementation
    // In practice, you'd need to traverse the Penpot design tree
    // and identify text elements marked as dynamic fields
    
    if (designData && designData.pages) {
      for (const page of designData.pages) {
        if (page.objects) {
          this.traverseObjects(page.objects, fields);
        }
      }
    }

    // Add default fields if none found
    if (fields.length === 0) {
      fields.push(
        { name: 'studentName', type: 'text', required: true, placeholder: 'Student Name' },
        { name: 'courseTitle', type: 'text', required: true, placeholder: 'Course Title' },
        { name: 'institutionName', type: 'text', required: true, placeholder: 'Institution Name' },
        { name: 'issueDate', type: 'date', required: true, placeholder: 'Issue Date' },
        { name: 'certificateId', type: 'text', required: true, placeholder: 'Certificate ID' }
      );
    }

    return fields;
  }

  /**
   * Traverse Penpot objects to find dynamic fields
   */
  private traverseObjects(objects: any, fields: Array<{ name: string; type: string; required: boolean; placeholder: string }>) {
    for (const [id, obj] of Object.entries(objects as Record<string, any>)) {
      if (obj.type === 'text' && obj.content) {
        // Look for placeholder patterns like {{fieldName}}
        const matches = obj.content.match(/\{\{(\w+)\}\}/g);
        if (matches) {
          for (const match of matches) {
            const fieldName = match.replace(/[{}]/g, '');
            if (!fields.find(f => f.name === fieldName)) {
              fields.push({
                name: fieldName,
                type: this.inferFieldType(fieldName),
                required: true,
                placeholder: this.generatePlaceholder(fieldName)
              });
            }
          }
        }
      }
    }
  }

  /**
   * Infer field type from field name
   */
  private inferFieldType(fieldName: string): string {
    const lowerName = fieldName.toLowerCase();
    if (lowerName.includes('date')) return 'date';
    if (lowerName.includes('score') || lowerName.includes('grade') || lowerName.includes('number')) return 'number';
    return 'text';
  }

  /**
   * Generate placeholder text from field name
   */
  private generatePlaceholder(fieldName: string): string {
    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Inject certificate data into Penpot design
   */
  private injectCertificateData(designData: any, certificateData: CertificateData): any {
    // Deep clone the design data
    const injectedData = JSON.parse(JSON.stringify(designData));
    
    // Traverse and replace placeholders
    if (injectedData.pages) {
      for (const page of injectedData.pages) {
        if (page.objects) {
          this.injectDataIntoObjects(page.objects, certificateData);
        }
      }
    }

    return injectedData;
  }

  /**
   * Inject data into Penpot objects
   */
  private injectDataIntoObjects(objects: any, certificateData: CertificateData) {
    for (const [id, obj] of Object.entries(objects as Record<string, any>)) {
      if (obj.type === 'text' && obj.content) {
        // Replace placeholders with actual data
        let content = obj.content;
        for (const [key, value] of Object.entries(certificateData)) {
          const placeholder = `{{${key}}}`;
          if (content.includes(placeholder)) {
            content = content.replace(new RegExp(placeholder, 'g'), String(value));
          }
        }
        obj.content = content;
      }
    }
  }

  /**
   * Health check for Penpot service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health');
      return response.status === 200;
    } catch (error) {
      console.error('Penpot health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const penpotService = new PenpotIntegrationService(
  process.env.PENPOT_API_URL || 'http://localhost:6060',
  process.env.PENPOT_API_TOKEN || ''
);