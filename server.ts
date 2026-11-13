import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_HMR_DISABLED = process.env.DISABLE_HMR === 'true';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  // =========================================================================
  // VITE / STATIC SPA SERVING
  // =========================================================================
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      plugins: IS_HMR_DISABLED
        ? [
            {
              name: 'disable-vite-client-ws-connect',
              enforce: 'post',
              transform(code, id) {
                if (
                  id.endsWith('/vite/dist/client/client.mjs') ||
                  code.includes('transport.connect(createHMRHandler(handleMessage))')
                ) {
                  return code.replace(
                    'transport.connect(createHMRHandler(handleMessage));',
                    '/* WebSocket HMR transport disabled via DISABLE_HMR=true */'
                  );
                }
              },
            },
          ]
        : [],
      server: IS_HMR_DISABLED
        ? { middlewareMode: true, hmr: false, ws: false }
        : {
            middlewareMode: true,
            hmr: { server: httpServer },
            ws: { server: httpServer },
          },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`NaijaReel server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
