import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Template } from '@shared/types/template';
import { Eye, Download, Palette } from 'lucide-react';
import { api } from '@/lib/api';

interface TemplateGalleryProps {
  onTemplateSelect?: (template: Template) => void;
  showCustomizeButton?: boolean;
}

const categoryLabels = {
  academic: 'Academic',
  training: 'Training',
  corporate: 'Corporate',
  hackathon: 'Hackathon',
  workshop: 'Workshop'
};

const categoryColors = {
  academic: 'bg-blue-100 text-blue-800',
  training: 'bg-green-100 text-green-800',
  corporate: 'bg-purple-100 text-purple-800',
  hackathon: 'bg-cyan-100 text-cyan-800',
  workshop: 'bg-orange-100 text-orange-800'
};

export function TemplateGallery({ onTemplateSelect, showCustomizeButton = true }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: templatesData, isLoading, error } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: api.getTemplates,
  });

  const templates = templatesData?.data || [];

  const filteredTemplates = templates?.filter((template: any) => 
    selectedCategory === 'all' || template.metadata.category === selectedCategory
  ) || [];

  // Debug: Log the first template to see its structure
  if (filteredTemplates.length > 0) {
    console.log('First template structure:', filteredTemplates[0]);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load templates. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Certificate Templates</h2>
          <p className="text-gray-600">Choose from our collection of professional certificate designs</p>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="corporate">Corporate</TabsTrigger>
          <TabsTrigger value="hackathon">Hackathon</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template: any) => (
              <Card key={template.metadata.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={categoryColors[template.metadata.category as keyof typeof categoryColors]}>
                      {categoryLabels[template.metadata.category as keyof typeof categoryLabels]}
                    </Badge>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTemplateSelect?.(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {showCustomizeButton && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTemplateSelect?.(template)}
                        >
                          <Palette className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{template.metadata.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.metadata.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-gray-500 text-sm">
                      Preview Image
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      <strong>Fields:</strong> {template.metadata.fields?.length || 0} required
                    </p>
                    {template.metadata.fields && template.metadata.fields.length > 0 ? (
                      <>
                        <div className="flex gap-1 flex-wrap">
                          {template.metadata.fields.slice(0, 3).map((field: any) => (
                            <Badge key={field.name} variant="outline" className="text-xs">
                              {field.name}
                            </Badge>
                          ))}
                          {template.metadata.fields.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.metadata.fields.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No fields defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
