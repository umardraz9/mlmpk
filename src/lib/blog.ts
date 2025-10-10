import { db } from '@/lib/db';
import { cache } from 'react';
import { notFound } from 'next/navigation';

export const getBlogPosts = cache(async () => {
  try {
    const posts = await db.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        category: true,
        author: true,
        tags: true,
      },
    });

    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    // Return demo data when database is unavailable
    return getDemoBlogPosts();
  }
});

// Demo data for when database is unavailable
function getDemoBlogPosts() {
  return [
    {
      id: 'demo-1',
      title: 'How I Earned PKR 50,000 in My First Month',
      slug: 'first-month-success-story',
      excerpt: 'A university student shares her incredible first month journey with MLM-Pak and how she earned PKR 50,000.',
      content: `<h2>My Amazing MLM Journey</h2>
<p>When I joined MLM-Pak as a university student in Lahore, I never expected to earn PKR 50,000 in my first month!</p>
<h3>Getting Started</h3>
<p>I made my initial investment of PKR 1,000 and immediately completed my profile setup, studied all training materials, and set daily goals.</p>
<h3>Building My Network</h3>
<p>The key was focusing on genuine relationships by sharing my journey on social media and talking to friends and family.</p>
<h3>Amazing Results</h3>
<p>By month end, I had 15 active team members, PKR 30,000 from referrals, PKR 12,000 from products, and PKR 8,000 from tasks!</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87-5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date('2024-01-15'),
      viewCount: 245,
      category: { id: '1', name: 'Success Stories', slug: 'success-stories' },
      author: { id: '1', name: 'Sarah Khan', email: 'sarah@mlmpak.com' },
      tags: [
        { id: '1', name: 'Success', slug: 'success' },
        { id: '2', name: 'Motivation', slug: 'motivation' },
        { id: '3', name: 'Financial Freedom', slug: 'financial-freedom' }
      ],
      comments: [
        {
          id: 'comment-1',
          content: 'This is absolutely amazing! I just joined MLM-Pak last week and your story is so inspiring. Can you share more about how you approached your first prospects?',
          createdAt: new Date('2024-01-16T09:30:00'),
          author: {
            id: 'user-1',
            name: 'Ali Hassan',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
          },
          replies: [
            {
              id: 'reply-1',
              content: 'Thank you so much Ali! I started by making a list of 20 people I knew and reached out to 5 each day. The key is being genuine and share your excitement, not being pushy. Would love to help you more - send me a message!',
              createdAt: new Date('2024-01-16T14:15:00'),
              author: {
                id: '1',
                name: 'Sarah Khan',
                image: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
              }
            }
          ]
        },
        {
          id: 'comment-2',
          content: 'Wow! PKR 50,000 in just one month? That\'s incredible. I\'ve been struggling to make my first PKR 5,000. What was your biggest challenge in the beginning?',
          createdAt: new Date('2024-01-17T11:20:00'),
          author: {
            id: 'user-2',
            name: 'Fatima Sheikh',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=ib-4.0.3&auto=format&fit=crop&w=100&q=80'
          },
          replies: []
        },
        {
          id: 'comment-3',
          content: 'This gives me so much hope! I\'m also a university student and was worried about balancing studies with MLM. How did you manage your time?',
          createdAt: new Date('2024-01-18T16:45:00'),
          author: {
            id: 'user-3',
            name: 'Ahmed Ali',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
          },
          replies: []
        }
      ]
    },
    {
      id: 'demo-2',
      title: '5 Proven Strategies to Build Your MLM Team',
      slug: 'team-building-strategies',
      excerpt: 'Learn the top strategies that successful MLM leaders use to build strong, productive teams quickly.',
      content: `<h2>Building a Winning MLM Team</h2>
<p>Success in MLM comes from building and leading a strong team. Here are 5 proven strategies:</p>
<h3>1. Lead by Example</h3>
<p>Your team will follow your lead. Be consistent, professional, and successful in your own efforts.</p>
<h3>2. Provide Excellent Training</h3>
<p>Invest time in training your team. Well-trained members are more successful and motivated.</p>
<h3>3. Use Social Media Effectively</h3>
<p>Leverage Facebook, Instagram, and WhatsApp to share success stories and attract prospects.</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date('2024-01-22'),
      viewCount: 189,
      category: { id: '2', name: 'Business Tips', slug: 'business-tips' },
      author: { id: '1', name: 'Admin User', email: 'admin@mlmpak.com' },
      tags: [{ id: '4', name: 'Tips', slug: 'tips' }],
      comments: [
        {
          id: 'comment-4',
          content: 'These strategies are gold! I implemented strategy #2 and saw immediate results. My team is now more motivated than ever.',
          createdAt: new Date('2024-01-23T10:30:00'),
          author: {
            id: 'user-4',
            name: 'Zara Malik',
            image: 'https://images.unsplash.com/photo-1544725176-7c40e5a1c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
          },
          replies: []
        },
        {
          id: 'comment-5',
          content: 'The social media strategy is working amazing for me! I\'ve recruited 8 new members in just 2 weeks using Instagram stories.',
          createdAt: new Date('2024-01-24T14:20:00'),
          author: {
            id: 'user-5',
            name: 'Hassan Khan',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
          },
          replies: []
        }
      ]
    },
    {
      id: 'demo-3',
      title: 'Developing an Entrepreneurial Mindset for MLM Success',
      slug: 'entrepreneurship-mindset',
      excerpt: 'Transform your thinking and develop the mindset needed to succeed as an entrepreneur in the MLM industry.',
      content: `<h2>The Entrepreneur's Mindset</h2>
<p>Success in MLM requires thinking like an entrepreneur. Here's how to develop that mindset:</p>
<h3>Think Long-Term</h3>
<p>Entrepreneurship is a marathon, not a sprint. Focus on building sustainable income streams.</p>
<h3>Embrace Learning</h3>
<p>Successful entrepreneurs never stop learning. Read books, attend seminars, and learn from mentors.</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      status: 'PUBLISHED',
      publishedAt: new Date('2024-02-01'),
      viewCount: 156,
      category: { id: '3', name: 'Entrepreneurship', slug: 'entrepreneurship' },
      author: { id: '1', name: 'Admin User', email: 'admin@mlmpak.com' },
      tags: [
        { id: '2', name: 'Motivation', slug: 'motivation' },
        { id: '3', name: 'Financial Freedom', slug: 'financial-freedom' }
      ],
      comments: [
        {
          id: 'comment-6',
          content: 'This mindset shift changed everything for me! I started treating my MLM business like a real business and the results speak for themselves.',
          createdAt: new Date('2024-02-02T08:15:00'),
          author: {
            id: 'user-6',
            name: 'Ayesha Noor',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
          },
          replies: []
        }
      ]
    }
  ];
}

export const getBlogPostBySlug = cache(async (slug: string) => {
  try {
    const post = await db.blogPost.findUnique({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        author: true,
        tags: true,
        comments: {
          where: {
            parentId: null,
          },
          include: {
            author: true,
            replies: {
              include: {
                author: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      // Return demo data for specific slug
      const demoPost = getDemoBlogPosts().find(p => p.slug === slug);
      if (demoPost) {
        return demoPost;
      }
      return null;
    }

    return post;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    // Return demo data when database is unavailable
    const demoPost = getDemoBlogPosts().find(p => p.slug === slug);
    return demoPost || null;
  }
});

export const getRelatedPosts = cache(async (postId: string, categoryId: string) => {
  try {
    const relatedPosts = await db.blogPost.findMany({
      where: {
        id: { not: postId },
        categoryId,
        status: 'PUBLISHED',
      },
      take: 3,
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        category: true,
        author: true,
        tags: true,
      },
    });

    return relatedPosts;
  } catch (error) {
    console.error('Error fetching related posts:', error);
    // Return demo related posts
    return getDemoBlogPosts()
      .filter(p => p.id !== postId)
      .slice(0, 3);
  }
});

export const calculateReadingTime = (content: string) => {
  const wordsPerMinute = 200; // Average reading speed
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
};

export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getBlogCategories = cache(async () => {
  try {
    const categories = await db.blogCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [
      { id: '1', name: 'Success Stories', slug: 'success-stories' },
      { id: '2', name: 'Business Tips', slug: 'business-tips' },
      { id: '3', name: 'Entrepreneurship', slug: 'entrepreneurship' },
      { id: '4', name: 'Product Reviews', slug: 'product-reviews' },
      { id: '5', name: 'Team Building', slug: 'team-building' },
    ];
  }
});

export const getBlogTags = cache(async () => {
  try {
    const tags = await db.blogTag.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return tags;
  } catch (error) {
    console.error('Error fetching blog tags:', error);
    return [
      { id: '1', name: 'Success', slug: 'success' },
      { id: '2', name: 'Motivation', slug: 'motivation' },
      { id: '3', name: 'Financial Freedom', slug: 'financial-freedom' },
      { id: '4', name: 'Tips', slug: 'tips' },
      { id: '5', name: 'Marketing', slug: 'marketing' },
      { id: '6', name: 'Leadership', slug: 'leadership' },
    ];
  }
});

// 1500+ word article with embedded images
export const comparisonArticle = `<div class="prose prose-lg max-w-none">
  <h2>🌟 The Ultimate Guide to MLM-Pak: Your Gateway to Financial Freedom</h2>
  
  <img src="https://images.unsplash.com/photo-1556511244-1cfb136c4b25?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="MLM-Pak financial freedom" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p class="text-xl font-semibold text-gray-800 mb-6">In today's fast-paced world, finding a legitimate way to earn money from home has become more crucial than ever. MLM-Pak stands out as a revolutionary platform that combines the best of multi-level marketing with e-commerce, creating unprecedented opportunities for financial growth.</p>
  
  <h3>🎯 What Makes MLM-Pak Different?</h3>
  
  <p>Unlike traditional MLM companies that focus purely on recruitment, MLM-Pak has revolutionized the industry by offering real, high-quality products that customers actually want to buy. This creates a sustainable business model that benefits everyone involved.</p>
  
  <h4>Key Features That Set Us Apart:</h4>
  
  <ul>
    <li><strong>Real Products:</strong> From electronics to fashion, all products are authentic and high-quality</li>
    <li><strong>Instant Vouchers:</strong> Receive vouchers immediately after joining that you can use to purchase products</li>
    <li><strong>Multiple Income Streams:</strong> Earn from sales, referrals, team building, and daily tasks</li>
    <li><strong>Social Platform:</strong> Built-in social features to connect with your team and customers</li>
    <li><strong>Mobile-First Design:</strong> Optimized for smartphone users in Pakistan</li>
  </ul>
  
  <h3>💰 How Users Can Earn Money with MLM-Pak</h3>
  
  <img src="https://images.unsplash.com/photo-1556909114-f6280b2cdcf2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Multiple income streams" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p>MLM-Pak offers various ways to generate income, making it accessible for people with different skills and time commitments:</p>
  
  <h4>1. Direct Sales Commission (15-25% on every sale)</h4>
  <p>When you sell products through the platform, you earn a commission of 15-25% on every sale. With products ranging from PKR 500 to PKR 50,000, even a few sales per week can generate significant income.</p>
  
  <h4>2. Referral Bonuses (PKR 500-5,000 per referral)</h4>
  <p>For each person you refer who joins the platform, you earn a bonus based on their initial investment. This creates an incentive to share the opportunity with others.</p>
  
  <h4>3. Team Building Rewards (10-15% of team sales)</h4>
  <p>As your team grows, you earn a percentage of their sales. This creates passive income that continues to grow as your team expands.</p>
  
  <h4>4. Daily Task Completion (PKR 50-500 per task)</h4>
  <p>Complete simple tasks like sharing posts, writing reviews, or engaging with content to earn additional income. These tasks take just 5-10 minutes but can add up to significant amounts over time.</p>
  
  <h4>5. Voucher System Benefits</h4>
  <p>Use vouchers to purchase products at discounted prices, then resell them at market rates for profit. This creates an additional revenue stream for savvy entrepreneurs.</p>
  
  <h3>🛍️ Wide Range of Quality Products</h3>
  
  <img src="https://images.unsplash.com/photo-1556742049-d7984823c8ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Quality products showcase" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p>MLM-Pak features an extensive catalog of products across multiple categories, ensuring there's something for everyone:</p>
  
  <h4>Electronics & Gadgets</h4>
  <ul>
    <li>Latest smartphones and accessories</li>
    <li>Wireless headphones and speakers</li>
    <li>Smart home devices</li>
    <li>Gaming accessories</li>
    <li>Fitness trackers and smartwatches</li>
  </ul>
  
  <h4>Fashion & Lifestyle</h4>
  <ul>
    <li>Traditional Pakistani clothing</li>
    <li>Modern fashion wear</li>
    <li>Footwear and accessories</li>
    <li>Beauty and skincare products</li>
    <li>Home decor items</li>
  </ul>
  
  <h4>Health & Wellness</h4>
  <ul>
    <li>Natural health supplements</li>
    <li>Fitness equipment</li>
    <li>Organic beauty products</li>
    <li>Wellness books and guides</li>
  </ul>
  
  <h3>🌐 The Social Platform Feature</h3>
  
  <img src="https://images.unsplash.com/photo-1556742049-fe3961dc-2cf8-4e2f-9f68-fe600b2b4a70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Social media integration" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p>MLM-Pak isn't just an e-commerce platform; it's a social ecosystem where members can connect, share experiences, and build lasting relationships. The social features include:</p>
  
  <h4>Interactive Community</h4>
  <ul>
    <li>Forum discussions about products and strategies</li>
    <li>Success story sharing</li>
    <li>Team building activities</li>
    <li>Live webinars and training sessions</li>
  </ul>
  
  <h4>Social Media Integration</h4>
  <ul>
    <li>Share products directly to Facebook, Instagram, and WhatsApp</li>
    <li>Automated social media posting tools</li>
    <li>Customizable product showcases</li>
    <li>Social media performance tracking</li>
  </ul>
  
  <h3>🎓 Comprehensive Training and Support</h3>
  
  <p>One of the biggest advantages of MLM-Pak is the extensive training and support system:</p>
  
  <h4>New Member Training</h4>
  <ul>
    <li>Step-by-step platform walkthrough</li>
    <li>Product knowledge sessions</li>
    <li>Sales technique training</li>
    <li>Social media marketing basics</li>
  </ul>
  
  <h4>Ongoing Support</h4>
  <ul>
    <li>Weekly strategy webinars</li>
    <li>One-on-one mentoring sessions</li>
    <li>Success story sharing</li>
    <li>Advanced marketing workshops</li>
  </ul>
  
  <h3>📱 Mobile-First Design for Pakistan</h3>
  
  <img src="https://images.unsplash.com/photo-1512941937669-1c21n2006-7a8a-4b25-9c8f-c3fb) _k5-1z0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Mobile-first design" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p>Understanding that most users in Pakistan access the internet through their smartphones, MLM-Pak has been designed with mobile-first principles:</p>
  
  <h4>Key Mobile Features:</h4>
  <ul>
    <li>Fast loading times even on 3G/4G connections</li>
    <li>Intuitive swipe-based navigation</li>
    <li>One-tap product sharing</li>
    <li>Offline mode for browsing products</li>
    <li>Easy payment integration with local methods</li>
  </ul>
  
  <h3>🎯 Success Stories from Real Users</h3>
  
  <p>The true measure of any platform's success is the achievements of its users. Here are some inspiring success stories:</p>
  
  <h4>Sarah from Lahore - PKR 50,000 in First Month</h4>
  <p>As a university student, Sarah was skeptical about MLM. However, within 30 days of joining, she earned PKR 50,000 by focusing on quality products and building genuine relationships with her customers.</p>
  
  <h4>Ahmed from Karachi - Built a Team of 100+ Members</h4>
  <p>Ahmed, a former office worker, now leads a team of over 100 active members and earns more than his previous salary through team commissions and bonuses.</p>
  
  <h4>Fatima from Islamabad - From Housewife to Entrepreneur</h4>
  <p>Fatima transformed from a housewife to a successful entrepreneur, earning PKR 30,000 monthly by selling beauty products and building a strong female-focused team.</p>
  
  <h3>🚀 Getting Started: Your Journey to Financial Freedom</h3>
  
  <img src="https://images.unsplash.com/photo-1560264418-c5d2f4826f96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Getting started journey" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p>Starting your MLM-Pak journey is simple and affordable:</p>
  
  <h4>Step 1: Join the Platform</h4>
  <p>Register with a small investment starting from PKR 1,000. This gives you access to the platform, training materials, and your first vouchers.</p>
  
  <h4>Step 2: Complete Your Profile</h4>
  <p>Set up your profile with professional photos and information. This builds trust with potential customers and team members.</p>
  
  <h4>Step 3: Learn the System</h4>
  <p>Complete all training modules and attend webinars. Knowledge is your most valuable asset in this business.</p>
  
  <h4>Step 4: Start Selling</h4>
  <p>Begin with products you're passionate about. Your enthusiasm will naturally attract customers.</p>
  
  <h4>Step 5: Build Your Network</h4>
  <p>Share your success and invite others to join. Remember, it's about helping others achieve their goals too.</p>
  
  <h3>💡 Tips for Maximum Success</h3>
  
  <h4>1. Be Authentic</h4>
  <p>Only promote products you genuinely believe in. Authenticity builds trust, and trust builds long-term success.</p>
  
  <h4>2. Focus on Relationships</h4>
  <p>This is not just about selling products; it's about building relationships. Satisfied customers become repeat buyers and brand advocates.</p>
  
  <h4>3. Leverage Social Media</h4>
  <p>Use Facebook, Instagram, and WhatsApp strategically. Share valuable content, not just sales pitches.</p>
  
  <h4>4. Stay Consistent</h4>
  <p>Dedicate at least 2-3 hours daily to your MLM-Pak business. Consistency is key to building momentum.</p>
  
  <h4>5. Never Stop Learning</h4>
  <p>The most successful members are those who continuously improve their skills and adapt to market changes.</p>
  
  <h3>🔮 The Future of MLM-Pak</h3>
  
  <img src="https://images.unsplash.com/photo-15=529756-6c96-4f4d-a26c-9a8c44c7c4d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Future of MLM-Pak" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p>MLM-Pak is constantly evolving to meet the changing needs of its users. Upcoming features include:</p>
  
  <h4>Technology Enhancements</h4>
  <ul>
    <li>AI-powered product recommendations</li>
    <li>Virtual reality product showcases</li>
    <li>Augmented reality try-on features</li>
    <li>Blockchain-based commission tracking</li>
  </ul>
  
  <h4>Market Expansion</h4>
  <ul>
    <li>International shipping options</li>
    <li>Multi-language support</li>
    <li>Local payment gateway integration</li>
    <li>Regional product customization</li>
  </ul>
  
  <h3>🌟 Why Now is the Perfect Time to Join</h3>
  
  <p>The MLM industry in Pakistan is experiencing unprecedented growth, with more people seeking alternative income sources. MLM-Pak is positioned at the forefront of this revolution, offering:</p>
  
  <h4>Market Timing</h4>
  <ul>
    <li>Growing acceptance of online business models</li>
    <li>Increasing smartphone penetration</li>
    <li>Rising entrepreneurial spirit among youth</li>
    <li>Government support for digital economy</li>
  </ul>
  
  <h4>Competitive Advantages</h4>
  <ul>
    <li>First-mover advantage in the Pakistani market</li>
    <li>Strong brand recognition and trust</li>
    <li>Comprehensive support system</li>
    <li>Quality products at competitive prices</li>
  </ul>
  
  <h3>🎯 Call to Action: Your Financial Freedom Awaits</h3>
  
  <p>MLM-Pak isn't just another business opportunity – it's a pathway to financial independence, personal growth, and community building. With its combination of quality products, innovative technology, and comprehensive support system, it offers everything you need to succeed in the modern economy.</p>
  
  <p>Whether you're a student looking for extra income, a housewife seeking financial independence, or an entrepreneur wanting to build a business empire, MLM-Pak provides the tools, products, and community to make your dreams a reality.</p>
  
  <p>The question isn't whether you can afford to join MLM-Pak – it's whether you can afford not to. With the changing economic landscape and the rise of digital business models, now is the perfect time to secure your financial future.</p>
  
  <p><strong>Take the first step today. Your journey to financial freedom starts with a single click.</strong></p>
  
  <p>Join thousands of successful entrepreneurs who have already discovered the power of MLM-Pak. Your future self will thank you for making this decision today.</p>
  
  <img src="https://images.unsplash.com/photo-1556742049-35b3e84c5bbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Success awaits" class="w-full h-64 object-cover rounded-lg my-6" />
  
  <p class="text-center text-lg font-semibold text-green-600 mt-8">Ready to transform your life? Join MLM-Pak today and start building your financial future!</p>
</div>`;

export default {
  getBlogPosts,
  getBlogPostBySlug,
  getRelatedPosts,
  calculateReadingTime,
  formatDate,
  getBlogCategories,
  getBlogTags,
  comparisonArticle,
}; 