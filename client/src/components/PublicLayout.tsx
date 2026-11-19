import React from "react";
import ModernHeader from "@/components/modern/ModernHeader";
import ModernFooter from "@/components/modern/ModernFooter";

/**
 * PublicLayout wraps all unauthenticated / public-facing routes with a
 * consistent shell (ModernHeader + ModernFooter). Fixes the "bare page,
 * no navigation" cohesion defect identified in SYSTEM_COHESION_PLAN §1.4.
 *
 * Used by:
 *  - /student-portal
 *  - /verify, /employer/verify
 *  - /claim/:token
 *  - /identity/:eduCredsId
 *  - /templates/* (public browse)
 */
interface PublicLayoutProps {
  children: React.ReactNode;
  /**
   * Set to false when the child page renders its own hero/nav (e.g. LandingPage).
   * Defaults to true.
   */
  withFooter?: boolean;
  /**
   * Optional handler for the header's "Student Portal" action. Pages that need
   * custom behaviour (e.g. navigate to /student-portal) pass it here instead of
   * rendering their own header, which would duplicate ModernHeader.
   */
  onStudentPortalClick?: () => void;
}

export default function PublicLayout({ children, withFooter = true, onStudentPortalClick }: PublicLayoutProps) {
  return (
    <div
      data-testid="public-layout"
      className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300"
    >
      <ModernHeader onStudentPortalClick={onStudentPortalClick} />
      <main data-testid="public-layout-content" className="flex-1">
        {children}
      </main>
      {withFooter && <ModernFooter />}
    </div>
  );
}
