/**
 * Student Portal — entry point
 *
 * Routes authenticated students to CredentialWallet.
 * Unauthenticated students see a clean access-method chooser.
 */

import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { CredentialWallet } from "@/components/student/CredentialWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Wallet, ShieldCheck, Award, ArrowRight, GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function StudentAccessChooser() {
  const navigate = useNavigate();

  const options = [
    {
      id: "email",
      icon: Mail,
      label: "Access with email",
      sub: "Receive a one-time code to access your credentials",
      primary: true,
      onClick: () => navigate("/auth/student-login"),
    },
    {
      id: "wallet",
      icon: Wallet,
      label: "Access with wallet",
      sub: "Connect your Web3 wallet to view and share credentials",
      primary: false,
      onClick: () => navigate("/auth/student-login?method=wallet"),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-8">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
            <GraduationCap className="size-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Your EduCreds Wallet
          </h1>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto">
            Access, share, and manage your verified academic credentials
          </p>
        </div>

        {/* Access options */}
        <div className="space-y-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={opt.onClick}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.01] hover:shadow-md ${
                  opt.primary
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-600"
                    : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-400"
                }`}
              >
                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                  opt.primary ? "bg-blue-600 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                }`}>
                  <Icon className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black ${opt.primary ? "text-blue-700 dark:text-blue-300" : "text-neutral-900 dark:text-neutral-100"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">{opt.sub}</p>
                </div>
                <ArrowRight className={`size-5 shrink-0 ${opt.primary ? "text-blue-600" : "text-neutral-300"}`} />
              </button>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 text-xs text-neutral-400">
          {[
            { icon: ShieldCheck, label: "Privacy first" },
            { icon: Award,       label: "Verified credentials" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <span key={s.label} className="flex items-center gap-1.5">
                <Icon className="size-3" />
                {s.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function StudentPortalPage() {
  const { isAuthenticated, authType, user } = useAuth();

  const isStudentAuth = isAuthenticated && (
    authType === AuthType.STUDENT ||
    authType === AuthType.MARKETPLACE ||
    (user as any)?.role === "student"
  );

  if (!isStudentAuth) {
    return <StudentAccessChooser />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 py-8">
      <CredentialWallet />
    </div>
  );
}
