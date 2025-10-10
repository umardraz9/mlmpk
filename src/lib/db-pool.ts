import { PrismaClient } from '@prisma/client';

// Global database connection pool for better performance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton Prisma client with optimized configuration
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
      },
    },
  });
};

// Use global variable in development to prevent multiple instances
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Connection pool management
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

// Health check function
export const checkDBHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
};

// Simple in-memory cache for development
const queryCache = new Map<string, { data: any; timestamp: number }>();

// Optimized query helpers with caching
export const queryWithCache = async <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> => {
  // In a production environment, you'd use Redis or similar
  // For now, we'll use a simple in-memory cache
  
  const cachedResult = queryCache.get(key);
  if (cachedResult && Date.now() - cachedResult.timestamp < ttlSeconds * 1000) {
    return cachedResult.data;
  }
  
  const result = await queryFn();
  queryCache.set(key, { data: result, timestamp: Date.now() });
  
  return result;
};

export default prisma;
