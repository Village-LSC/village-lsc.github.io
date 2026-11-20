/// <reference types="vite/client" />

declare module 'virtual:portfolio-works' {
  export interface PortfolioWorkFile {
    fileName: string;
    path: string;
  }

  const worksByCategory: Record<string, PortfolioWorkFile[]>;
  export default worksByCategory;
}
