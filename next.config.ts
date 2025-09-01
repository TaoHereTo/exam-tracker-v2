import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // 简化的webpack配置
  webpack: (config, { isServer, dev }) => {
    // 处理OneDrive路径问题
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.git', '**/.next'],
    };

    // 生产环境优化
    if (!dev) {
      // 优化包大小
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };

      // 减少构建时的内存使用
      config.optimization.minimize = true;
    }

    // 处理WebGL相关模块
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    });

    return config;
  },

  // 实验性功能
  experimental: {
    // 优化内存使用
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // 配置transpilePackages以支持react-md-editor
  transpilePackages: ['@uiw/react-md-editor'],

  // 压缩配置
  compress: true,

  // 生产环境优化
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
