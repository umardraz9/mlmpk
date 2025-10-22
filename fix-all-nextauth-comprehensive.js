// Comprehensive script to fix ALL NextAuth imports
const fs = require('fs');
const path = require('path');

function findAllNextAuthFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
        findAllNextAuthFiles(fullPath, files);
      }
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('next-auth/react')) {
          files.push(fullPath);
        }
      } catch (error) {
        console.log(`Error reading ${fullPath}: ${error.message}`);
      }
    }
  }
  
  return files;
}

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace all variations of NextAuth imports
    const patterns = [
      // useSession only
      {
        from: /import\s*{\s*useSession\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { useSession } from '@/hooks/useSession'"
      },
      // signOut only
      {
        from: /import\s*{\s*signOut\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { signOut } from '@/hooks/useSession'"
      },
      // signIn only
      {
        from: /import\s*{\s*signIn\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { signIn } from '@/hooks/useSession'"
      },
      // useSession and signOut
      {
        from: /import\s*{\s*useSession\s*,\s*signOut\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { useSession, signOut } from '@/hooks/useSession'"
      },
      // signOut and useSession (reverse order)
      {
        from: /import\s*{\s*signOut\s*,\s*useSession\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { signOut, useSession } from '@/hooks/useSession'"
      },
      // useSession and signIn
      {
        from: /import\s*{\s*useSession\s*,\s*signIn\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { useSession, signIn } from '@/hooks/useSession'"
      },
      // signIn and useSession (reverse order)
      {
        from: /import\s*{\s*signIn\s*,\s*useSession\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { signIn, useSession } from '@/hooks/useSession'"
      },
      // All three
      {
        from: /import\s*{\s*useSession\s*,\s*signOut\s*,\s*signIn\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: "import { useSession, signOut, signIn } from '@/hooks/useSession'"
      },
      // Any other combination with spaces
      {
        from: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]next-auth\/react['"]/g,
        to: (match, imports) => {
          return `import { ${imports.trim()} } from '@/hooks/useSession'`;
        }
      }
    ];
    
    for (const pattern of patterns) {
      if (typeof pattern.to === 'function') {
        content = content.replace(pattern.from, pattern.to);
      } else {
        content = content.replace(pattern.from, pattern.to);
      }
      if (content !== fs.readFileSync(filePath, 'utf8')) {
        updated = true;
      }
    }
    
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
  console.log('🔧 Finding and fixing ALL NextAuth imports...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const nextAuthFiles = findAllNextAuthFiles(srcDir);
  
  console.log(`📁 Found ${nextAuthFiles.length} files with NextAuth imports:\n`);
  
  let updatedCount = 0;
  
  for (const filePath of nextAuthFiles) {
    if (updateFile(filePath)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Summary:`);
  console.log(`📁 Total files found: ${nextAuthFiles.length}`);
  console.log(`✅ Files updated: ${updatedCount}`);
  console.log(`⚠️  Files skipped: ${nextAuthFiles.length - updatedCount}`);
  
  if (updatedCount > 0) {
    console.log('\n🚀 All NextAuth imports have been updated to use custom session!');
    console.log('💡 Ready to commit and deploy to Vercel');
  } else {
    console.log('\n✅ All files were already up to date!');
  }
}

main();
