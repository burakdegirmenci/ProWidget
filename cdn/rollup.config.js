/**
 * Rollup Configuration
 * Builds CDN-ready widget bundle
 *
 * @module rollup.config
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import cssnano from 'cssnano';

const isProduction = process.env.NODE_ENV === 'production';

// Shared plugins
const sharedPlugins = [
  resolve({
    browser: true
  }),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    presets: [
      ['@babel/preset-env', {
        targets: '> 1%, last 2 versions, not dead',
        modules: false
      }]
    ],
    exclude: 'node_modules/**'
  })
];

// Terser config
const terserConfig = terser({
  compress: {
    drop_console: isProduction,
    drop_debugger: isProduction,
    pure_funcs: isProduction ? ['console.log', 'console.debug'] : []
  },
  mangle: {
    reserved: ['PWX']
  },
  format: {
    comments: false
  }
});

export default [
  // ========================================
  // Ana PWX Bundle
  // ========================================
  {
    input: 'src/core/init.js',
    output: [
      {
        file: 'dist/pwx.js',
        format: 'iife',
        name: 'PWX',
        sourcemap: !isProduction
      },
      {
        file: 'dist/pwx.min.js',
        format: 'iife',
        name: 'PWX',
        sourcemap: false,
        plugins: [terserConfig]
      }
    ],
    plugins: [
      ...sharedPlugins,
      postcss({
        extract: 'pwx.css',
        minimize: isProduction,
        plugins: isProduction ? [cssnano()] : [],
        inject: false
      })
    ]
  },

  // ========================================
  // Selector Agent (Admin Panel için)
  // ========================================
  {
    input: 'src/tools/selector-agent.js',
    output: [
      {
        file: 'dist/selector-agent.js',
        format: 'iife',
        name: 'PWXSelector',
        sourcemap: !isProduction
      },
      {
        file: 'dist/selector-agent.min.js',
        format: 'iife',
        name: 'PWXSelector',
        sourcemap: false,
        plugins: [terserConfig]
      }
    ],
    plugins: sharedPlugins
  }
];
