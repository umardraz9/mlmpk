const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addProductImages() {
  console.log('🖼️ Adding royalty-free images to products...')

  try {
    // Update products with Unsplash royalty-free images
    const updates = [
      {
        slug: 'digital-marketing-course',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
      },
      {
        slug: 'mlm-business-kit',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
      },
      {
        slug: 'success-journal',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'
      },
      {
        slug: 'social-media-bundle',
        image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80'
      },
      {
        slug: 'entrepreneur-starter-pack',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'
      },
      {
        slug: 'productivity-masterclass',
        image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80'
      }
    ]

    for (const update of updates) {
      await prisma.product.update({
        where: { slug: update.slug },
        data: { images: update.image }
      })
      console.log(`✅ Updated ${update.slug} with image`)
    }

    console.log('\n🎉 Product images updated successfully!')

  } catch (error) {
    console.error('❌ Error updating product images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addProductImages()
