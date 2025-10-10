import { NextRequest, NextResponse } from 'next/server';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { authRateLimit, messageRateLimit, apiRateLimit } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = authRateLimit(request);
    if (rateLimitResult instanceof Response) {
      return rateLimitResult;
    }

    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { action, table, filters, format = 'csv' } = await request.json();

    if (!table || !action) {
      return NextResponse.json(
        { error: 'Table and action are required' },
        { status: 400 }
      );
    }

    let data;
    let filename;

    switch (action) {
      case 'export':
        ({ data, filename } = await handleExport(table, filters, format));
        break;
      case 'import':
        const result = await handleImport(request, table);
        return NextResponse.json(result);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "export" or "import"' },
          { status: 400 }
        );
    }

    // For export, return file download
    if (action === 'export') {
      const headers = new Headers();
      headers.set('Content-Type', getContentType(format));
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);

      return new Response(data, { headers });
    }

  } catch (error) {
    console.error('Data operation error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}

async function handleExport(table: string, filters: any = {}, format: string) {
  let data;
  let filename;

  switch (table) {
    case 'users':
      data = await exportUsers(filters);
      filename = `users_${new Date().toISOString().split('T')[0]}.${format}`;
      break;
    case 'tasks':
      data = await exportTasks(filters);
      filename = `tasks_${new Date().toISOString().split('T')[0]}.${format}`;
      break;
    case 'transactions':
      data = await exportTransactions(filters);
      filename = `transactions_${new Date().toISOString().split('T')[0]}.${format}`;
      break;
    case 'messages':
      data = await exportMessages(filters);
      filename = `messages_${new Date().toISOString().split('T')[0]}.${format}`;
      break;
    case 'error_logs':
      data = await exportErrorLogs(filters);
      filename = `error_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      break;
    default:
      throw new Error(`Unsupported table: ${table}`);
  }

  if (format === 'csv') {
    return { data: convertToCSV(data), filename };
  } else if (format === 'json') {
    return { data: JSON.stringify(data, null, 2), filename };
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }
}

async function handleImport(request: NextRequest, table: string) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  const content = await file.text();
  let data;

  if (file.name.endsWith('.csv')) {
    data = parseCSV(content);
  } else if (file.name.endsWith('.json')) {
    data = JSON.parse(content);
  } else {
    throw new Error('Unsupported file format');
  }

  switch (table) {
    case 'users':
      return await importUsers(data);
    case 'tasks':
      return await importTasks(data);
    default:
      throw new Error(`Import not supported for table: ${table}`);
  }
}

// Export functions
async function exportUsers(filters: any = {}) {
  const where: any = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  if (filters.role) {
    where.role = filters.role;
  }
  if (filters.createdAfter) {
    where.createdAt = { gte: new Date(filters.createdAfter) };
  }
  if (filters.createdBefore) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.createdBefore) };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isAdmin: true,
      balance: true,
      totalEarnings: true,
      referralCode: true,
      createdAt: true,
      tasksCompleted: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return users;
}

async function exportTasks(filters: any = {}) {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.createdAfter) {
    where.createdAt = { gte: new Date(filters.createdAfter) };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      _count: {
        select: { taskCompletions: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return tasks;
}

async function exportTransactions(filters: any = {}) {
  const where: any = {};

  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.createdAfter) {
    where.createdAt = { gte: new Date(filters.createdAfter) };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return transactions;
}

async function exportMessages(filters: any = {}) {
  const where: any = {};

  if (filters.createdAfter) {
    where.createdAt = { gte: new Date(filters.createdAfter) };
  }
  if (filters.type) {
    where.type = filters.type;
  }

  const messages = await prisma.directMessage.findMany({
    where,
    include: {
      sender: {
        select: { id: true, name: true, email: true }
      },
      recipient: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10000 // Limit for performance
  });

  return messages;
}

async function exportErrorLogs(filters: any = {}) {
  const where: any = {};

  if (filters.resolved !== undefined) {
    where.resolved = filters.resolved;
  }
  if (filters.createdAfter) {
    where.timestamp = { gte: new Date(filters.createdAfter) };
  }

  const errorLogs = await prisma.errorLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  return errorLogs;
}

// Import functions
async function importUsers(data: any[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const userData of data) {
    try {
      // Validate required fields
      if (!userData.email || !userData.name) {
        results.errors.push(`Missing required fields for user: ${JSON.stringify(userData)}`);
        results.failed++;
        continue;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        results.errors.push(`User with email ${userData.email} already exists`);
        results.failed++;
        continue;
      }

      // Store in database for persistence (optional)
      try {
        await prisma.errorLog.create({
          data: {
            errorId: userData.errorId,
            message: userData.message,
            stack: userData.stack || null,
            componentStack: userData.componentStack || null,
            url: userData.url,
            userAgent: userData.userAgent,
            userId: userData.userId || null,
            timestamp: new Date(userData.timestamp),
            resolved: false,
          }
        });
      } catch (dbError) {
        console.error('Failed to store error in database:', dbError);
        // Continue without database storage
      }

      // Create user
      await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role || 'USER',
          isActive: userData.isActive !== false,
          balance: userData.balance || 0,
        }
      });

      results.success++;
    } catch (error) {
      results.errors.push(`Failed to import user ${userData.email}: ${error}`);
      results.failed++;
    }
  }

  return results;
}

async function importTasks(data: any[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const taskData of data) {
    try {
      if (!taskData.title || !taskData.description) {
        results.errors.push(`Missing required fields for task: ${JSON.stringify(taskData)}`);
        results.failed++;
        continue;
      }

      await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          type: taskData.type || 'SOCIAL_MEDIA',
          category: taskData.category || 'General',
          difficulty: taskData.difficulty || 'MEDIUM',
          reward: taskData.reward || 0,
          target: taskData.target || 1,
          status: taskData.status || 'ACTIVE'
        }
      });

      results.success++;
    } catch (error) {
      results.errors.push(`Failed to import task ${taskData.title}: ${error}`);
      results.failed++;
    }
  }

  return results;
}

// Utility functions
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').replace(/""/g, '"'));
  const rows = lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split on comma but respect quotes
    return headers.reduce((obj, header, index) => {
      let value = values[index]?.replace(/^\"|\"$/g, '').replace(/\"\"/g, '\"') || '';
      // Try to parse as number or boolean
      if (value === 'true') obj[header] = true;
      else if (value === 'false') obj[header] = false;
      else if (!isNaN(Number(value))) obj[header] = Number(value);
      else obj[header] = value;
      return obj;
    }, {} as any);
  });

  return rows;
}

function getContentType(format: string): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
}
