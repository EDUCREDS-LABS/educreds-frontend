import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Loader2, Eye, Download, Edit, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PenpotFile {
  id: string;
  name: string;
  projectId: string;
  thumbnailUrl?: string;
  createdAt: string;
  modifiedAt: string;
}

interface PenpotProject {
  id: string;
  name: string;
  teamId: string;
  files: PenpotFile[];
}

interface PenpotTemplateGalleryProps {
  onTemplateSelect?: (file: PenpotFile) => void;
  onTemplateConvert?: (file: PenpotFile) => void;
  showActions?: boolean;
}

export const PenpotTemplateGallery: React.FC<PenpotTemplateGalleryProps> = ({
  onTemplateSelect,
  onTemplateConvert,
  showActions = true
}) => {
  const [projects, setProjects] = useState<PenpotProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [files, setFiles] = useState<PenpotFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<PenpotFile | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load files when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectFiles(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/penpot/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load projects');
      
      const data = await response.json();
      setProjects(data.data || []);
      
      // Auto-select first project if available
      if (data.data && data.data.length > 0) {
        setSelectedProject(data.data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load Penpot projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectFiles = async (projectId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/penpot/projects/${projectId}/files`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load files');
      
      const data = await response.json();
      setFiles(data.data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load project files');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePreview = (file: PenpotFile) => {
    setSelectedFile(file);
    setPreviewDialogOpen(true);
  };

  const handleFileSelect = (file: PenpotFile) => {
    if (onTemplateSelect) {
      onTemplateSelect(file);
    }
  };

  const handleFileConvert = async (file: PenpotFile) => {
    try {
      const response = await fetch(`/api/penpot/files/${file.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          category: 'penpot-template',
          description: `Professional template created with Penpot: ${file.name}`
        })
      });

      if (!response.ok) throw new Error('Failed to convert template');

      const data = await response.json();
      toast.success('Template converted successfully!');
      
      if (onTemplateConvert) {
        onTemplateConvert(file);
      }
    } catch (error) {
      console.error('Error converting template:', error);
      toast.error('Failed to convert template');
    }
  };

  const openInPenpot = (file: PenpotFile) => {
    const penpotUrl = `${process.env.REACT_APP_PENPOT_URL || 'http://localhost:9001'}/workspace/project/${file.projectId}/file/${file.id}`;
    window.open(penpotUrl, '_blank');
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Penpot Template Gallery</h2>
          <p className="text-muted-foreground">
            Browse and import professional templates from Penpot
          </p>
        </div>
        <Button onClick={loadProjects} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading templates...</span>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map(file => (
            <Card key={file.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="p-4">
                <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Eye className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-sm font-medium truncate" title={file.name}>
                  {file.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Modified</span>
                  <span>{new Date(file.modifiedAt).toLocaleDateString()}</span>
                </div>

                {showActions && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFilePreview(file)}
                      className="flex-1"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleFileConvert(file)}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Import
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'No templates available in this project'}
          </p>
          {!searchTerm && (
            <Button onClick={() => window.open(process.env.REACT_APP_PENPOT_URL || 'http://localhost:9001', '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Create Templates in Penpot
            </Button>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedFile?.name}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedFile && openInPenpot(selectedFile)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit in Penpot
                </Button>
                <Button
                  size="sm"
                  onClick={() => selectedFile && handleFileConvert(selectedFile)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import Template
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
            {selectedFile?.thumbnailUrl ? (
              <img
                src={selectedFile.thumbnailUrl}
                alt={selectedFile.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Eye className="w-16 h-16" />
                <span className="ml-4">No preview available</span>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">{new Date(selectedFile.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium">Modified:</span>
                <span className="ml-2">{new Date(selectedFile.modifiedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PenpotTemplateGallery;