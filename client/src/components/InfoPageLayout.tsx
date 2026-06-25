import React from 'react';
import { motion } from "framer-motion";
import ModernHeader from './modern/ModernHeader';
import ModernFooter from './modern/ModernFooter';
import { Badge } from "@/components/ui/badge";

interface InfoPageLayoutProps {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, subtitle, badge, children }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 font-sans selection:bg-blue-500/20">
      <ModernHeader />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-neutral-100 dark:border-neutral-800">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-blue-950/30 dark:via-neutral-950 dark:to-neutral-950"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {badge && (
              <Badge variant="outline" className="mb-6 bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-neutral-100 mb-6 tracking-tight leading-[0.9] uppercase">
              {title}
            </h1>
            <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-3xl mx-auto font-medium leading-relaxed">
              {subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {children}
      </main>

      <ModernFooter />
    </div>
  );
};
