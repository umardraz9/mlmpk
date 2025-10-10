/**
 * Policy-compliant task verification system
 * Focuses on content engagement rather than ad interaction
 */

export interface TaskVerificationData {
  scrollDepth: number
  timeSpent: number
  mouseMovement: boolean
  pageRead: boolean
  quizCompleted: boolean
  contentEngagement: boolean
}

export class TaskVerificationService {
  private static readonly MIN_TIME_SPENT = 120000 // 2 minutes in milliseconds
  private static readonly MIN_SCROLL_DEPTH = 0.7 // 70% scroll depth
  private static readonly MOUSE_MOVEMENT_THRESHOLD = 50 // pixels

  /**
   * Verify if user genuinely engaged with content
   */
  static verifyTaskCompletion(data: TaskVerificationData): {
    success: boolean
    score: number
    reasons: string[]
  } {
    let score = 0
    const reasons: string[] = []

    // Time spent verification (40% weight)
    if (data.timeSpent >= this.MIN_TIME_SPENT) {
      score += 40
    } else {
      reasons.push(`Time spent (${Math.round(data.timeSpent / 1000)}s) below minimum requirement`)
    }

    // Scroll depth verification (30% weight)
    if (data.scrollDepth >= this.MIN_SCROLL_DEPTH) {
      score += 30
    } else {
      reasons.push(`Scroll depth (${Math.round(data.scrollDepth * 100)}%) below minimum requirement`)
    }

    // Mouse movement verification (20% weight)
    if (data.mouseMovement) {
      score += 20
    } else {
      reasons.push('Insufficient mouse movement detected')
    }

    // Content engagement verification (10% weight)
    if (data.contentEngagement) {
      score += 10
    } else {
      reasons.push('No content engagement detected')
    }

    return {
      success: score >= 70, // 70% minimum score required
      score,
      reasons
    }
  }

  /**
   * Generate verification token for secure task completion
   */
  static generateVerificationToken(userId: string, taskId: string): string {
    const payload = {
      userId,
      taskId,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2)
    }
    
    // Simple base64 encoding (in production, use proper JWT)
    return btoa(JSON.stringify(payload))
  }

  /**
   * Validate verification token
   */
  static validateVerificationToken(token: string): {
    valid: boolean
    userId?: string
    taskId?: string
    timestamp?: number
  } {
    try {
      const decoded = JSON.parse(atob(token))
      
      // Check if token is not too old (5 minutes)
      if (Date.now() - decoded.timestamp > 300000) {
        return { valid: false }
      }
      
      return {
        valid: true,
        userId: decoded.userId,
        taskId: decoded.taskId,
        timestamp: decoded.timestamp
      }
    } catch {
      return { valid: false }
    }
  }

  /**
   * Generate quiz questions based on content
   */
  static generateQuizQuestions(content: string): Array<{
    question: string
    options: string[]
    correctAnswer: number
  }> {
    // Simple keyword extraction for quiz generation
    const keywords = this.extractKeywords(content)
    
    return [
      {
        question: "What is the main topic of this article?",
        options: [
          keywords[0] || "Technology",
          keywords[1] || "Business",
          keywords[2] || "Lifestyle",
          keywords[3] || "General"
        ],
        correctAnswer: 0
      },
      {
        question: "How long should you spend reading content for genuine engagement?",
        options: ["30 seconds", "1 minute", "2+ minutes", "5 seconds"],
        correctAnswer: 2
      },
      {
        question: "What indicates genuine user engagement?",
        options: [
          "Quick scroll and exit",
          "Reading + scrolling + mouse movement",
          "Page refresh multiple times",
          "Ignoring content"
        ],
        correctAnswer: 1
      }
    ]
  }

  private static extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, use NLP
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && !commonWords.includes(word))
    
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
  }
}
