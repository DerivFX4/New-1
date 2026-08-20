import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      'import.meta.env.DERIV_APP_ID': JSON.stringify(process.env.DERIV_APP_ID || ''),
      'import.meta.env.DERIV_REDIRECT_URL': JSON.stringify(process.env.DERIV_REDIRECT_URL || ''),
      'import.meta.env.DERIV_OAUTH_SCOPE': JSON.stringify(process.env.DERIV_OAUTH_SCOPE || 'trade'),
    },
  },
  output: { distPath: { root: 'dist' } },
});
