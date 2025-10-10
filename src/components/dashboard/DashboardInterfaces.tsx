// Shared interfaces for dashboard components

export interface UserStats {
  totalEarnings: number;
  voucherBalance: number;
  walletBalance: number;
  pendingEarnings: number;
  referralCount: number;
  activeReferrals: number;
  tasksCompleted: number;
  tasksRemaining: number;
  tasksPending: number;
  membershipPlan: {
    name: string;
    price: number;
    dailyIncome: number;
    referralCommission: number;
    level: number;
    color: string;
    withdrawalLimit: number;
    voucherPercentage: number;
    maxReferrals: number;
  } | null;
  membershipStatus: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  withdrawalRequest: {
    id: string;
    amount: number;
    status: string;
    requestedAt: string;
  } | null;
  lastEarningDate: string | null;
  nextEarningDate: string | null;
  earningStreak: number;
  totalWithdrawals: number;
  rankInfo: {
    current: string;
    nextRank: string;
    progress: number;
    requiredReferrals: number;
  };
  notifications: {
    unread: number;
    important: number;
  };
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  taskEarningDaysRemaining: number;
  totalEarningDays: number;
  qualifiedReferralsCount: number;
  pendingCommissions: number;
  bonusEarnings: number;
  daysUntilPlanExpiry?: number;
  canEarnFromTasks?: boolean;
  canEarnFromReferrals?: boolean;
  totalOrders?: number;
}

export interface RecentActivity {
  id: string;
  type: 'earning' | 'referral' | 'task' | 'withdrawal';
  description: string;
  amount?: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface TeamMember {
  id: string;
  name: string;
  joinDate: string;
  earnings: number;
  status: 'active' | 'inactive';
  level: number;
  avatar?: string;
}
