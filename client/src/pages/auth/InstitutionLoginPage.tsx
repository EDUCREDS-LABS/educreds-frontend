import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstitutionSsoDiscovery from '@/components/auth/InstitutionSsoDiscovery';
import ModernAuthUnified from '@/components/modern/ModernAuthUnified';
import { Mail, Lock, Building2, ShieldCheck, KeyRound } from 'lucide-react';

const STEPS = [
  { icon: Building2, title: 'Register your institution', body: 'Submit your legal name and registration number. EduCreds reviews every institution before it can issue.' },
  { icon: ShieldCheck, title: 'Get approved', body: 'Once approved, your institution receives a decentralised identifier (DID) that anchors every credential you issue.' },
  { icon: KeyRound, title: 'Issue and manage', body: 'Issue credentials individually, by CSV, or automatically from your student information system.' },
];

export default function InstitutionLoginPage() {
  const [activeTab, setActiveTab] = useState('password');

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-[1fr_minmax(420px,480px)] gap-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-16 items-start">
      <section className="hidden lg:block pt-6" aria-label="How institution access works">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Institution console</p>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-4">
          Sign in to manage your institution's credentials
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-lg mb-10">
          The console is where registrars and administrators issue credentials, track their lifecycle and manage institutional identity.
        </p>
        <ol className="space-y-6 max-w-lg">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <div className="size-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{i + 1}. {s.title}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-sm text-neutral-500 mt-10">
          New to EduCreds? <Link to="/register" className="font-semibold text-primary hover:underline" data-testid="institution-login-register-link">Register your institution</Link>
        </p>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="password" className="flex items-center gap-2" data-testid="institution-login-tab-password">
            <Lock className="w-4 h-4" /> Email & password
          </TabsTrigger>
          <TabsTrigger value="sso" className="flex items-center gap-2" data-testid="institution-login-tab-sso">
            <Mail className="w-4 h-4" /> Institution SSO
          </TabsTrigger>
        </TabsList>
        <TabsContent value="password">
          <ModernAuthUnified embedded />
        </TabsContent>
        <TabsContent value="sso" className="rounded-2xl border bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold mb-1">Sign in with your institution account</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Available when your institution has configured single sign-on with EduCreds.
          </p>
          <InstitutionSsoDiscovery />
        </TabsContent>
      </Tabs>
    </div>
  );
}
