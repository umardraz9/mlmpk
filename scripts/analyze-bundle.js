#!/usr/bin/env node

/**
 * Bundle size analyzer script
 * Analyzes the built application to identify large dependencies and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Analyzing bundle size...\n');

const buildDir = path.join(process.cwd(), '.next');
const staticDir = path.join(buildDir, 'static');

if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Function to get directory size
function getDirSize(dirPath) {
  let size = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stats.size;
    }
  });
  
  return size;
}

// Function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Analyze chunks
function analyzeChunks(chunksDir) {
  if (!fs.existsSync(chunksDir)) {
    return [];
  }

  const chunks = [];
  const files = fs.readdirSync(chunksDir);
  
  files.forEach(file => {
    const filePath = path.join(chunksDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && file.endsWith('.js')) {
      chunks.push({
        name: file,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size)
      });
    }
  });
  
  return chunks.sort((a, b) => b.size - a.size);
}

// Main analysis
try {
  const totalSize = getDirSize(buildDir);
  const staticSize = getDirSize(staticDir);
  
  console.log('📦 Total Build Size:', formatBytes(totalSize));
  console.log('📁 Static Assets Size:', formatBytes(staticSize));
  console.log('');
  
  // Analyze JavaScript chunks
  const chunksDir = path.join(staticDir, 'chunks');
  const chunks = analyzeChunks(chunksDir);
  
  if (chunks.length > 0) {
    console.log('🔍 Top 10 Largest JavaScript Chunks:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    chunks.slice(0, 10).forEach((chunk, index) => {
      const bar = '█'.repeat(Math.min(50, Math.floor(chunk.size / 10000)));
      console.log(`${index + 1}. ${chunk.name}`);
      console.log(`   ${bar} ${chunk.sizeFormatted}`);
    });
    
    console.log('');
  }
  
  // Analyze pages
  const pagesDir = path.join(staticDir, 'chunks', 'pages');
  const pages = analyzeChunks(pagesDir);
  
  if (pages.length > 0) {
    console.log('📄 Top 10 Largest Page Bundles:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    pages.slice(0, 10).forEach((page, index) => {
      const bar = '█'.repeat(Math.min(50, Math.floor(page.size / 10000)));
      console.log(`${index + 1}. ${page.name}`);
      console.log(`   ${bar} ${page.sizeFormatted}`);
    });
    
    console.log('');
  }
  
  // Recommendations
  console.log('💡 Optimization Recommendations:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const largeChunks = chunks.filter(c => c.size > 200000); // > 200KB
  
  if (largeChunks.length > 0) {
    console.log('⚠️  Large chunks detected (> 200KB):');
    largeChunks.slice(0, 5).forEach(chunk => {
      console.log(`   - ${chunk.name} (${chunk.sizeFormatted})`);
    });
    console.log('   Consider code splitting or lazy loading for these modules.');
    console.log('');
  }
  
  if (totalSize > 5000000) { // > 5MB
    console.log('⚠️  Total build size is large. Consider:');
    console.log('   - Removing unused dependencies');
    console.log('   - Optimizing images with next/image');
    console.log('   - Using dynamic imports for heavy components');
    console.log('   - Tree-shaking unused code');
    console.log('');
  }
  
  console.log('✅ Use "npm install --save-dev @next/bundle-analyzer" for detailed analysis');
  console.log('   Then add ANALYZE=true npm run build to generate interactive report');
  
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}
