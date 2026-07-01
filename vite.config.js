import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
import { compileUIKit } from '@iwsdk/vite-plugin-uikitml';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';
import path from 'path';
import fs from 'fs';
import os from 'os';

const mkcertDir = path.join(os.homedir(), '.vite-plugin-mkcert');
const mkcertKey = path.join(mkcertDir, 'dev.pem');
const mkcertCert = path.join(mkcertDir, 'cert.pem');
const hasLocalCerts = fs.existsSync(mkcertKey) && fs.existsSync(mkcertCert);

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        ...(hasLocalCerts ? [] : [mkcert()]),
        iwsdkDev({
            // Disable IWER desktop emulator — ClaimCam VR runs on real headsets only.
            emulator: {
                device: 'metaQuest3',
                activation: /^$/,
            },
            ai: { tools: ['claude'] },
            verbose: true
        }),
        compileUIKit({ sourceDir: 'ui', outputDir: 'public/ui', verbose: true }),
    ],
    resolve: {
        alias: {
            three: path.resolve('./node_modules/three'),
        }
    },
    server: {
        host: '0.0.0.0',
        port: 8081,
        open: true,
        ...(hasLocalCerts
            ? {
                  https: {
                      key: fs.readFileSync(mkcertKey),
                      cert: fs.readFileSync(mkcertCert),
                  },
              }
            : {}),
    },
    build: {
        outDir: 'dist',
        sourcemap: process.env.NODE_ENV !== 'production',
        target: 'esnext',
        rollupOptions: { input: './index.html' }
    },
    esbuild: { target: 'esnext' },
    optimizeDeps: {
        exclude: ['@babylonjs/havok'],
        esbuildOptions: { target: 'esnext' }
    },
    publicDir: 'public',
    base: './'
});
