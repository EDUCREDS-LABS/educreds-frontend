import React, { useState, useEffect } from 'react';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Download, 
  ShoppingCart, 
  Star, 
  Eye, 
  Users,
  Calendar,
  Palette,
  Code,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTemplate } from '@/store/editorStore';

interface TemplateDetailsProps {
  templateId: string;
  onBack: () => void;
  onPurchase?: (template: EnhancedTemplate) => void;
  onUseTemplate?: (template: EnhancedTemplate) => void;
}

export function TemplateDetails({ 
  templateId, 
  onBack, 
  onPurchase, 
  onUseTemplate 
}: TemplateDetailsProps) {
  const { toast } = useToast();
  const [template, setTemplate] = useState<EnhancedTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    userFavorites,
    addToFavorites,
    removeFromFavorites,
    purchaseTemplate,
    incrementViewCount
  } = useMarketplaceStore();

  useEffect(() => {
    loadTemplateDetails();
  }, [templateId]);

  const loadTemplateDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/templates/${templateId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTemplate(data.template);
        setIsLiked(userFavorites.includes(templateId));
        
        // Increment view count
        await incrementViewCount(templateId);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load template details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading template details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    if (isLiked) {
      removeFromFavorites(templateId);
    } else {
      addToFavorites(templateId);
    }
    setIsLiked(!isLiked);
  };

  const handlePurchase = async () => {
    if (!template) return;
    
    try {
      const success = await purchaseTemplate(templateId);
      if (success) {
        toast({
          title: 'Purchase Successful',
          description: 'Template has been added to your library',
        });
        onPurchase?.(template);
      } else {
        toast({
          title: 'Purchase Failed',
          description: 'Failed to purchase template',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: 'An error occurred during purchase',
        variant: 'destructive',
      });
    }
  };

  const handleUseTemplate = () => {
    if (template) {
      onUseTemplate?.(template);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: template?.name,
          text: template?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Template link copied to clipboard',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading template details...</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Template not found</h3>
        <p className="text-gray-500 mb-4">The template you're looking for doesn't exist or has been removed.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleLike}>
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            {isLiked ? 'Liked' : 'Like'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Preview */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
                {template.previewImages?.large ? (
                  <img
                    src={template.previewImages.large}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Palette className="h-12 w-12 mx-auto mb-2" />
                      <p>Preview not available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{template.name}</CardTitle>
                  <p className="text-gray-600 mt-2">{template.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {template.price ? `$${template.price}` : 'Free'}
                  </div>
                  {template.currency && template.price && (
                    <div className="text-sm text-gray-500">{template.currency}</div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {template.viewCount || 0} views
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {template.salesCount || 0} sales
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {template.averageRating?.toFixed(1) || '0.0'} ({template.likeCount || 0})
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(template.createdAt || '').toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="license">License</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Template Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.placeholders?.map((placeholder) => (
                        <Badge key={placeholder.key} variant="outline">
                          {placeholder.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {template.tags && template.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {template.designMetadata && (
                    <div>
                      <h4 className="font-medium mb-2">Design Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Canvas Size:</span>
                          <span className="ml-2">
                            {template.designMetadata.canvasSize?.width} Ã— {template.designMetadata.canvasSize?.height}px
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Elements:</span>
                          <span className="ml-2">{template.designMetadata.elements}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Layers:</span>
                          <span className="ml-2">{template.designMetadata.layers}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Fonts:</span>
                          <span className="ml-2">{template.designMetadata.fonts?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Template Type</h4>
                      <Badge variant="outline">{template.templateType || 'certificate'}</Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">License Type</h4>
                      <Badge variant="outline">{template.licenseType || 'unlimited'}</Badge>
                    </div>

                    {template.licenseDetails && (
                      <div>
                        <h4 className="font-medium mb-2">License Details</h4>
                        <div className="space-y-2 text-sm">
                          {template.licenseDetails.maxUses && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Max uses: {template.licenseDetails.maxUses}
                            </div>
                          )}
                          {template.licenseDetails.maxSeats && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Max seats: {template.licenseDetails.maxSeats}
                            </div>
                          )}
                          {template.licenseDetails.validUntil && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Valid until: {new Date(template.licenseDetails.validUntil).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="license" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>License Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Usage Rights</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>â€¢ Use for personal and commercial projects</li>
                        <li>â€¢ Modify and customize as needed</li>
                        <li>â€¢ No attribution required</li>
                        <li>â€¢ Cannot resell or redistribute</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Restrictions</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>â€¢ Cannot be resold as a template</li>
                        <li>â€¢ Cannot be used in competing products</li>
                        <li>â€¢ Must comply with license terms</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reviews & Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-4" />
                    <p>No reviews yet</p>
                    <p className="text-sm">Be the first to review this template!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Purchase Card */}
          <Card>
            <CardHeader>
              <CardTitle>Get This Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {template.price ? `$${template.price}` : 'Free'}
                </div>
                <p className="text-sm text-gray-600">
                  {template.price ? 'One-time purchase' : 'Free to use'}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={template.price ? handlePurchase : handleUseTemplate}
                >
                  {template.price ? (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase Template
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Use Template
                    </>
                  )}
                </Button>
                
                {template.price && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleUseTemplate}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview in Editor
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>âœ“ Instant download</p>
                <p>âœ“ Commercial license included</p>
                <p>âœ“ Lifetime updates</p>
              </div>
            </CardContent>
          </Card>

          {/* Designer Info */}
          {template.creatorId && (
            <Card>
              <CardHeader>
                <CardTitle>Designer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {template.creatorId.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Designer Name</p>
                    <p className="text-sm text-gray-600">Verified Designer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
