// Mock database for development
import { defaultTemplates } from '../../shared/templates/default-templates';

// In-memory storage
const templates: any[] = [];
const templateVariants: any[] = [];
const issuedCertificates: any[] = [];
const bulkJobs: any[] = [];
const bulkJobItems: any[] = [];

// Don't auto-initialize here - let the service handle it
console.log('Mock database initialized (templates will be loaded by service)');

// Mock database interface that matches Drizzle ORM API
export const db = {
  select: () => ({
    from: (table: any) => ({
      where: (condition?: any) => {
        // Simple mock implementation
        if (table.tableName === 'templates') {
          console.log('Querying templates table with condition:', condition);
          if (condition && condition.id) {
            const result = templates.filter(t => t.id === condition.id);
            console.log('Found templates by ID:', result.length);
            return result;
          }
          if (condition && condition.category) {
            const result = templates.filter(t => t.category === condition.category);
            console.log('Found templates by category:', result.length);
            return result;
          }
          console.log('Returning all templates:', templates.length);
          return templates;
        }
        if (table.tableName === 'template_variants') {
          if (condition && condition.institutionId) {
            return templateVariants.filter(t => t.institutionId === condition.institutionId);
          }
          if (condition && condition.id) {
            return templateVariants.filter(t => t.id === condition.id);
          }
          return templateVariants;
        }
        if (table.tableName === 'issued_certificates') {
          if (condition && condition.id) {
            return issuedCertificates.filter(t => t.id === condition.id);
          }
          return issuedCertificates;
        }
        if (table.tableName === 'bulk_jobs') {
          if (condition && condition.id) {
            return bulkJobs.filter(t => t.id === condition.id);
          }
          return bulkJobs;
        }
        if (table.tableName === 'bulk_job_items') {
          if (condition && condition.jobId) {
            return bulkJobItems.filter(t => t.jobId === condition.jobId);
          }
          return bulkJobItems;
        }
        return [];
      }
    })
  }),
  
  insert: (table: any) => ({
    values: (data: any) => {
      const id = Math.random().toString(36).substr(2, 9);
      const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      
      if (table.tableName === 'templates') {
        templates.push(record);
      } else if (table.tableName === 'template_variants') {
        templateVariants.push(record);
      } else if (table.tableName === 'issued_certificates') {
        issuedCertificates.push(record);
      } else if (table.tableName === 'bulk_jobs') {
        bulkJobs.push(record);
      } else if (table.tableName === 'bulk_job_items') {
        bulkJobItems.push(record);
      }
      
      return {
        returning: () => [record]
      };
    }
  }),

  update: (table: any) => ({
    set: (data: any) => ({
      where: (condition: any) => {
        if (table.tableName === 'bulk_jobs') {
          const index = bulkJobs.findIndex(job => job.id === condition.id);
          if (index !== -1) {
            bulkJobs[index] = { ...bulkJobs[index], ...data, updatedAt: new Date() };
          }
        }
        return Promise.resolve();
      }
    })
  })
};

export default db;
