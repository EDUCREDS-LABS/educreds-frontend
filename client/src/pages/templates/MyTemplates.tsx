import React, { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Link } from 'wouter';
import { deleteTemplate } from '@/lib/templates-api';

const MyTemplatesPage = () => {
  const { templates, loadTemplates } = useEditorStore();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(id);
        loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        // Handle error, e.g., show a toast notification
      }
    }
  };

  return (
    <div>
      <h1>My Templates</h1>
      <ul>
        {templates.map((template) => (
          <li key={template.id}>
            <Link href={`/institution/templates/designer?templateId=${template.id}`}>
              {template.name}
            </Link>
            <button onClick={() => handleDelete(template.id!)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyTemplatesPage;
