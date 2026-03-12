import React from 'react';
import TemplateDesigner from '../designer';

/**
 * Thin wrapper that mounts the full-screen TemplateDesigner with contextual
 * back-navigation pointing back to the institutional template library.
 *
 * The outer Layout header is intentionally NOT rendered here — TemplateDesigner
 * ships its own professional workspace header (logo, undo/redo, orientation
 * controls, preview, publish). Wrapping it in an additional header creates
 * visually redundant chrome and breaks the h-screen layout.
 */
const TemplateDesignerPage = () => (
  <TemplateDesigner
    backHref="/institution/templates"
    backLabel="Template Library"
  />
);

export default TemplateDesignerPage;
