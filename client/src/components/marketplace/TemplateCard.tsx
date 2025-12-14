import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TemplateListingItem } from '@/lib/marketplaceService';
import { Eye, ShoppingCart, Star, Users, Calendar, Heart, Share2 } from 'lucide-react';

interface TemplateCardProps {
  template: TemplateListingItem;
  onPurchase?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  isLiked?: boolean;
  showActions?: boolean;
  viewMode?: 'grid' | 'list';
}

export function TemplateCard({ 
  template, 
  onPurchase, 
  onLike, 
  onShare, 
  isLiked = false, 
  showActions = true,
  viewMode = 'grid'
}: TemplateCardProps) {
  const { toast } = useToast();

  const viewDetails = () => {
    // Navigate to template details page
    window.location.href = `/marketplace/${template.id}`;
  };

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="p-0">
        {template.thumbnailUrl ? (
          <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
            <img
              src={template.thumbnailUrl}
              alt={template.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={viewDetails}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            {showActions && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-8 h-8 p-0 bg-white/80 hover:bg-white"
                  onClick={onLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-8 h-8 p-0 bg-white/80 hover:bg-white"
                  onClick={onShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-gray-500 text-xs">Preview</span>
              </div>
              <span className="text-gray-400 text-sm">No preview available</span>
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
            <Badge variant="outline" className="ml-2 flex-shrink-0">
              {template.licenseType || 'Standard'}
            </Badge>
          </div>
          <CardDescription className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-4">
        <div className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3} more
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{template.salesCount} sales</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(template.createdAt)}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {template.price ? (
                <span className="text-gray-900">
                  ${template.price} {template.currency}
                </span>
              ) : (
                <span className="text-green-600 font-bold">Free</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">4.8</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" onClick={viewDetails} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button 
            size="sm" 
            onClick={handlePurchase}
            className="flex-1"
            disabled={template.price === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {template.price ? 'Purchase' : 'Get Free'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}