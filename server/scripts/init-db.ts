import { db } from '../lib/db';
import { TemplateService } from '../services/template-service';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Initialize default templates
    await TemplateService.initializeDefaultTemplates();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}
