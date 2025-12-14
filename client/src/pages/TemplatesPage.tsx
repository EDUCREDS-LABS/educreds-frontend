import React, { useState } from 'react';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { CertificateIssuanceForm } from '@/components/templates/CertificateIssuanceForm';
import { EnhancedVerification } from '@/components/EnhancedVerification';
import { Template } from '@shared/types/template';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Search } from 'lucide-react';

export function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState('gallery');

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setActiveTab('issue');
  };

  const handleBackToGallery = () => {
    setSelectedTemplate(null);
    setActiveTab('gallery');
  };

  const handleIssuanceSuccess = (certificateId: string) => {
    // You can add navigation to a success page or show a modal
    console.log('Certificate issued:', certificateId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">EduCreds Templates</h1>
        <p className="text-gray-600 mt-2">
          Create, customize, and issue professional certificates with our template system
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gallery">Template Gallery</TabsTrigger>
          <TabsTrigger value="issue">Issue Certificate</TabsTrigger>
          <TabsTrigger value="verify">Verify Certificate</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-6">
          <TemplateGallery onTemplateSelect={handleTemplateSelect} />
        </TabsContent>

        <TabsContent value="issue" className="mt-6">
          {selectedTemplate ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleBackToGallery}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Gallery
                </Button>
                <div>
                  <h2 className="text-xl font-semibold">Issue Certificate</h2>
                  <p className="text-gray-600">Using template: {selectedTemplate.metadata.name}</p>
                </div>
              </div>
              
              <CertificateIssuanceForm
                template={selectedTemplate}
                institutionId="mock-institution-id" // Replace with actual institution ID
                onSuccess={handleIssuanceSuccess}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Template Selected</h3>
                <p className="text-gray-600 mb-6">
                  Choose a template from the gallery to start issuing certificates
                </p>
                <Button onClick={() => setActiveTab('gallery')}>
                  Browse Templates
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="verify" className="mt-6">
          <EnhancedVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
}
