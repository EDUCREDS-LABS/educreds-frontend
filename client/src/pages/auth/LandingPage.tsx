import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ModernFooter from '@/components/modern/ModernFooter';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Globe, Cpu, Network, ArrowRight, CheckCircle2, Building2, Cloud, Server } from "lucide-react";
import { motion } from "framer-motion";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);
  const [pendingTier, setPendingTier] = React.useState<'workspace' | 'cloud-connector' | 'enterprise-connector' | null>(null);

  const networkNodes = [
    { id: 'n1', x: 8,  y: 20, size: 8,  delay: 0.1 },
    { id: 'n2', x: 22, y: 42, size: 10, delay: 0.5 },
    { id: 'n3', x: 40, y: 26, size: 7,  delay: 0.9 },
    { id: 'n4', x: 58, y: 48, size: 11, delay: 1.2 },
    { id: 'n5', x: 74, y: 30, size: 8,  delay: 1.6 },
    { id: 'n6', x: 90, y: 46, size: 9,  delay: 2.0 },
    { id: 'n7', x: 30, y: 70, size: 9,  delay: 2.3 },
    { id: 'n8', x: 68, y: 72, size: 10, delay: 2.7 },
  ] as const;

  const networkLinks = [
    ['n1','n2'],['n2','n3'],['n3','n4'],['n4','n5'],
    ['n5','n6'],['n2','n7'],['n4','n7'],['n4','n8'],['n5','n8'],
  ] as const;

  const getNodeById = (id: string) => networkNodes.find(n => n.id === id);

  const handleGetStarted = (tier: 'workspace' | 'cloud-connector' | 'enterprise-connector') => {
    setPendingTier(tier);
    setAuthDialogOpen(true);
  };

  const handleSignupRedirect = () => {
    if (!pendingTier) return;
    setAuthDialogOpen(false);
    navigate(`/register?tier=${pendingTier}`);
  };

  const handleLoginRedirect = () => {
    if (!pendingTier) return;
    setAuthDialogOpen(false);
    navigate(`/login?next=${encodeURIComponent(`/register?tier=${pendingTier}`)}`);
  };

  const deploymentTiers = [
    {
      id: 'workspace',
      icon: Building2,
      title: 'EduCreds Workspace',
      tagline: 'Managed Credentialing',
      description: 'Full managed platform for institutions that want an intuitive, ready-to-use interface with no integration overhead.',
      features: ['Managed platform with intuitive UI', 'Enhanced analytics & reporting', 'Batch operations & audit trail', 'Direct PoIC submission'],
      cta: 'Start with Workspace',
      accentClass: 'border-t-primary',
      ctaVariant: 'default' as const,
    },
    {
      id: 'cloud-connector',
      icon: Cloud,
      title: 'Cloud Connector',
      tagline: 'API-Driven Integration',
      description: 'Connect your cloud Student Information System through secure APIs and automate credential issuance from existing workflows.',
      features: ['REST & webhook API integration', 'Automated issuance workflows', 'Data mapping & transformation', 'Managed API key security'],
      cta: 'Integrate Cloud SIS',
      accentClass: 'border-t-accent',
      ctaVariant: 'outline' as const,
    },
    {
      id: 'enterprise-connector',
      icon: Server,
      title: 'Enterprise Connector',
      tagline: 'On-Premise Security',
      description: 'Built for institutions requiring mTLS or VPN integration, strict data sovereignty, and high-assurance security.',
      features: ['Secure mTLS/VPN integration', 'On-premise data orchestration', 'Delegated signing & key management', 'Real-time health monitoring'],
      cta: 'Connect Enterprise Systems',
      accentClass: 'border-t-secondary',
      ctaVariant: 'outline' as const,
    },
  ];

  const pillars = [
    { icon: Globe,   title: 'Global Reach',    desc: 'Cross-border qualification recognition systems.' },
    { icon: Network, title: 'Interoperable',   desc: 'Composable infrastructure for the trust layer.' },
    { icon: Shield,  title: 'Cryptographic',   desc: 'Tamper-proof credentials anchored on-chain.' },
    { icon: Cpu,     title: 'AI-Assisted',     desc: 'Intelligent governance and dispute resolution.' },
  ];

  const publicLayers = [
    { to: '/student/login',   title: 'Student Portal',         desc: 'Access and share your verifiable credentials.' },
    { to: '/verifier/login',  title: 'Employer Verification',  desc: 'Verify credentials by ID, token, IPFS, or W3C VC.' },
    { to: '/trust-registry',  title: 'Trust Registry',         desc: 'Explore institutions, governance, and protocol activity.' },
    { to: '/access',          title: 'All Sign-in Portals',    desc: 'Access portal for all stakeholder types.' },
  ];

  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">

      {/* ── Minimal top nav ── */}
      <header className="border-b border-[--border] bg-[--background]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="EduCreds" className="h-8 w-auto" />
            <span className="font-black tracking-tight text-[--foreground]">EduCreds</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/access">
              <Button variant="ghost" size="sm" className="font-semibold text-[--muted-foreground]">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="font-black text-xs uppercase tracking-widest rounded-xl">Register Institution</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-[--background] to-[--background] dark:from-blue-950/20 dark:via-[--background] dark:to-[--background]" />

        {/* Network animation */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {networkLinks.map(([fromId, toId], idx) => {
              const from = getNodeById(fromId);
              const to = getNodeById(toId);
              if (!from || !to) return null;
              return (
                <motion.line
                  key={`${fromId}-${toId}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke="rgb(59 130 246)" strokeWidth="0.18" strokeLinecap="round"
                  strokeDasharray="1.5 1.2"
                  initial={{ opacity: 0.06 }}
                  animate={{ opacity: [0.06, 0.22, 0.06], strokeDashoffset: [0, -2.7] }}
                  transition={{ duration: 4.6 + idx * 0.2, repeat: Infinity, ease: 'linear' }}
                />
              );
            })}
          </svg>
          {networkNodes.map(node => (
            <motion.div
              key={node.id}
              className="absolute rounded-full bg-primary/50"
              style={{ left: `${node.x}%`, top: `${node.y}%`, width: node.size, height: node.size }}
              initial={{ opacity: 0.25, scale: 0.8 }}
              animate={{ opacity: [0.25, 0.8, 0.25], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 2.8, delay: node.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-6 bg-[--card] text-primary border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
              Verifiable Education Network
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[--foreground] mb-6 leading-[1.05]">
              Decentralized Trust for<br />
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                Academic Credentials
              </span>
            </h1>
            <p className="text-lg text-[--muted-foreground] max-w-2xl mx-auto leading-relaxed mb-10">
              EduCreds is a protocol-level system where academic institutions, learners, employers, and governments issue, verify, and govern credentials with cryptographic certainty.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                  Register Your Institution
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/access">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Why We Exist ── */}
      <section className="py-20 border-y border-[--border] bg-[--card]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 text-[10px] font-black uppercase tracking-widest">Our Mission</Badge>
              <h2 className="text-3xl font-black tracking-tighter text-[--foreground] mb-6">Why We Exist</h2>
              <div className="space-y-4 text-[--muted-foreground] text-sm leading-relaxed">
                <p>
                  Education credentials are one of the most critical forms of trust infrastructure in the digital world. Degrees, certificates, and academic records underpin employment, migration, funding, and social mobility — yet today they remain fragmented, opaque, and vulnerable to fraud.
                </p>
                <p>
                  EduCreds introduces a programmable, verifiable alternative powered by decentralized identity, on-chain credentials, and AI-assisted governance — bringing composable, interoperable credential infrastructure to the Internet's trust layer.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {pillars.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-[--border] shadow-none bg-[--muted]/50">
                  <CardContent className="p-5 flex flex-col items-start">
                    <div className="w-10 h-10 bg-primary/10 rounded-[10px] flex items-center justify-center mb-3 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-sm text-[--foreground] mb-1 tracking-tight">{title}</h3>
                    <p className="text-xs text-[--muted-foreground] leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Deployment Tiers ── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-[10px] font-black uppercase tracking-widest">For Institutions</Badge>
            <h2 className="text-3xl font-black tracking-tighter text-[--foreground] mb-3">Choose Your Deployment Path</h2>
            <p className="text-[--muted-foreground] text-sm max-w-xl mx-auto">
              Whether you want a managed interface, a cloud API integration, or on-premise security — EduCreds has a tier for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deploymentTiers.map(({ id, icon: Icon, title, tagline, description, features, cta, accentClass, ctaVariant }) => (
              <Card key={id} className={`border-t-4 ${accentClass} bg-[--card] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-xl-neutral)] transition-all duration-200 hover:-translate-y-0.5`}>
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-11 h-11 rounded-[12px] bg-primary/10 flex items-center justify-center mb-5 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{tagline}</p>
                    <h3 className="text-xl font-black tracking-tight text-[--foreground] mb-3">{title}</h3>
                    <p className="text-sm text-[--muted-foreground] leading-relaxed">{description}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[--muted-foreground]">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={ctaVariant}
                    className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                    onClick={() => handleGetStarted(id as any)}
                  >
                    {cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Trust Layer ── */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-[--border] bg-[--card] shadow-[var(--shadow-card)]">
            <CardContent className="p-10">
              <div className="text-center mb-8">
                <Badge variant="secondary" className="mb-4 text-[10px] font-black uppercase tracking-widest">Open Infrastructure</Badge>
                <h2 className="text-2xl font-black tracking-tighter text-[--foreground] mb-3">Public Trust Layer</h2>
                <p className="text-sm text-[--muted-foreground] max-w-2xl mx-auto leading-relaxed">
                  EduCreds is not only an institution workspace. It provides open trust infrastructure for students, employers, regulators, and ecosystem observers.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {publicLayers.map(({ to, title, desc }) => (
                  <Link
                    key={to}
                    to={to}
                    className="block rounded-2xl border border-[--border] bg-[--muted]/30 p-5 hover:border-primary/30 hover:bg-[--card] hover:shadow-[var(--shadow-sm)] transition-all"
                  >
                    <h3 className="font-black text-sm text-[--foreground] mb-1.5 tracking-tight">{title}</h3>
                    <p className="text-xs text-[--muted-foreground] leading-relaxed">{desc}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-primary mt-3 uppercase tracking-widest">
                      Access <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auth dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">Continue with EduCreds</DialogTitle>
            <DialogDescription className="text-sm text-[--muted-foreground] mt-1">
              Choose how you want to continue to configure your selected deployment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 pt-4">
            <Button
              onClick={handleSignupRedirect}
              className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-all"
            >
              Register Institution &amp; Continue
            </Button>
            <Button
              variant="outline"
              onClick={handleLoginRedirect}
              className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Sign In &amp; Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ModernFooter />
    </div>
  );
};

export default LandingPage;
