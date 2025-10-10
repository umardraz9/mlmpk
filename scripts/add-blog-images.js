const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addBlogImages() {
  console.log('🖼️ Adding royalty-free images to blog posts...')

  try {
    // Update blog posts with Unsplash royalty-free images
    const updates = [
      {
        slug: 'first-month-success-story',
        image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800&q=80'
      },
      {
        slug: 'mlm-recruitment-guide',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'
      },
      {
        slug: 'daily-habits-success',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
      },
      {
        slug: 'product-review-marketing-course',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
      },
      {
        slug: 'beginner-guide-30-days',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80'
      }
    ]

    for (const update of updates) {
      await prisma.blogPost.update({
        where: { slug: update.slug },
        data: { featuredImage: update.image }
      })
      console.log(`✅ Updated blog post ${update.slug} with image`)
    }

    console.log('\n🎉 Blog post images updated successfully!')

  } catch (error) {
    console.error('❌ Error updating blog images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addBlogImages()
