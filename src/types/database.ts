/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LifeProfile {
  id: string;
  user_id: string;
  display_name: string;
  business_name: string;
  average_package_price: number;
  expected_net_margin_pct: number;
  working_days_per_week: number;
  daily_outreach_target: number;
  planning_start_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface NorthStarGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_amount: number;
  target_years: number;
  target_deadline: string;
  emotional_reason: string;
  is_core_driver: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type TaskStatus = 'backlog' | 'today' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskType = 'lead_measure' | 'support_task';

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu, 7 = Minggu

export interface RecurringTaskTemplate {
  id: string;
  user_id: string;
  title: string;
  description: string;
  business_key: string; // 'jamu_herbal' | 'akademi_spiritual' | 'pakar_digital' | 'general'
  day_of_week: number; // 1-7 (Senin-Minggu)
  task_type: TaskType; // 'lead_measure' | 'support_task'
  priority: TaskPriority | number; // 1 (high), 2 (medium), 3 (low)
  estimated_minutes: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  outreach_count?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExecutionTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  scheduled_date: string;
  due_date?: string | null;
  started_at?: string | null;
  deadline_at?: string | null;
  completed_at?: string | null;
  estimated_minutes?: number; // minutes in DB
  actual_minutes?: number; // minutes in DB
  outreach_count: number;
  sort_order: number;
  business_key?: string; // 'jamu_herbal' | 'akademi_spiritual' | 'pakar_digital' | 'general'
  recurring_template_id?: string | null;
  recurrence_date?: string | null;
  estimated_duration?: number; // backwards compatibility
  actual_duration?: number; // backwards compatibility
  created_at?: string;
  updated_at?: string;
}

export type EvaluationStatus = 'draft' | 'completed';

export interface MonthlyEvaluation {
  id: string;
  user_id: string;
  month_start: string; // 'YYYY-MM-01'
  north_star_goal_id: string | null;
  vision_target_amount: number | null;
  target_years_snapshot: number | null;
  annual_target_snapshot: number | null;
  monthly_target: number | null;
  average_package_price_snapshot: number | null;
  expected_net_margin_pct_snapshot: number | null;
  target_client_count: number | null;
  actual_net_profit: number | null;
  financial_net_profit_snapshot: number | null;
  offers_sent: number;
  outreach_count: number;
  new_clients: number;
  total_work_hours: number;
  consistent_work_days: number;
  wins: string;
  obstacles: string;
  lessons_learned: string;
  next_month_adjustments: string;
  status: EvaluationStatus;
  evaluated_at: string | null;
  business_target_snapshot?: any;
  business_sales_snapshot?: any;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialMetrics {
  northStarAmount: number;
  targetYears: number;
  annualTarget: number;
  monthlyTarget: number;
  actualNetProfit: number | null;
  achievementPercentage: number | null;
  gap: number | null;
  positiveShortfall: number;
  averagePackagePrice: number;
  expectedNetMarginPct: number;
  estimatedNetProfitPerClient: number;
  requiredClients: number | null;
}

export interface LifeBusinessTarget {
  id: string;
  user_id: string;
  business_key: string; // 'jamu_herbal' | 'akademi_spiritual' | 'pakar_digital'
  business_name?: string;
  income_stream_name?: string;
  // Life OS Funnel V2 migrated schema columns:
  allocation_percentage?: number; // e.g. 10, 50, 40
  profit_per_unit?: number; // e.g. 10000, 10000, 50000
  sales_unit?: string; // e.g. 'botol 500 ml', 'member', 'produk'
  planning_days_per_month: number; // e.g. 30
  // Previous/compatibility fields:
  activity_unit?: string;
  activity_quantity?: number;
  activity_period?: string; // 'jam' | 'hari' | 'minggu' | 'bulan'
  daily_net_profit_target?: number;
  monthly_net_profit_target?: number;
  sort_order?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LifeBusinessSale {
  id: string;
  user_id: string;
  business_key: string;
  sales_date: string; // 'YYYY-MM-DD'
  units_sold: number;
  sales_unit_snapshot?: string;
  profit_per_unit_snapshot?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

