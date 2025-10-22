// Script to fix all NextAuth imports
const fs = require('fs');
const path = require('path');

// List of files that need to be updated (from grep results)
const filesToUpdate = [
  'src/hooks/useNotifications.ts',
  'src/components/Wallet.tsx',
  'src/app/withdraw/page.tsx',
  'src/app/wallet/page.tsx',
  'src/app/tasks/page.tsx',
  'src/app/support/returns/page.tsx',
  'src/app/support/returns/[id]/page.tsx',
  'src/app/support/returns/new/page.tsx',
  'src/app/tasks/demo/page.tsx',
  'src/app/social/profile/page.tsx',
  'src/app/social/page.tsx',
  'src/app/social/page-optimized.tsx',
  'src/app/social/page-optimized-v2.tsx',
  'src/app/social/notifications/page.tsx',
  'src/app/social/friends/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/products/page.tsx',
  'src/app/products/page-optimized.tsx',
  'src/app/products/page-new.tsx',
  'src/components/RealTimeTaskList.tsx',
  'src/components/social/FacebookCreatePost.tsx',
  'src/components/social/FacebookHeader.tsx',
  'src/components/social/FacebookPostCard.tsx',
  'src/components/social/FacebookSidebar.tsx',
  'src/components/social/MediaModal.tsx',
  'src/components/social/ModernCreatePost.tsx',
  'src/components/social/ModernPostCard.tsx',
  'src/components/social/ModernSocialHeader.tsx'
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;
    
    // Replace NextAuth useSession import
    if (content.includes("import { useSession } from 'next-auth/react'")) {
      content = content.replace(
        "import { useSession } from 'next-auth/react'",
        "import { useSession } from '@/hooks/useSession'"
      );
      updated = true;
    }
    
    // Replace NextAuth useSession and signOut import
    if (content.includes("import { useSession, signOut } from 'next-auth/react'")) {
      content = content.replace(
        "import { useSession, signOut } from 'next-auth/react'",
        "import { useSession, signOut } from '@/hooks/useSession'"
      );
      updated = true;
    }
    
    // Handle other NextAuth imports that might include useSession
    const nextAuthImportRegex = /import\s*{\s*([^}]*useSession[^}]*)\s*}\s*from\s*['"]next-auth\/react['"]/g;
    if (nextAuthImportRegex.test(content)) {
      content = content.replace(nextAuthImportRegex, (match, imports) => {
        return `import { ${imports} } from '@/hooks/useSession'`;
      });
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  No changes needed: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing all NextAuth imports...\n');
  
  let updatedCount = 0;
  let totalCount = 0;
  
  for (const filePath of filesToUpdate) {
    totalCount++;
    if (updateFile(filePath)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Summary:`);
  console.log(`📁 Total files checked: ${totalCount}`);
  console.log(`✅ Files updated: ${updatedCount}`);
  console.log(`⚠️  Files skipped: ${totalCount - updatedCount}`);
  
  if (updatedCount > 0) {
    console.log('\n🚀 All NextAuth imports have been updated to use custom session!');
    console.log('💡 Try refreshing your browser now (Ctrl+F5)');
  } else {
    console.log('\n✅ All files were already up to date!');
  }
}

main();
