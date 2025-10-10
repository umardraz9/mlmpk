// Environment Configuration for MLM-Pak Platform
// This file contains all environment variable configurations with type safety

interface EnvironmentConfig {
  // Database
  databaseUrl: string;
  
  // Authentication
  nextAuthUrl: string;
  nextAuthSecret: string;
  jwtSecret: string;
  
  // Pakistani Payment Gateways
  jazzcash: {
    merchantId: string;
    password: string;
    integritySalt: string;
    sandboxUrl: string;
    productionUrl: string;
    isEnabled: boolean;
  };
  
  easypaisa: {
    storeId: string;
    storePassword: string;
    sandboxUrl: string;
    productionUrl: string;
    isEnabled: boolean;
  };
  
  // Stripe
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  
  // OAuth
  google: {
    clientId: string;
    clientSecret: string;
  };
  
  facebook: {
    clientId: string;
    clientSecret: string;
  };
  
  // Email & SMS
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
  };
  
  sms: {
    apiKey: string;
    senderId: string;
  };
  
  // File Upload
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  
  // Application
  app: {
    name: string;
    url: string;
    adminEmail: string;
    nodeEnv: 'development' | 'staging' | 'production';
    version: string;
  };
  
  // MLM Configuration
  mlm: {
    defaultCommissionRate: number;
    maxEarningLimit: number;
    investmentAmount: number;
    voucherAmount: number;
    taskDeadlineDays: number;
    defaultTaskReward: number;
    productVoucherValue: number;
    maxEarningPotential: number;
    commissionLevels: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
    };
    referralCodeLength: number;
    sessionExpiryDays: number;
  };
  
  // Security
  security: {
    encryptionKey: string;
    hashRounds: number;
    rateLimitMax: number;
    rateLimitWindowMs: number;
    bcryptRounds: number;
    jwtExpiresIn: string;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
  };
  
  // Pakistani Specific
  pakistan: {
    currency: string;
    timezone: string;
    locale: string;
    bankApiKey: string;
    niftIntegrationUrl: string;
    phonePrefix: string;
    cnicValidation: boolean;
    supportedLanguages: string[];
  };
  
  // Monitoring
  monitoring: {
    sentryDsn?: string;
    googleAnalyticsId?: string;
  };
  
  // Legal
  legal: {
    termsVersion: string;
    privacyPolicyVersion: string;
    dataRetentionDays: number;
  };
}

// Helper function to get environment variable with validation
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

// Helper function to get numeric environment variable
function getEnvNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${name} must be a valid number`);
    }
    return parsed;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Environment variable ${name} is required but not set`);
}

