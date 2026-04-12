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
    minify: 'esbuild',
    // Ensure proper module initialization order
    reportCompressedSize: false,
    rollupOptions: {
      // Prevent circular dependency issues
      preserveEntrySignatures: 'strict',
      output: {
        manualChunks: (id) => {
          // Always keep React in the main vendor chunk to ensure availability
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }

          // Vendor chunks for large libraries
          if (id.includes('node_modules')) {
            // GrapesJS editor - largest dependency
            if (id.includes('grapesjs')) {
              return 'editor-vendor';
            }
            // Wallet and crypto libraries
            if (id.includes('@walletconnect') ||
                id.includes('@reown') ||
                id.includes('viem') ||
                id.includes('wagmi') ||
                id.includes('@ethersproject') ||
                id.includes('ox')) {
              return 'wallet-vendor';
            }
            // Chart libraries
            if (id.includes('recharts') ||
                id.includes('chart') ||
                id.includes('d3')) {
              return 'charts-vendor';
            }
            // UI libraries - temporarily disable separate chunking
            // if (id.includes('@radix-ui') ||
            //     id.includes('lucide-react') ||
            //     id.includes('framer-motion')) {
            //   return 'ui-vendor';
            // }
            // Form libraries - bundle with main vendor to avoid initialization issues
            // if (id.includes('react-hook-form') ||
            //     id.includes('@hookform') ||
            //     id.includes('zod') ||
            //     id.includes('zod-validation-error')) {
            //   return 'forms-vendor';
            // }
            // Other large vendor libraries
            if (id.includes('react-query') ||
                id.includes('@tanstack') ||
                id.includes('axios') ||
                id.includes('date-fns')) {
              return 'utils-vendor';
            }
            // Everything else goes to a general vendor chunk
            return 'vendor';
          }
          // Application code chunks
          if (id.includes('/src/pages/')) {
            // Group related pages
            if (id.includes('/auth/')) {
              return 'auth-pages';
            }
            if (id.includes('/institution/')) {
              return 'institution-pages';
            }
            if (id.includes('/admin/')) {
              return 'admin-pages';
            }
            if (id.includes('/marketplace/')) {
              return 'marketplace-pages';
            }
            if (id.includes('/templates/') || id.includes('/designer/')) {
              return 'designer-pages';
            }
            return 'pages';
          }
          if (id.includes('/src/components/')) {
            // Group large component groups
            if (id.includes('/modern/') || id.includes('/ui/')) {
              return 'ui-components';
            }
            if (id.includes('/editor/') || id.includes('/designer/')) {
              return 'editor-components';
            }
            if (id.includes('/marketplace/')) {
              return 'marketplace-components';
            }
            return 'components';
          }
        },
      },
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
