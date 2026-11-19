/**
 * Student Portal — Share Credential
 * Wrapper for CredentialSharingWizard with credentialId from URL params.
 */

import { useParams, useNavigate } from "react-router-dom";
import { CredentialSharingWizard } from "@/components/sharing/CredentialSharingWizard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function StudentSharePage() {
  const { credentialId } = useParams<{ credentialId: string }>();
  const navigate = useNavigate();

  if (!credentialId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">No credential specified.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-xl text-neutral-500 hover:text-neutral-800"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>
      <CredentialSharingWizard
        credentialId={credentialId}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
