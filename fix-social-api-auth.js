// Script to fix all social API routes to use custom session management
const fs = require('fs');
const path = require('path');

function findAllSocialApiFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAllSocialApiFiles(fullPath, files);
    } else if (item.endsWith('.ts')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('getServerSession(authOptions)') || content.includes('from \'next-auth\'')) {
          files.push(fullPath);
        }
      } catch (error) {
        console.log(`Error reading ${fullPath}: ${error.message}`);
      }
    }
  }
  
  return files;
}

function updateSocialApiFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace NextAuth imports
    if (content.includes('import { authOptions }')) {
      content = content.replace(/import\s*{\s*authOptions\s*}\s*from\s*['"][^'"]*['"]/, '');
      updated = true;
    }
    
    if (content.includes('from \'next-auth\'')) {
      content = content.replace(/import\s*{\s*getServerSession\s*}\s*from\s*['"]next-auth['"]/, '');
      updated = true;
    }
    
    // Add custom session import if not present
    if (!content.includes('from \'@/lib/session\'')) {
      // Find the first import statement and add our import after it
      const importMatch = content.match(/^import.*$/m);
      if (importMatch) {
        const insertIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, insertIndex) + '\nimport { getServerSession } from \'@/lib/session\'' + content.slice(insertIndex);
        updated = true;
      }
    }
    
    // Replace getServerSession(authOptions) with getServerSession()
    if (content.includes('getServerSession(authOptions)')) {
      content = content.replace(/getServerSession\(authOptions\)/g, 'getServerSession()');
      updated = true;
    }
    
    // Clean up extra empty lines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✅ Updated: ${relativePath}`);
      return true;
    } else {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`⚠️  No changes needed: ${relativePath}`);
      return false;
    }
    
  } catch (error) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.error(`❌ Error updating ${relativePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing all social API routes to use custom session management...\n');
  
  const socialApiDir = path.join(process.cwd(), 'src', 'app', 'api', 'social');
  const socialApiFiles = findAllSocialApiFiles(socialApiDir);
  
  console.log(`📁 Found ${socialApiFiles.length} social API files with NextAuth:\n`);
  
  let updatedCount = 0;
  
  for (const filePath of socialApiFiles) {
    if (updateSocialApiFile(filePath)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Summary:`);
  console.log(`📁 Total files found: ${socialApiFiles.length}`);
  console.log(`✅ Files updated: ${updatedCount}`);
  console.log(`⚠️  Files skipped: ${socialApiFiles.length - updatedCount}`);
  
  if (updatedCount > 0) {
    console.log('\n🚀 All social API routes updated to use custom session management!');
    console.log('💡 Social features should now work properly');
  } else {
    console.log('\n✅ All files were already up to date!');
  }
}

main();
