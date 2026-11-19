// Compat: template/mapping types inlined after template service removal
type Template = { id: string; name: string; fields?: Array<{ key: string; label: string; type: string }>; fieldMappings?: FieldMapping[] };
type FieldMapping = { sourceField: string; targetField: string; transform?: string; transformation?: string; defaultValue?: string };
const listTemplates = async (): Promise<Template[]> => [];
const getTemplateById = async (id: string): Promise<Template | null> => null;
const updateTemplateMappings = async (_templateId: string, _mappings: FieldMapping[]): Promise<void> => {};
const EduCredsCanonicalSchema = [
  { key: 'studentName', label: 'Student Name', type: 'string' },
  { key: 'courseName', label: 'Course/Program', type: 'string' },
  { key: 'grade', label: 'Grade', type: 'string' },
  { key: 'completionDate', label: 'Completion Date', type: 'date' },
  { key: 'studentEmail', label: 'Student Email', type: 'string' },
  { key: 'studentId', label: 'Student ID', type: 'string' },
];

// educreds-frontend/src/modules/integration/DataMappingPage.tsx
import React, { Suspense, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/modern/ErrorBoundary';
import { Skeleton } from '@/components/ui/loading-skeleton';

import { useAuth } from '@/hooks/useAuth';

const DataMappingForm: React.FC = () => {
  const { user } = useAuth();
  const institutionId = user?.id || '';
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentMappings, setCurrentMappings] = useState<FieldMapping[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Fetch the list of templates
  const { data: templates, isLoading: isLoadingTemplates, error: templatesError } = useQuery<Template[], Error>({
    queryKey: ['templates', institutionId],
    queryFn: () => listTemplates(),
    enabled: Boolean(institutionId),
  });

  // Set the first template as selected by default when data loads (react-query v5: no onSuccess)
  useEffect(() => {
    if (!selectedTemplateId && templates && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // 2. Fetch the details of the selected template (dependent query)
  const { data: selectedTemplate, isLoading: isLoadingTemplateDetails } = useQuery<Template | null, Error>({
    queryKey: ['templateDetails', selectedTemplateId],
    queryFn: () => getTemplateById(selectedTemplateId),
    enabled: !!selectedTemplateId, // Only run this query if a template is selected
  });

  // 3. Update local state for mappings when a new template is fetched
  useEffect(() => {
    if (selectedTemplate) {
      setCurrentMappings(selectedTemplate.fieldMappings || []);
    }
  }, [selectedTemplate]);

  // 4. Mutation for updating the mappings
  const { mutate: saveMappings, isPending: isSaving, error: saveError } = useMutation({
    mutationFn: ({ templateId, mappings }: { templateId: string; mappings: FieldMapping[] }) => updateTemplateMappings(templateId, mappings),
    onSuccess: () => {
      setSuccess('Mappings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['templateDetails', selectedTemplateId] });
      queryClient.invalidateQueries({ queryKey: ['templates', institutionId] });
    },
  });

  const handleMappingChange = (index: number, field: keyof FieldMapping, value: string) => {
    const updatedMappings = [...currentMappings];
    updatedMappings[index] = { ...updatedMappings[index], [field]: value };
    setCurrentMappings(updatedMappings);
  };

  const addMapping = () => {
    setCurrentMappings([...currentMappings, { sourceField: '', targetField: '' }]);
  };

  const removeMapping = (index: number) => {
    setCurrentMappings(currentMappings.filter((_, i) => i !== index));
  };

  const handleSubmitMappings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;
    setSuccess(null); // Clear previous success messages
    saveMappings({ templateId: selectedTemplateId, mappings: currentMappings });
  };
  
  const anyError = templatesError || saveError;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Data Mapping Configuration</h2>
      <p className="text-gray-700">Define how fields from your external data sources map to the EduCreds credential schema for automated issuance.</p>
      {!institutionId && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <p>Unable to resolve institution context from your authenticated session.</p>
        </div>
      )}

      {anyError && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <p>Error: {anyError.message}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg">
          <p>{success}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Select Template</h3>
        {isLoadingTemplates ? (
          <Skeleton className="h-10 w-full" />
        ) : !templates || templates.length === 0 ? (
          <p>No templates found. Please create one first.</p>
        ) : (
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isSaving || !institutionId}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoadingTemplateDetails && <Skeleton className="h-48 w-full" />}
      
      {!isLoadingTemplateDetails && selectedTemplateId && (
        <form onSubmit={handleSubmitMappings} className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Field Mappings for {selectedTemplate?.name}</h3>
            {currentMappings.length === 0 && <p className="text-gray-600 mb-4">No mappings defined yet. Add your first mapping below.</p>}

            {currentMappings.map((mapping, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border rounded-md border-gray-100 relative">
                {/* Form fields remain the same as before */}
                <div className="md:col-span-1">
                  <label htmlFor={`sourceField-${index}`} className="block text-sm font-medium text-gray-700">Source Field</label>
                  <input type="text" id={`sourceField-${index}`} value={mapping.sourceField} onChange={(e) => handleMappingChange(index, 'sourceField', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., student.firstName" required />
                </div>
                <div className="md:col-span-1">
                  <label htmlFor={`targetField-${index}`} className="block text-sm font-medium text-gray-700">Target EduCreds Field</label>
                  <select id={`targetField-${index}`} value={mapping.targetField} onChange={(e) => handleMappingChange(index, 'targetField', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                    <option value="">Select Target Field</option>
                    {EduCredsCanonicalSchema.map((field: any) => (<option key={field.path} value={field.path}>{field.label} ({field.type})</option>))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label htmlFor={`transformation-${index}`} className="block text-sm font-medium text-gray-700">Transformation (Optional)</label>
                  <input type="text" id={`transformation-${index}`} value={mapping.transformation || ''} onChange={(e) => handleMappingChange(index, 'transformation', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., UPPERCASE" />
                </div>
                <div className="md:col-span-1">
                  <label htmlFor={`defaultValue-${index}`} className="block text-sm font-medium text-gray-700">Default Value (Optional)</label>
                  <input type="text" id={`defaultValue-${index}`} value={mapping.defaultValue || ''} onChange={(e) => handleMappingChange(index, 'defaultValue', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., N/A" />
                </div>
                <div className="md:col-span-1 flex items-end justify-end">
                  <button type="button" onClick={() => removeMapping(index)} className="p-2 text-red-600 hover:text-red-800">Remove</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addMapping} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={isSaving || !institutionId}>
              + Add Mapping
            </button>
          </div>

          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={isSaving || !institutionId}>
            {isSaving ? 'Saving...' : 'Save Mappings'}
          </button>
        </form>
      )}
    </div>
  );
};

export const DataMappingPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <DataMappingForm />
      </Suspense>
    </ErrorBoundary>
  );
};

export default DataMappingPage;
