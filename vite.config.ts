import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath, URL } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";


const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  envDir: __dirname,
  // Optimize dependencies to prevent circular dependency issues
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      '@tanstack/react-query',
      'axios',
      'zustand'
    ],
    exclude: ['grapesjs'] // GrapesJS is large and doesn't benefit much from pre-bundling
  },
  plugins: [
    tailwindcss(),
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
    // Bundle analyzer - disabled in Docker builds to prevent path resolution issues
    // Use locally: NODE_ENV=production vite build for bundle analysis
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      // Ensure React is not duplicated across chunks
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: false, // Disable minification to avoid variable initialization issues
    // Ensure proper module initialization order
    reportCompressedSize: false,
    rollupOptions: {
      // Use default and safer Rollup chunking to avoid custom circular chunk issues.
      preserveEntrySignatures: 'strict',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/trust-agent': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      // Ensure /Api is NOT proxied and NOT handled by Vite
      '/Api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
