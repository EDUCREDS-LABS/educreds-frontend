import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE),
    'import.meta.env.VITE_CERT_API_BASE': JSON.stringify(process.env.VITE_CERT_API_BASE || 'http://localhost:3001'),
    'import.meta.env.VITE_CONTRACT_ADDRESS': JSON.stringify(process.env.VITE_CONTRACT_ADDRESS || '0xBD4228241dc6BC14C027bF8B6A24f97bc9872068'),
    'import.meta.env.VITE_ETHEREUM_RPC_URL': JSON.stringify(process.env.VITE_ETHEREUM_RPC_URL),
  },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
