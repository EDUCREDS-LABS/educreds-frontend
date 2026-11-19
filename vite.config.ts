import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath, URL } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { visualizer } from "rollup-plugin-visualizer";


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vendor chunking: isolate heavy third-party libs so the initial bundle stays
// small and circular-import risk is contained per vendor. Default Rollup
// chunking previously exposed a TDZ/circular-import bug under minification.
//
// IMPORTANT: The order of checks matters for breaking circular deps.
// Previously: vendor-react (contains @tanstack/react-query) imported from
// vendor catch-all (contains @tanstack/query-core + idb). Those catch-all
// packages also imported back from vendor-react (zustand, framer, radix →
// react), creating a TDZ cycle under Rollup's ESM live-binding semantics.
// Fix: explicitly co-locate @tanstack/query-core, @tanstack/table-core, and
// idb into vendor-react so the cycle is eliminated.
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;

  // All React-dependent third-party code is co-located into ONE vendor chunk.
  //
  // WHY: Rollup/Terser splits each manual chunk into its own module scope with
  // hoisted `var` imports. When two vendor chunks reference each other at
  // *module-init time* (e.g. vendor-react ↔ vendor-web3), the imported binding
  // is still in the TDZ when the other chunk evaluates, producing a production-
  // only crash like "Object.defineProperty called on non-object" / "Cannot
  // access 'x' before initialization". This only happens in the minified build,
  // which is why `npm run dev` works but production renders a blank page.
  //
  // Keeping every React-importing package in a single chunk removes the cycle
  // entirely (intra-chunk ESM live bindings are safe). Lazy route chunks still
  // split correctly because they only *import* from this vendor chunk (a DAG,
  // not a cycle).
  //
  // The only libs kept separate are pure, non-React leaves (no React import),
  // so they cannot participate in a vendor-react cycle.
  if (
    id.includes("three") ||
    id.includes("@react-three") || // NOTE: @react-three imports React; if it ever
                                   // causes a TDZ, move it into vendor too.
    id.includes("fabric") ||
    id.includes("grapesjs") ||
    id.includes("face-api.js") ||
    id.includes("opencv.js")
  ) {
    return "vendor-isolated";
  }

  return "vendor";
}

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
    ...(process.env.NODE_ENV !== "production" ? [runtimeErrorOverlay()] : []),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
      ]
      : []),
    // Bundle analyzer - disabled in Docker builds to prevent path resolution issues
    // Use locally: ANALYZE=true vite build
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: "dist/stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
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
    minify: "esbuild",
    // Ensure proper module initialization order
    reportCompressedSize: false,
    commonjsOptions: {
      // Transform mixed ESM/CJS modules to prevent TDZ issues from CJS modules
      // that reference ES live-bindings before they are initialized.
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Use default and safer Rollup chunking to avoid custom circular chunk issues.
      preserveEntrySignatures: 'strict',
      output: {
        manualChunks,
        // Prevent Rollup from merging small chunks aggressively — merging can
        // reorder module initializers and trigger TDZ on const declarations.
        experimentalMinChunkSize: 0,
      },
    },
  },
  server: {
    port: 5002,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".loca.lt",
      ".tunnelmole.net",
      ...(process.env.VITE_ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean),
    ],
    proxy: {
      '/api/trust-agent': {
        target: 'http://localhost:3010',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:5050',
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