// Main environment configuration
export const env: EnvironmentConfig = {
  // Database
  databaseUrl: getEnvVar('DATABASE_URL'),
  
  // Authentication
  nextAuthUrl: getEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),
  nextAuthSecret: getEnvVar('NEXTAUTH_SECRET'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  
  // Pakistani Payment Gateways
  jazzcash: {
    merchantId: getEnvVar('JAZZCASH_MERCHANT_ID'),
    password: getEnvVar('JAZZCASH_PASSWORD'),
    integritySalt: getEnvVar('JAZZCASH_INTEGRITY_SALT'),
    sandboxUrl: getEnvVar('JAZZCASH_SANDBOX_URL', 'https://sandbox.jazzcash.com.pk'),
    productionUrl: getEnvVar('JAZZCASH_PRODUCTION_URL', 'https://payments.jazzcash.com.pk'),
    isEnabled: getEnvVar('JAZZCASH_ENABLED') === 'true',
  },
  
  easypaisa: {
    storeId: getEnvVar('EASYPAISA_STORE_ID'),
    storePassword: getEnvVar('EASYPAISA_STORE_PASSWORD'),
    sandboxUrl: getEnvVar('EASYPAISA_SANDBOX_URL', 'https://sandbox.easypaisa.com.pk'),
    productionUrl: getEnvVar('EASYPAISA_PRODUCTION_URL', 'https://api.easypaisa.com.pk'),
    isEnabled: getEnvVar('EASYPAISA_ENABLED') === 'true',
  },
  
  // Stripe
  stripe: {
    publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
    secretKey: getEnvVar('STRIPE_SECRET_KEY'),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'),
  },
  
  // OAuth
  google: {
    clientId: getEnvVar('GOOGLE_CLIENT_ID'),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
  },
  
  facebook: {
    clientId: getEnvVar('FACEBOOK_CLIENT_ID'),
    clientSecret: getEnvVar('FACEBOOK_CLIENT_SECRET'),
  },
  
  // Email & SMS
  email: {
    smtpHost: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
    smtpPort: getEnvNumber('SMTP_PORT', 587),
    smtpUser: getEnvVar('SMTP_USER'),
    smtpPassword: getEnvVar('SMTP_PASSWORD'),
    fromEmail: getEnvVar('FROM_EMAIL', 'noreply@mlmpak.com'),
  },
  
  sms: {
    apiKey: getEnvVar('SMS_API_KEY'),
    senderId: getEnvVar('SMS_SENDER_ID', 'MLM-PAK'),
  },
  
  // File Upload
  cloudinary: {
    cloudName: getEnvVar('CLOUDINARY_CLOUD_NAME'),
    apiKey: getEnvVar('CLOUDINARY_API_KEY'),
    apiSecret: getEnvVar('CLOUDINARY_API_SECRET'),
  },
  
  // Application
  app: {
    name: getEnvVar('APP_NAME', 'MLM-Pak Platform'),
    url: getEnvVar('APP_URL', 'http://localhost:3000'),
    adminEmail: getEnvVar('ADMIN_EMAIL', 'admin@mlmpak.com'),
    nodeEnv: (getEnvVar('NODE_ENV', 'development') as 'development' | 'staging' | 'production'),
    version: '1.0.0',
  },
  
  // MLM Configuration
  mlm: {
    defaultCommissionRate: parseFloat(getEnvVar('DEFAULT_COMMISSION_RATE', '0.05')),
    maxEarningLimit: getEnvNumber('MAX_EARNING_LIMIT', 3000),
    investmentAmount: getEnvNumber('INVESTMENT_AMOUNT', 1000),
    voucherAmount: getEnvNumber('VOUCHER_AMOUNT', 500),
    taskDeadlineDays: getEnvNumber('TASK_DEADLINE_DAYS', 7),
    defaultTaskReward: getEnvNumber('DEFAULT_TASK_REWARD', 100),
    productVoucherValue: getEnvNumber('PRODUCT_VOUCHER_VALUE', 500),
    maxEarningPotential: getEnvNumber('MAX_EARNING_POTENTIAL', 3000),
    commissionLevels: {
      level1: parseFloat(getEnvVar('LEVEL1_COMMISSION', '0.20')),
      level2: parseFloat(getEnvVar('LEVEL2_COMMISSION', '0.15')),
      level3: parseFloat(getEnvVar('LEVEL3_COMMISSION', '0.10')),
      level4: parseFloat(getEnvVar('LEVEL4_COMMISSION', '0.08')),
      level5: parseFloat(getEnvVar('LEVEL5_COMMISSION', '0.07')),
    },
    referralCodeLength: getEnvNumber('REFERRAL_CODE_LENGTH', 8),
    sessionExpiryDays: getEnvNumber('SESSION_EXPIRY_DAYS', 30),
  },
  
  // Security
  security: {
    encryptionKey: getEnvVar('ENCRYPTION_KEY'),
    hashRounds: getEnvNumber('HASH_ROUNDS', 12),
    rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 100),
    rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
    bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '30d'),
    maxLoginAttempts: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
    lockoutDuration: getEnvNumber('LOCKOUT_DURATION', 15 * 60 * 1000), // 15 minutes
    passwordMinLength: getEnvNumber('PASSWORD_MIN_LENGTH', 8),
  },
  
  // Pakistani Specific
  pakistan: {
    currency: getEnvVar('CURRENCY', 'PKR'),
    timezone: getEnvVar('TIMEZONE', 'Asia/Karachi'),
    locale: getEnvVar('LOCALE', 'en-PK'),
    bankApiKey: getEnvVar('BANK_API_KEY'),
    niftIntegrationUrl: getEnvVar('NIFT_INTEGRATION_URL', 'https://1link.net.pk/api'),
    phonePrefix: getEnvVar('PHONE_PREFIX', '+92'),
    cnicValidation: getEnvVar('CNIC_VALIDATION') === 'true',
    supportedLanguages: getEnvVar('SUPPORTED_LANGUAGES', 'en,ur').split(','),
  },
  
  // Monitoring
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
  },
  
  // Legal
  legal: {
    termsVersion: getEnvVar('TERMS_VERSION', '1.0'),
    privacyPolicyVersion: getEnvVar('PRIVACY_POLICY_VERSION', '1.0'),
    dataRetentionDays: getEnvNumber('DATA_RETENTION_DAYS', 2555), // 7 years
  },
};

// Validation function to check if all required environment variables are set
export function validateEnvironment(): void {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
    'JAZZCASH_MERCHANT_ID',
    'EASYPAISA_STORE_ID',
    'STRIPE_SECRET_KEY',
    'GOOGLE_CLIENT_ID',
    'FACEBOOK_CLIENT_ID',
    'SMTP_USER',
    'SMS_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'ENCRYPTION_KEY',
    'BANK_API_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the required values.'
    );
  }
}

// Pakistani specific configurations
export const pakistanConfig = {
  // Pakistani cities for shipping
  cities: [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'
  ],
  
  // Pakistani provinces
  provinces: [
    'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
    'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Kashmir'
  ],
  
  // Phone number regex for Pakistani numbers
  phoneRegex: /^(\+92|0)?[0-9]{10}$/,
  
  // CNIC regex for Pakistani CNIC
  cnicRegex: /^[0-9]{5}-[0-9]{7}-[0-9]$/,
  
  // Banking codes for Pakistani banks
  bankCodes: {
    HBL: '014',
    UBL: '011',
    MCB: '003',
    ABL: '0010',
    NBP: '002',
    BAFL: '0250',
    MEBL: '0013',
    SCB: '0260',
    FABL: '0150',
    BOP: '0240'
  },
  
  // Pakistani Rupee formatting
  currencyFormat: {
    locale: 'en-PK',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  
  // Business hours in Pakistani timezone
  businessHours: {
    timezone: 'Asia/Karachi',
    start: '09:00',
    end: '18:00',
    weekends: ['friday', 'saturday'], // Pakistani weekend
  },
  
  // Legal compliance requirements
  compliance: {
    secpRegistrationRequired: true,
    fbrTaxRequired: true,
    consumerProtectionAct: true,
    antiMoneyLaunderingAct: true,
    dataRetentionYears: 7,
  }
};

export default env; 