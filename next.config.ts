import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // @react-pdf/renderer usa pdfkit/fontkit (CJS nativo) — no bundlear para el cliente
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
