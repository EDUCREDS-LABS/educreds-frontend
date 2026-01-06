import MarketplaceAuth from "@/components/marketplace/MarketplaceAuth";

export default function MarketplaceLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Marketplace Login</h1>
          <p className="text-neutral-600">Firebase authentication is being configured</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <div className="text-center">
            <p className="text-sm text-neutral-600 mb-4">
              Marketplace authentication is temporarily unavailable while Firebase is being configured.
            </p>
            <p className="text-sm text-neutral-500">
              Please use institution login for now:
            </p>
            <a href="/login" className="inline-block mt-3 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
              Institution Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}