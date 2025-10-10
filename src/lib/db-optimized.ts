import { PrismaClient } from '@prisma/client';
import { withCache, withSWR, withBatching, cache } from './api-cache';

// Singleton pattern for Prisma client
class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Configure connection pool
    this.prisma.$connect().catch((error) => {
      console.error('Failed to connect to database:', error);
    });
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  // Optimized query methods with caching
  async findManyWithCache<T>(
    model: string,
    options: any,
    cacheKey?: string,
    ttl?: number
  ): Promise<T[]> {
    const key = cacheKey || JSON.stringify({ model, options });
    
    // Check cache first
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < (ttl || this.CACHE_TTL)) {
      return cached.data;
    }

    // Execute query
    const data = await (this.prisma as any)[model].findMany(options);
    
    // Cache result
    this.queryCache.set(key, { data, timestamp: Date.now() });
    
    return data;
  }

  // Batch operations for better performance
  async batchCreate<T>(model: string, data: any[]): Promise<T[]> {
    return (this.prisma as any)[model].createMany({
      data,
      skipDuplicates: true,
    });
  }

  async batchUpdate<T>(model: string, updates: { where: any; data: any }[]): Promise<T[]> {
    return this.prisma.$transaction(
      updates.map(({ where, data }) => 
        (this.prisma as any)[model].update({ where, data })
      )
    );
  }

  // Pagination helper
  async paginate<T>(
    model: string,
    {
      page = 1,
      limit = 10,
      where = {},
      orderBy = {},
      include = {},
    }: {
      page?: number;
      limit?: number;
      where?: any;
      orderBy?: any;
      include?: any;
    }
  ): Promise<{
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      (this.prisma as any)[model].findMany({
        where,
        orderBy,
        include,
        skip,
        take: limit,
      }),
      (this.prisma as any)[model].count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Clear cache
  clearCache(pattern?: string): void {
    if (pattern) {
      Array.from(this.queryCache.keys())
        .filter(key => key.includes(pattern))
        .forEach(key => this.queryCache.delete(key));
    } else {
      this.queryCache.clear();
    }
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();
export const prisma = db.getClient();

// Optimized query functions with caching
export const getCachedUser = withCache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        membershipStatus: true,
        balance: true,
        totalEarnings: true,
      },
    });
  },
  {
    namespace: 'users',
    ttl: 1000 * 60 * 5, // 5 minutes
    keyGenerator: (userId) => userId,
  }
);

export const getCachedProducts = withSWR(
  async (options?: { categoryId?: string; featured?: boolean }) => {
    return prisma.product.findMany({
      where: {
        ...(options?.categoryId && { categoryId: options.categoryId }),
        ...(options?.featured !== undefined && { featured: options.featured }),
        status: 'ACTIVE',
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
  {
    namespace: 'products',
    ttl: 1000 * 60 * 10, // 10 minutes
    staleTTL: 1000 * 60 * 60, // 1 hour stale TTL
  }
);

export const getCachedOrders = withCache(
  async (userId: string, limit = 10) => {
    return prisma.order.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  },
  {
    namespace: 'orders',
    ttl: 1000 * 60 * 2, // 2 minutes
  }
);

// Batched operations
export const batchedUserUpdate = withBatching(
  async (updates: { id: string; data: any }[]) => {
    return prisma.$transaction(
      updates.map(({ id, data }) =>
        prisma.user.update({
          where: { id },
          data,
        })
      )
    );
  }
);

// Invalidation helpers
export const invalidateUserCache = (userId: string) => {
  cache.delete('users', userId);
};

export const invalidateProductCache = () => {
  cache.clear('products');
};

export const invalidateOrderCache = (userId: string) => {
  cache.clear('orders');
};

// Query optimization utilities
export const optimizeQuery = <T>(query: () => Promise<T>): Promise<T> => {
  return prisma.$transaction(async (tx) => {
    // Set pragmas for SQLite optimization
    await tx.$executeRaw`PRAGMA journal_mode = WAL`;
    await tx.$executeRaw`PRAGMA synchronous = NORMAL`;
    await tx.$executeRaw`PRAGMA cache_size = 10000`;
    await tx.$executeRaw`PRAGMA temp_store = MEMORY`;
    
    return query();
  });
};

// Connection pool monitoring
export const getConnectionPoolStats = () => {
  return {
    activeConnections: (prisma as any)._activeConnections || 0,
    idleConnections: (prisma as any)._idleConnections || 0,
    waitingRequests: (prisma as any)._waitingRequests || 0,
  };
};

// Export types
export type { PrismaClient } from '@prisma/client';
