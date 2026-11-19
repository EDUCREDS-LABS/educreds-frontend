import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function parseSubdomain(hostname: string): { env: string | null; service: string | null } {
  const parts = hostname.split('.');
  if (parts.length <= 2) {
    return { env: null, service: null };
  }

  const first = parts[0];
  const second = parts[1];

  if (['dev', 'staging', 'prod'].includes(first)) {
    return { env: first, service: second };
  }

  if (['dev', 'staging', 'prod'].includes(second) && first !== 'www') {
    return { env: second, service: first };
  }

  return { env: null, service: first };
}

function getSubdomainTitle(env: string | null, service: string | null): string {
  const envLabel = env ? `${env.charAt(0).toUpperCase() + env.slice(1)} ` : '';
  const titles: Record<string, string> = {
    doc: 'Documentation',
    admin: 'Platform Admin',
    verify: 'Verification Portal',
    app: 'EduCreds',
  };
  const serviceTitle = service ? titles[service] || service : 'EduCreds';
  return `${envLabel}${serviceTitle}`;
}

function getSubdomainRedirect(service: string | null): string | null {
  if (!service || service === 'app' || service === 'www') return null;
  const redirects: Record<string, string> = {
    doc: '/documentation',
    docs: '/documentation',
    documentation: '/documentation',
    admin: '/admin',
    verify: '/verify',
    verification: '/verify',
  };
  return redirects[service] || null;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
    host: "0.0.0.0",
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (...args: Parameters<typeof viteLogger.error>) => {
        const [msg, options] = args;
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Vite must run first so module scripts (/src/*, /@vite/*, assets) are not
  // swallowed by the SPA HTML fallback.
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/Api')) {
      return next();
    }
    return vite.middlewares(req, res, next);
  });

  // SPA HTML fallback for client routes only. Do not mount on "*" — Express
  // strips the matched path and turns /src/main.tsx into /, which previously
  // returned text/html for every module script.
  app.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    if (req.originalUrl.startsWith('/Api')) {
      return next();
    }

    const urlPath = req.originalUrl.split('?')[0];

    if (
      urlPath.startsWith('/@vite') ||
      urlPath.startsWith('/@react-refresh') ||
      urlPath.startsWith('/@fs') ||
      urlPath.startsWith('/src/') ||
      urlPath.startsWith('/node_modules/') ||
      urlPath.startsWith('/assets/') ||
      (urlPath.includes('.') && !urlPath.endsWith('.html'))
    ) {
      return next();
    }

    const host = req.hostname;
    const { env, service } = parseSubdomain(host);
    const subdomainRedirect = getSubdomainRedirect(service);

    let pageUrl = req.originalUrl;
    if (subdomainRedirect && (urlPath === '/' || urlPath === '/index.html')) {
      pageUrl = subdomainRedirect;
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      const appEnv = env || 'prod';
      const subdomain = service || 'app';
      const title = getSubdomainTitle(env, service);

      template = template.replace(
        '<title>EduCreds - Decentralized Academic Credentialing Infrastructure</title>',
        `<title>${title}</title>`
      );

      template = template.replace(
        '<meta name="description" content="EduCreds provides enterprise-grade blockchain infrastructure for issuing, managing, and verifying tamper-proof academic credentials globally." />',
        `<meta name="description" content="${appEnv === 'prod' ? 'EduCreds provides enterprise-grade blockchain infrastructure for issuing, managing, and verifying tamper-proof academic credentials globally.' : `${appEnv} environment – EduCreds platform`}" />`
      );

      const canonicalDomain = env
        ? `${env === 'prod' ? '' : env + '-'}${subdomain}.educreds.xyz`
        : `${subdomain}.educreds.xyz`;
      const canonicalPath = pageUrl.split('?')[0];
      const canonicalUrl = `https://${canonicalDomain}${canonicalPath === '/' ? '' : canonicalPath}`;

      template = template.replace(
        '<link rel="canonical" href="https://educreds.xyz/" />',
        `<link rel="canonical" href="${canonicalUrl}" />`
      );

      template = template.replace(
        '<meta property="og:url" content="https://educreds.xyz/" />',
        `<meta property="og:url" content="${canonicalUrl}" />`
      );

      template = template.replace(
        '<meta property="twitter:url" content="https://educreds.xyz/" />',
        `<meta property="twitter:url" content="${canonicalUrl}" />`
      );

      // Replace inject marker and the original main.tsx tag together so the
      // app bootstrap script is only loaded once.
      template = template.replace(
        '    <!-- __SUBDOMAIN_INJECT__ -->\n    <script type="module" src="/src/main.tsx"></script>',
        `    <script>
       window.__APP_ENV__ = "${appEnv}";
       window.__SUBDOMAIN__ = "${subdomain}";
       window.__CANONICAL_URL__ = "${canonicalUrl}";
     </script>
     <script type="module" src="/src/main.tsx?v=${nanoid()}"></script>`
      );

      const page = await vite.transformIndexHtml(pageUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Subdomain-aware static serving: rewrite root to service path
  app.use((req, res, next) => {
    const host = req.hostname;
    const { env, service } = parseSubdomain(host);
    const subdomainRedirect = getSubdomainRedirect(service);

    if (subdomainRedirect && (req.url === '/' || req.url === '/index.html')) {
      req.url = subdomainRedirect;
    }

    // Inject subdomain globals for static HTML responses
    const originalSend = res.send;
    res.send = function (body: any) {
      if (typeof body === 'string' && body.includes('<html') && body.includes('</html>')) {
        const appEnv = env || 'prod';
        const subdomain = service || 'app';
        const canonicalDomain = env
          ? `${env === 'prod' ? '' : env + '-'}${subdomain}.educreds.xyz`
          : `${subdomain}.educreds.xyz`;
        const canonicalUrl = `https://${canonicalDomain}${req.url === '/' ? '' : req.url}`;

        body = body.replace(
          '<title>EduCreds - Decentralized Academic Credentialing Infrastructure</title>',
          `<title>${getSubdomainTitle(env, service)}</title>`
        );

        body = body.replace(
          '<link rel="canonical" href="https://educreds.xyz/" />',
          `<link rel="canonical" href="${canonicalUrl}" />`
        );

        body = body.replace(
          '<meta property="og:url" content="https://educreds.xyz/" />',
          `<meta property="og:url" content="${canonicalUrl}" />`
        );

        body = body.replace(
          '<meta property="twitter:url" content="https://educreds.xyz/" />',
          `<meta property="twitter:url" content="${canonicalUrl}" />`
        );

        body = body.replace(
          '    <script type="module" src="/src/main.tsx"></script>',
          `    <script>
       window.__APP_ENV__ = "${appEnv}";
       window.__SUBDOMAIN__ = "${subdomain}";
       window.__CANONICAL_URL__ = "${canonicalUrl}";
     </script>
     <script type="module" src="/src/main.tsx"></script>`
        );
      }
      return originalSend.call(this, body);
    };

    next();
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
