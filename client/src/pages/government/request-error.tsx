import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function GovernmentRequestError({ error, retry }: { error: Error | null; retry: () => void }) {
  if (!error) return null;
  const message = error instanceof ApiError && error.status === 401
    ? "Session expired. Sign in again to view government data."
    : error instanceof ApiError && error.status === 403
      ? "Unauthorized. Your account cannot access this government data."
      : "Government data is unavailable. Please try again.";
  return <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
    {message} <Button variant="outline" size="sm" onClick={retry}>Retry</Button>
  </div>;
}
