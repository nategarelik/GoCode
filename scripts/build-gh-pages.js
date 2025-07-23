#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

console.log('🔧 Preparing build for GitHub Pages...');

// Copy public assets to dist
const publicAssets = ['sw.js', 'manifest.json', 'favicon.svg', 'favicon.png', 'logo.svg'];
const publicPath = path.join(__dirname, '..', 'public');

publicAssets.forEach(asset => {
  const src = path.join(publicPath, asset);
  const dest = path.join(distPath, asset);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${asset}`);
  }
});

// Copy icons directory
const iconsPath = path.join(publicPath, 'icons');
const destIconsPath = path.join(distPath, 'icons');

if (fs.existsSync(iconsPath)) {
  fs.mkdirSync(destIconsPath, { recursive: true });
  fs.readdirSync(iconsPath).forEach(file => {
    fs.copyFileSync(
      path.join(iconsPath, file),
      path.join(destIconsPath, file)
    );
  });
  console.log('✅ Copied icons directory');
}

// Copy screenshots directory
const screenshotsPath = path.join(publicPath, 'screenshots');
const destScreenshotsPath = path.join(distPath, 'screenshots');

if (fs.existsSync(screenshotsPath)) {
  fs.mkdirSync(destScreenshotsPath, { recursive: true });
  fs.readdirSync(screenshotsPath).forEach(file => {
    fs.copyFileSync(
      path.join(screenshotsPath, file),
      path.join(destScreenshotsPath, file)
    );
  });
  console.log('✅ Copied screenshots directory');
}

// Update paths in index.html
const indexPath = path.join(distPath, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Since Vite already adds /GoCode/ prefix, we don't need to change those paths
// Just ensure the service worker registration uses the correct path
indexHtml = indexHtml
  .replace(/register\('\/sw\.js'\)/g, "register('./sw.js')");

fs.writeFileSync(indexPath, indexHtml);
console.log('✅ Updated paths in index.html');

// Update manifest.json to use relative paths
const manifestPath = path.join(distPath, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update icon paths
  if (manifest.icons) {
    manifest.icons = manifest.icons.map(icon => ({
      ...icon,
      src: icon.src.replace(/^\//, './')
    }));
  }
  
  // Update start_url
  if (manifest.start_url) {
    manifest.start_url = './';
  }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated paths in manifest.json');
}

// Update service worker to handle relative paths
const swPath = path.join(distPath, 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Update cache name to include version
  swContent = swContent.replace(
    /const CACHE_NAME = ['"][\w-]+['"]/,
    `const CACHE_NAME = 'gocode-v${Date.now()}'`
  );
  
  // Update paths in urlsToCache
  swContent = swContent.replace(/['"]\/(?!\/)/g, '"./');
  
  fs.writeFileSync(swPath, swContent);
  console.log('✅ Updated service worker');
}

console.log('\n✨ GitHub Pages build preparation complete!');