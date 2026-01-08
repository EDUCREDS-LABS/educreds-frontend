import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { DesignCanvas } from '@/components/editor/DesignCanvas';
import { EnhancedTemplate } from '@/store/editorStore';
import { getTemplateById } from '@/lib/templates-api';

const TemplateDesignerPage = () => {
  const [templateData, setTemplateData] = useState<EnhancedTemplate | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateId = params.get('templateId');

    if (templateId) {
      const fetchTemplate = async () => {
        try {
          const template = await getTemplateById(templateId);
          setTemplateData(template);
        } catch (error) {
          console.error('Error fetching template:', error);
          // Handle error, e.g., show a toast notification
        }
      };
      fetchTemplate();
    } else {
      setTemplateData({
        name: 'New Template',
        description: 'A new template created from the designer',
        htmlContent: '',
        cssContent: '',
        placeholders: [],
        tags: [],
      });
    }
  }, [location.search]);

  const handleSave = (data: any) => {
    console.log('Template saved:', data);
    setTemplateData(data);
  };

  if (!templateData) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <DesignCanvas template={templateData} onSave={handleSave} />
    </div>
  );
};

export default TemplateDesignerPage;
