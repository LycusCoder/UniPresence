/**
 * Vite Plugin to Disable Host Check
 * Allows access from any domain/network - useful for development/demo
 */
import type { Plugin } from 'vite';

export function disableHostCheck(): Plugin {
  return {
    name: 'disable-host-check',
    configureServer(server) {
      // Patch the middlewares to allow all hosts
      server.middlewares.use((req, res, next) => {
        // Allow any host
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        next();
      });
    },
  };
}
