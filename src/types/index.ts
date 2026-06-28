export type UserRole = 'user' | 'admin' | 'founder'
export type ReferralStatus = 'pending' | 'active' | 'completed'
export type SubscriptionTier = 'basic' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'expired'
export type CommissionStatus = 'pending' | 'paid' | 'failed'
export type WithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected'
export type PaymentMethod = 'paypal' | 'stripe' | 'bank'
export type TransactionType = 'commission' | 'bonus' | 'withdrawal' | 'adjustment'
export type ReferralTier = 'level1' | 'level2' | 'founder'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface ReferralCode {
  id: string
  user_id: string
  code: string
  uses: number
  max_uses: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  code: string
  status: ReferralStatus
  tier: ReferralTier
  commission_percentage: number
  created_at: string
  completed_at: string | null
  referred_user?: UserProfile
}

export interface Subscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  price: number
  status: SubscriptionStatus
  started_at: string
  expires_at: string | null
  created_at: string
}

export interface Commission {
  id: string
  referral_id: string
  referrer_id: string
  referred_id: string
  month: number
  year: number
  amount: number
  percentage: number
  status: CommissionStatus
  created_at: string
  paid_at: string | null
}

export interface UserBalance {
  id: string
  user_id: string
  available_balance: number
  pending_balance: number
  total_earned: number
  total_withdrawn: number
  last_updated: string
}

export interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  payment_method: PaymentMethod
  payment_details: Record<string, string>
  status: WithdrawalStatus
  admin_notes: string | null
  requested_at: string
  approved_at: string | null
  paid_at: string | null
  rejected_at: string | null
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string | null
  reference_id: string | null
  created_at: string
}

export interface Founder {
  id: string
  user_id: string
  founder_number: number
  badge: string
  created_at: string
}

export interface ReferralTierInfo {
  id: string
  tier_name: ReferralTier
  commission_percentage: number
  min_commissions: number | null
  min_referrals: number | null
  bonus_amount: number
  description: string | null
  created_at: string
}

export interface DashboardStats {
  total_referrals: number
  active_referrals: number
  total_earned: number
  available_balance: number
  pending_balance: number
  current_tier: ReferralTier
  commission_percentage: number
  referrals_this_month: number
  earnings_this_month: number
}

export interface BonusThreshold {
  name: string
  required: number
  amount: number
  type: 'referral_count'
}

export const BONUS_THRESHOLDS: BonusThreshold[] = [
  { name: 'Primer Referido', required: 1, amount: 5, type: 'referral_count' },
  { name: '10 Referidos', required: 10, amount: 20, type: 'referral_count' },
  { name: '50 Referidos', required: 50, amount: 100, type: 'referral_count' },
  { name: '100 Referidos', required: 100, amount: 500, type: 'referral_count' },
]

export const TOP_REFERRER_BONUS = 200
export const UPGRADE_BONUS = 1
export const LEVEL2_MIN_COMMISSIONS = 25
export const LEVEL2_COMMISSION = 25
export const LEVEL1_COMMISSION = 20
export const FOUNDER_COMMISSION = 25
