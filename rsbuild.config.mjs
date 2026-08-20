import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig(({ envMode }) => {
  const env = loadEnv({ prefixes: ['DERIV_'], mode: envMode });

  return {
    plugins: [pluginReact()],
    source: {
      define: {
        'import.meta.env.DERIV_APP_ID': JSON.stringify(env.parsed.DERIV_APP_ID || ''),
        'import.meta.env.DERIV_REDIRECT_URL': JSON.stringify(env.parsed.DERIV_REDIRECT_URL || ''),
        'import.meta.env.DERIV_OAUTH_SCOPE': JSON.stringify(env.parsed.DERIV_OAUTH_SCOPE || ''),
      },
    },
    output: { distPath: { root: 'dist' } },
  };
});
