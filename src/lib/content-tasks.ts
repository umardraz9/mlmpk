/**
 * Content engagement tasks for policy-compliant task system
 */

export interface ContentTask {
  id: string
  title: string
  description: string
  type: 'read-only' | 'read-and-click-ads'
  reward: number
  timeRequirement: number // in minutes
  sequenceOrder: number
  prerequisiteTaskId?: string
  articleUrl: string
  minDuration?: number
  requireScrolling?: boolean
  requireMouseMovement?: boolean
  minScrollPercentage?: number
  maxAttempts?: number
  verificationRequirements: {
    minScrollDepth: number
    mouseMovement: boolean
    minAdClicks?: number
  }
  instructions: {
    reading: string
    adInstructions?: string
  }
}

export const contentTasks: ContentTask[] = [
  {
    id: 'task-1',
    title: 'Digital Marketing Fundamentals',
    description: 'Learn the basics of digital marketing strategies and best practices.',
    type: 'read-only',
    reward: 20,
    timeRequirement: 2,
    sequenceOrder: 1,
    prerequisiteTaskId: undefined,
    articleUrl: 'https://blog.hubspot.com/marketing/digital-marketing-guide',
    minDuration: 45,
    requireScrolling: true,
    requireMouseMovement: true,
    minScrollPercentage: 80,
    maxAttempts: 3,
    verificationRequirements: {
      minScrollDepth: 0.8,
      mouseMovement: true,
      minAdClicks: 0
    },
    instructions: {
      reading: 'Read through this comprehensive guide on digital marketing fundamentals. Pay attention to the key strategies and best practices mentioned.',
      adInstructions: ''
    }
  },
  {
    id: 'task-2',
    title: 'Content Marketing Strategies',
    description: 'Explore effective content marketing techniques and implementation strategies.',
    type: 'read-only',
    reward: 25,
    timeRequirement: 2.5,
    sequenceOrder: 2,
    prerequisiteTaskId: 'task-1',
    articleUrl: 'https://contentmarketinginstitute.com/articles/content-marketing-strategies/',
    minDuration: 50,
    requireScrolling: true,
    requireMouseMovement: true,
    minScrollPercentage: 75,
    maxAttempts: 3,
    verificationRequirements: {
      minScrollDepth: 0.75,
      mouseMovement: true,
      minAdClicks: 0
    },
    instructions: {
      reading: 'Study the various content marketing strategies presented. Focus on understanding how to create engaging content that drives results.',
      adInstructions: ''
    }
  },
  {
    id: 'task-3',
    title: 'Social Media Marketing Trends',
    description: 'Stay updated with the latest social media marketing trends and platform updates.',
    type: 'read-only',
    reward: 30,
    timeRequirement: 2.5,
    sequenceOrder: 3,
    prerequisiteTaskId: 'task-2',
    articleUrl: 'https://sproutsocial.com/insights/social-media-trends/',
    minDuration: 50,
    requireScrolling: true,
    requireMouseMovement: true,
    minScrollPercentage: 70,
    maxAttempts: 3,
    verificationRequirements: {
      minScrollDepth: 0.7,
      mouseMovement: true,
      minAdClicks: 0
    },
    instructions: {
      reading: 'Learn about current social media trends and how they can impact your marketing strategy. Note the platform-specific recommendations.',
      adInstructions: ''
    }
  },
  {
    id: 'task-4',
    title: 'Email Marketing Best Practices',
    description: 'Master email marketing techniques for better engagement and conversion rates.',
    type: 'read-only',
    reward: 40,
    timeRequirement: 3,
    sequenceOrder: 4,
    prerequisiteTaskId: 'task-3',
    articleUrl: 'https://mailchimp.com/marketing-glossary/email-marketing/',
    minDuration: 60,
    requireScrolling: true,
    requireMouseMovement: true,
    minScrollPercentage: 80,
    maxAttempts: 3,
    verificationRequirements: {
      minScrollDepth: 0.8,
      mouseMovement: true,
      minAdClicks: 0
    },
    instructions: {
      reading: 'Understand the fundamentals of effective email marketing. Pay attention to segmentation, personalization, and automation strategies.',
      adInstructions: ''
    }
  },
  {
    id: 'task-5',
    title: 'Advanced Marketing Analytics & Ad Engagement',
    description: 'Learn to analyze marketing data and engage with advertising content for better ROI understanding.',
    type: 'read-and-click-ads',
    reward: 65,
    timeRequirement: 4,
    sequenceOrder: 5,
    prerequisiteTaskId: 'task-4',
    articleUrl: 'https://blog.google/products/marketingplatform/analytics-intelligence/',
    minDuration: 90,
    requireScrolling: true,
    requireMouseMovement: true,
    minScrollPercentage: 85,
    maxAttempts: 3,
    verificationRequirements: {
      minScrollDepth: 0.85,
      mouseMovement: true,
      minAdClicks: 2
    },
    instructions: {
      reading: 'Study advanced marketing analytics concepts and learn how to interpret data for campaign optimization.',
      adInstructions: '🎯 SPECIAL TASK: In addition to reading the article, you must click on at least 2 advertisements displayed on the page. Look for banner ads, sponsored content, Google AdSense ads, or promotional sections and click on them. You\'ll see a green border appear around ads when clicked successfully.'
    }
  }
]

