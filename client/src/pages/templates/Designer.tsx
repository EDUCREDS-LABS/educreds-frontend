import React from 'react';
import TemplateDesigner from '../designer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Library } from 'lucide-react';
import { useLocation } from 'wouter';

const TemplateDesignerPage = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Contextual Header */}
      <div className="h-16 border-b px-6 flex items-center justify-between shrink-0 bg-white z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/institution/templates")}
            className="hover:bg-neutral-100 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Library
          </Button>
          <div className="flex items-center gap-3 pl-4 border-l border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900 leading-none">Design Studio</h1>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Institutional Assets</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
            Live Sync Active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TemplateDesigner />
      </div>
    </div>
  );
};

export default TemplateDesignerPage;
