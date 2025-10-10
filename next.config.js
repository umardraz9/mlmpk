/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Optimize build output
  optimizeFonts: true,
  
  // Enable SWC minification (default in Next.js 13+)
  swcMinify: true,
  
  // Performance optimizations
  // swcMinify is now default in Next.js 13+
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Improved caching strategies
  onDemandEntries: {
    maxInactiveAge: process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 25 * 1000,
    pagesBufferLength: process.env.NODE_ENV === 'production' ? 10 : 2,
  },
  
  // Module optimization
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui': {
      transform: '@radix-ui/{{member}}',
    },
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return [
      // CORS headers for API
      {
        source: '/api/tasks/complete',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
      
      // Static asset caching for images
      {
        source: '/:path(.+)\\.(ico|svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProduction 
              ? 'public, max-age=31536000, immutable' 
              : 'public, max-age=3600',
          },
        ],
      },
      
      // Font caching
      {
        source: '/:path(.+)\\.(woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // JS/CSS caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isProduction
              ? 'public, max-age=31536000, immutable'
              : 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      
      // API routes caching
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isProduction
              ? 's-maxage=60, stale-while-revalidate=300'
              : 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      
      // Security headers
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            // Allow microphone on this origin; keep camera and geolocation disabled
            value: 'microphone=(self), camera=(), geolocation=()',
          },
        ],
      },
      
      // HTML pages caching
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isProduction
              ? 's-maxage=10, stale-while-revalidate=60'
              : 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-dialog', 
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      'framer-motion',
      'react-hook-form',
      'chart.js'
    ],
    // Enable modern bundling optimizations
    optimizeCss: true,
    webpackBuildWorker: true,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 1 hour cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    path: '/_next/image',
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development',
  },
  serverExternalPackages: ['bcryptjs', 'ua-parser-js'],
  webpack: (config, { dev, isServer, webpack }) => {
    // Fix 'self is not defined' error for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Fix alias resolution for lucide-react and radix-ui
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react': require.resolve('lucide-react'),
      '@radix-ui/react-slot': require.resolve('@radix-ui/react-slot'),
      '@radix-ui/react-dialog': require.resolve('@radix-ui/react-dialog'),
      '@radix-ui/react-dropdown-menu': require.resolve('@radix-ui/react-dropdown-menu'),
      '@radix-ui/react-accordion': require.resolve('@radix-ui/react-accordion'),
    };

    // Define globals only for client builds; doing this on the server can break SSR guards
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'typeof window': JSON.stringify('object'),
          'typeof self': JSON.stringify('object'),
          'typeof global': JSON.stringify('object'),
        })
      );
    }

    // Ensure proper chunk generation
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Optimize images and fonts
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset',
      parser: {
        dataUrlCondition: {
          maxSize: 8 * 1024, // 8kb
        },
      },
    });

    return config;
  }
}

module.exports = nextConfig