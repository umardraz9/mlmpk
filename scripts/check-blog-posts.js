const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBlogPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        status: true,
        publishedAt: true,
        views: true,
        likes: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${posts.length} published blog posts:`);
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Image: ${post.featuredImage}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Published: ${post.publishedAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error checking blog posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogPosts();
