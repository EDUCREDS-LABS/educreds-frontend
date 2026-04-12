import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Landmark,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Award,
  TrendingUp,
  Fingerprint,
  Wallet,
  ShieldCheck,
  Activity,
  Calendar,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";
import { API_CONFIG } from "@/config/api";
import { getAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["institution-stats", user?.id],
    queryFn: () => api.getStats(user?.id),
    enabled: !!user,
  });

  const stats = statsData || {};

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
      <div className="space-y-8 max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center px-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="px-4">
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
            <Building2 className="size-4" />
            Institutional Entity
          </div>
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
            {profile.name || "Institution Profile"}
          </h1>
          <div className="flex items-center gap-4 text-neutral-500 text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {profile.city && profile.country ? `${profile.city}, ${profile.country}` : "Location not set"}
            </div>
            <div className="size-1 bg-neutral-300 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              Member since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : "2024"}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="rounded-xl border-neutral-200">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="rounded-xl shadow-lg shadow-primary/20">
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Confirm Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="rounded-xl shadow-lg shadow-primary/20">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent border-b border-neutral-200 w-full justify-start rounded-none h-12 p-0 gap-8">
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 h-full font-semibold transition-all"
          >
            Performance Overview
          </TabsTrigger>
          <TabsTrigger 
            value="general" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 h-full font-semibold transition-all"
          >
            Institutional Details
          </TabsTrigger>
          <TabsTrigger 
            value="identity" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 h-full font-semibold transition-all"
          >
            Identity & Governance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 pt-8 outline-none">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm bg-blue-50/40 rounded-2xl overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Lifetime Issuance</p>
                    <h3 className="text-3xl font-black text-neutral-900 tracking-tighter">{stats.totalCertificates || 0}</h3>
                  </div>
                  <div className="size-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Award className="size-6" />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-blue-100 flex items-center justify-between text-[11px] font-bold text-blue-600/80">
                  <div className="flex items-center gap-1">
                    <Activity className="size-3" />
                    CERTIFICATES
                  </div>
                  <TrendingUp className="size-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-green-50/40 rounded-2xl overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active Registry</p>
                    <h3 className="text-3xl font-black text-neutral-900 tracking-tighter">{stats.activeCertificates || 0}</h3>
                  </div>
                  <div className="size-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shadow-inner group-hover:scale-110 transition-transform">
                    <ShieldCheck className="size-6" />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-green-100 flex items-center justify-between text-[11px] font-bold text-green-600/80">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="size-3" />
                    ON-CHAIN VERIFIED
                  </div>
                  <Activity className="size-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-purple-50/40 rounded-2xl overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Student Reach</p>
                    <h3 className="text-3xl font-black text-neutral-900 tracking-tighter">{stats.totalStudents || 0}</h3>
                  </div>
                  <div className="size-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shadow-inner group-hover:scale-110 transition-transform">
                    <Users className="size-6" />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-purple-100 flex items-center justify-between text-[11px] font-bold text-purple-600/80">
                  <div className="flex items-center gap-1">
                    <Fingerprint className="size-3" />
                    UNIQUE HOLDERS
                  </div>
                  <TrendingUp className="size-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-orange-50/40 rounded-2xl overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Monthly Velocity</p>
                    <h3 className="text-3xl font-black text-neutral-900 tracking-tighter">{stats.monthlyIssuance || 0}</h3>
                  </div>
                  <div className="size-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shadow-inner group-hover:scale-110 transition-transform">
                    <TrendingUp className="size-6" />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-orange-100 flex items-center justify-between text-[11px] font-bold text-orange-600/80">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    CURRENT PERIOD
                  </div>
                  <Activity className="size-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-xl shadow-neutral-200/40 rounded-3xl overflow-hidden">
              <CardHeader className="bg-neutral-50/50 p-8 border-b border-neutral-100">
                <CardTitle className="text-xl font-bold">Institutional Summary</CardTitle>
                <CardDescription>Official profile visible to the academic community</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="prose prose-neutral max-w-none">
                  <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-4">About the Institution</h4>
                  <p className="text-neutral-600 leading-relaxed text-lg">
                    {profile.description || "No description provided for this institution. Add a detailed summary to build trust with credential recipients and verification parties."}
                  </p>
                </div>
                
                <Separator className="bg-neutral-100" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Primary Contact</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-neutral-700 font-medium">
                        <Mail className="size-4 text-primary" />
                        {profile.email}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-700 font-medium">
                        <Phone className="size-4 text-primary" />
                        {profile.phone || contactInfo.phone || "No phone listed"}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-700 font-medium">
                        <Globe className="size-4 text-primary" />
                        {profile.website || contactInfo.website ? (
                          <a href={profile.website || contactInfo.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            {new URL(profile.website || contactInfo.website || "").hostname}
                            <ExternalLink className="size-3" />
                          </a>
                        ) : "No website listed"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Operational Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={cn(
                          "rounded-full px-3 py-1 font-bold text-[10px]",
                          user?.isVerified ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        )}>
                          {user?.isVerified ? "Verified Infrastructure" : "Pending Verification"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-700 font-medium uppercase tracking-wider text-[10px]">
                        <Building2 className="size-4 text-primary" />
                        Type: {profile.institutionType?.replace("_", " ") || "Higher Education"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-neutral-200/40 rounded-3xl overflow-hidden bg-primary text-white">
                <CardHeader className="p-8 pb-4">
                  <Shield className="size-10 mb-4 opacity-50" />
                  <CardTitle className="text-2xl font-black tracking-tight">Trust Badge</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <p className="text-primary-foreground/80 text-sm leading-relaxed">
                    Your institution is anchored on the EduCreds decentralized network. All certificates issued carry cryptographic proof of your institutional authority.
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl font-bold py-6 bg-white text-primary hover:bg-neutral-100 transition-colors"
                    onClick={() => window.location.href = '/institution/verification'}
                  >
                    View Verification Data
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-neutral-100/50 rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-neutral-500">
                      <MapPin className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Headquarters</p>
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {[profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Address not provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="general" className="pt-8 outline-none">
          <Card className="border-none shadow-xl shadow-neutral-200/40 rounded-3xl">
            <CardHeader className="p-8 border-b border-neutral-100">
              <CardTitle className="text-xl font-bold">Detailed Institution Profile</CardTitle>
              <CardDescription>Update your public-facing information and operational metadata</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Legal Institution Name</Label>
                    <Input
                      id="name"
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-xl h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institutionType" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Institution Category</Label>
                    <Select 
                      disabled={!isEditing} 
                      value={formData.institutionType} 
                      onValueChange={(value) => setFormData({ ...formData, institutionType: value })}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-neutral-50 border-neutral-200">
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="university">Research University</SelectItem>
                        <SelectItem value="college">Technical College</SelectItem>
                        <SelectItem value="school">Primary/Secondary School</SelectItem>
                        <SelectItem value="training_center">Vocational Center</SelectItem>
                        <SelectItem value="certification_body">Standardization Body</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Official Description</Label>
                    <Textarea
                      id="description"
                      disabled={!isEditing}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="rounded-xl bg-neutral-50 border-neutral-200 focus:bg-white transition-all min-h-[140px] resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Admin Email</Label>
                      <Input id="email" value={formData.email} disabled className="rounded-xl h-12 bg-neutral-100 border-neutral-200 opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Contact Line</Label>
                      <Input
                        id="phone"
                        disabled={!isEditing}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="rounded-xl h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Institutional URL</Label>
                    <Input
                      id="website"
                      disabled={!isEditing}
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="rounded-xl h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs font-bold uppercase tracking-widest text-neutral-400">City</Label>
                      <Input
                        id="city"
                        disabled={!isEditing}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="rounded-xl h-12 bg-neutral-50 border-neutral-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Country</Label>
                      <Input
                        id="country"
                        disabled={!isEditing}
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="rounded-xl h-12 bg-neutral-50 border-neutral-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-neutral-400">Physical Registered Office</Label>
                    <Input
                      id="address"
                      disabled={!isEditing}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="rounded-xl h-12 bg-neutral-50 border-neutral-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identity" className="pt-8 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl shadow-neutral-200/40 rounded-3xl overflow-hidden">
              <CardHeader className="p-8 border-b border-neutral-100 bg-neutral-50/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Fingerprint className="size-5 text-primary" />
                  Network Identity
                </CardTitle>
                <CardDescription>Cryptographic identifiers on the Base blockchain</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Decentralized Identifier (DID)</Label>
                  <div className="flex items-center gap-2 p-4 bg-neutral-50 rounded-2xl border border-neutral-200 font-mono text-[11px] text-neutral-600 break-all leading-relaxed">
                    {profile.did || "did:educreds:unregistered"}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Anchored Wallet Address</Label>
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <Wallet className="size-5 text-neutral-400 flex-shrink-0" />
                    <span className="font-mono text-xs text-neutral-600 break-all">{profile.walletAddress || "No connected wallet"}</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <ShieldCheck className="size-3 inline mr-1" />
                    These identifiers are unique to your institution and are used to sign every certificate issued through the platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-neutral-200/40 rounded-3xl overflow-hidden">
              <CardHeader className="p-8 border-b border-neutral-100 bg-neutral-50/50">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Landmark className="size-5 text-primary" />
                  Regulatory & Compliance
                </CardTitle>
                <CardDescription>Government and academic accreditation data</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Institutional Registration No.</Label>
                  {isEditing ? (
                    <Input
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="rounded-xl h-12 bg-neutral-50 border-neutral-200"
                    />
                  ) : (
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 font-bold text-neutral-700">
                      {profile.registrationNumber || "Not provided"}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-neutral-400">Trust Scores</Label>
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <div className="flex items-center gap-3">
                      <Shield className="size-5 text-primary opacity-40" />
                      <span className="text-sm font-semibold text-neutral-600">Governance Rating</span>
                    </div>
                    <Badge className="bg-primary/10 text-primary font-black border-none px-3">AAA</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