/**
 * Generate verification token for content task
 */
export function generateContentTaskToken(userId: string, taskId: string): string {
  const payload = {
    userId,
    taskId,
    timestamp: Date.now(),
    type: 'content-engagement'
  }
  
  return btoa(JSON.stringify(payload))
}

/**
 * Get content task by ID
 */
export function getContentTask(taskId: string): ContentTask | undefined {
  return contentTasks.find(task => task.id === taskId)
}

/**
 * Get all available content tasks
 */
export function getAvailableContentTasks(): ContentTask[] {
  return contentTasks
}

/**
 * Get available tasks for user based on completion status
 */
export function getAvailableTasksForUser(completedTaskIds: string[]): ContentTask[] {
  return contentTasks.filter(task => {
    // Task 1 is always available
    if (task.sequenceOrder === 1) {
      return !completedTaskIds.includes(task.id)
    }
    
    // For other tasks, check if prerequisite is completed
    if (task.prerequisiteTaskId) {
      const prerequisiteCompleted = completedTaskIds.includes(task.prerequisiteTaskId)
      const taskNotCompleted = !completedTaskIds.includes(task.id)
      return prerequisiteCompleted && taskNotCompleted
    }
    
    return !completedTaskIds.includes(task.id)
  })
}

/**
 * Get next available task for user
 */
export function getNextAvailableTask(completedTaskIds: string[]): ContentTask | null {
  const availableTasks = getAvailableTasksForUser(completedTaskIds)
  return availableTasks.length > 0 ? availableTasks[0] : null
}

/**
 * Check if task requires ad clicks
 */
export function isAdClickTask(taskId: string): boolean {
  const task = getContentTask(taskId)
  return task?.type === 'read-and-click-ads' || false
}

/**
 * Get task instructions based on task type
 */
export function getTaskInstructions(taskId: string): {
  type: 'read-only' | 'read-and-click-ads'
  instructions: string
  adInstructions?: string
} {
  const task = getContentTask(taskId)
  if (!task) {
    return {
      type: 'read-only',
      instructions: 'Task not found'
    }
  }

  return {
    type: task.type,
    instructions: task.instructions.reading,
    adInstructions: task.instructions.adInstructions
  }
}

/**
 * Validate task completion requirements
 */
export function validateTaskCompletion(
  taskId: string,
  trackingData: {
    scrollPercentage: number
    timeSpent: number
    adClicks?: number
  }
): {
  isValid: boolean
  missingRequirements: string[]
} {
  const task = getContentTask(taskId)
  if (!task) {
    return { isValid: false, missingRequirements: ['Task not found'] }
  }

  const missing: string[] = []
  const requirements = task.verificationRequirements

  // Check scroll depth
  if (trackingData.scrollPercentage < requirements.minScrollDepth * 100) {
    missing.push(`Scroll to at least ${requirements.minScrollDepth * 100}% of the article`)
  }

  // Check time spent (using task timeRequirement)
  const minTimeMs = task.timeRequirement * 60 * 1000 // Convert minutes to milliseconds
  if (trackingData.timeSpent < minTimeMs) {
    missing.push(`Spend at least ${task.timeRequirement} minutes reading`)
  }

  // Check ad clicks for ad-click tasks
  if (requirements.minAdClicks && (!trackingData.adClicks || trackingData.adClicks < requirements.minAdClicks)) {
    missing.push(`Click on at least ${requirements.minAdClicks} advertisements`)
  }

  return {
    isValid: missing.length === 0,
    missingRequirements: missing
  }
}

/**
 * Create task URL for content engagement
 */
export function createContentTaskUrl(
  userId: string,
  taskId: string,
  returnUrl: string
): string {
  const token = generateContentTaskToken(userId, taskId)
  const baseUrl = process.env.CONTENT_SITE_URL || 'https://content.mlmpak.com'
  
  return `${baseUrl}?userId=${userId}&taskId=${taskId}&token=${token}&returnUrl=${encodeURIComponent(returnUrl)}`
}
