/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Adicione esta linha
  images: {
    unoptimized: true, // Necessário se você usa o componente <Image /> do Next
  },
};

module.exports = nextConfig;