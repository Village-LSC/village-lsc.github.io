import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const CATEGORY_DIR_RE = /^([1-7])(?:_.*)?$/;

const portfolioWorksPlugin = (): Plugin => {
  const virtualModuleId = 'virtual:portfolio-works';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  const imagesDir = path.resolve(__dirname, 'public/images');

  const scanWorks = () => {
    const worksByCategory: Record<string, Array<{ fileName: string; path: string }>> = {
      '1': [],
      '2': [],
      '3': [],
      '4': [],
      '5': [],
      '6': [],
      '7': [],
    };

    if (!fs.existsSync(imagesDir)) {
      return worksByCategory;
    }

    const entries = fs.readdirSync(imagesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const match = CATEGORY_DIR_RE.exec(entry.name);
      if (!match) continue;

      const categoryId = match[1];
      const categoryPath = path.join(imagesDir, entry.name);
      const files = fs
        .readdirSync(categoryPath, { withFileTypes: true })
        .filter((file) => file.isFile() && IMAGE_EXT_RE.test(file.name))
        .map((file) => file.name)
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

      for (const fileName of files) {
        worksByCategory[categoryId].push({
          fileName,
          path: `images/${encodeURIComponent(entry.name)}/${encodeURIComponent(fileName)}`,
        });
      }
    }

    return worksByCategory;
  };

  return {
    name: 'portfolio-works-auto-loader',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const works = scanWorks();
        return `export default ${JSON.stringify(works)};`;
      }
    },
    configureServer(server) {
      server.watcher.add(imagesDir);
      const invalidate = (filePath: string) => {
        if (filePath.startsWith(imagesDir)) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
        }
      };
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);
    },
  };
};

// Кастомный плагин для автоматической трансформации старых путей ассетов
const pathFixerPlugin = () => ({
  name: 'transform-legacy-asset-paths',
  transform(code: string, id: string) {
    // Обрабатываем только файлы исходного кода (ts, tsx, js, jsx)
    if (/\.(ts|tsx|js|jsx)$/.test(id)) {
      let updatedCode = code;

      // Авто-замена для картинок: /src/assets/images/ -> /images/
      updatedCode = updatedCode.replace(/\/src\/assets\/images\//g, '/images/');

      // Авто-замена для аудио: /src/assets/lobby.mp3 -> /lobby.mp3
      updatedCode = updatedCode.replace(/\/src\/assets\/lobby\.mp3/g, '/lobby.mp3');

      return {
        code: updatedCode,
        map: null, // отключаем sourcemap для скорости
      };
    }
  },
});

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [portfolioWorksPlugin(), pathFixerPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
