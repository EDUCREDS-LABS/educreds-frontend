import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone, Globe, MapPin, Edit, Save, X, CheckCircle, AlertCircle, Users, Award, TrendingUp, Fingerprint, Wallet } from "lucide-react";
import { API_CONFIG } from "@/config/api";
import { getAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  institutionType: string;
  registrationNumber: string;
}

export default function InstitutionProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    description: '',
    institutionType: '',
    registrationNumber: ''
  });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/institutions/profile"],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.INSTITUTIONS.PROFILE, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
      return response.json();
    },
    enabled: !!user,
    onSuccess: (data: any) => {
      const profile = data || {};
      const contactInfo = profile.contactInfo || {};
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || contactInfo.phone || '',
        website: profile.website || contactInfo.website || '',
        address: profile.address || contactInfo.address || '',
        city: profile.city || contactInfo.city || '',
        state: profile.state || contactInfo.state || '',
        country: profile.country || contactInfo.country || '',
        description: profile.description || '',
        institutionType: profile.institutionType || '',
        registrationNumber: profile.registrationNumber || ''
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await fetch(API_CONFIG.INSTITUTIONS.PROFILE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/profile"] });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  });

  const profile = profileData || {};
  const contactInfo = profile.contactInfo || {};
  const stats = profileData?.stats || {};

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    const profile = profileData || {};
    const contactInfo = profile.contactInfo || {};
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || contactInfo.phone || '',
      website: profile.website || contactInfo.website || '',
      address: profile.address || contactInfo.address || '',
      city: profile.city || contactInfo.city || '',
      state: profile.state || contactInfo.state || '',
      country: profile.country || contactInfo.country || '',
      description: profile.description || '',
      institutionType: profile.institutionType || '',
      registrationNumber: profile.registrationNumber || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Institution Profile</h1>
          <p className="text-neutral-600">Manage your institution information and settings</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCertificates || 0}</p>
                <p className="text-sm text-neutral-600">Total Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeCertificates || 0}</p>
                <p className="text-sm text-neutral-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents || 0}</p>
                <p className="text-sm text-neutral-600">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.monthlyIssuance || 0}</p>
                <p className="text-sm text-neutral-600">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">Institution Information</CardTitle>
              {user?.isVerified ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertCircle className="w-3 h-3 mr-1" />Pending Verification
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Institution Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter institution name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="Enter registration number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionType">Institution Type</Label>
                <Select value={formData.institutionType} onValueChange={(value) => setFormData({ ...formData, institutionType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="training_center">Training Center</SelectItem>
                    <SelectItem value="certification_body">Certification Body</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Enter state or province"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your institution"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Fingerprint className="w-4 h-4 text-neutral-600" />
                  <span className="font-medium">Institution ID:</span>
                  <span className="font-mono">{profile.id || "Not available"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-neutral-600" />
                  <span className="font-medium">Registration No:</span>
                  <span>{profile.registrationNumber || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-neutral-600" />
                  <span className="font-medium">Name:</span>
                  <span>{profile.name || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-neutral-600" />
                  <span className="font-medium">Email:</span>
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-neutral-600" />
                  <span className="font-medium">Phone:</span>
                  <span>{profile.phone || contactInfo.phone || 'Not provided'}</span>
                </div>
                {(profile.website || contactInfo.website) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-neutral-600" />
                    <span className="font-medium">Website:</span>
                    <a
                      href={profile.website || contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {(profile.website || contactInfo.website).replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-neutral-600" />
                  <span className="font-medium">Type:</span>
                  <span>{profile.institutionType || 'Not specified'}</span>
                </div>
                {(profile.city || profile.state || profile.country || contactInfo.city || contactInfo.state || contactInfo.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-600" />
                    <span className="font-medium">Location:</span>
                    <span>
                      {[profile.city || contactInfo.city, profile.state || contactInfo.state, profile.country || contactInfo.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {profile.walletAddress && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="w-4 h-4 text-neutral-600" />
                    <span className="font-medium">Wallet:</span>
                    <span className="font-mono">{profile.walletAddress}</span>
                  </div>
                )}
                {profile.did && (
                  <div className="flex items-center gap-2 text-sm">
                    <Fingerprint className="w-4 h-4 text-neutral-600" />
                    <span className="font-medium">DID:</span>
                    <span className="font-mono">{profile.did}</span>
                  </div>
                )}
              </div>
              {(profile.address || contactInfo.address) && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-600 mt-0.5" />
                    <div>
                      <span className="font-medium">Address:</span>
                      <p className="mt-1">{profile.address || contactInfo.address}</p>
                    </div>
                  </div>
                </>
              )}
              {profile.description && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-neutral-600">{profile.description}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
