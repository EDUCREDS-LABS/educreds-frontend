import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketplaceAuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No authentication token found");
      return;
    }

    // Store token in marketplace auth storage
    localStorage.setItem("marketplace_token", token);
    localStorage.setItem("auth_type", "marketplace");
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent("marketplaceAuthStateChange", { 
      detail: { isAuthenticated: true } 
    }));

    setStatus("success");
    setMessage("Successfully authenticated!");

    // Redirect to marketplace after 2 seconds
    setTimeout(() => {
      setLocation("/marketplace");
    }, 2000);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Authentication Status</CardTitle>
          <CardDescription>Please wait while we complete your sign-in</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Processing authentication...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600" />
              <p className="text-lg font-medium text-green-700">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting to marketplace...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-600" />
              <p className="text-lg font-medium text-red-700">{message}</p>
              <Button
                onClick={() => setLocation("/marketplace/login")}
                className="mt-4"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


