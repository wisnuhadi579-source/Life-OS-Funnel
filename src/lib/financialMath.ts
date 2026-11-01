/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinancialMetrics, LifeProfile, NorthStarGoal } from '../types/database';

/**
 * Calculate all financial metrics derived from the Core Driver goal, profile assumptions, and actual Net Profit.
 */
export function calculateFinancialMetrics(
  coreGoal: NorthStarGoal | null | undefined,
  profile: LifeProfile | null | undefined,
  actualNetProfit: number | null
): FinancialMetrics {
  const northStarAmount = coreGoal?.target_amount ?? 0;
  const targetYears = coreGoal?.target_years && coreGoal.target_years > 0 ? coreGoal.target_years : 1;

  const annualTarget = northStarAmount > 0 ? northStarAmount / targetYears : 0;
  const monthlyTarget = annualTarget > 0 ? annualTarget / 12 : 0;

  let achievementPercentage: number | null = null;
  let gap: number | null = null;
  let positiveShortfall = 0;

  if (actualNetProfit !== null) {
    if (monthlyTarget > 0) {
      achievementPercentage = (actualNetProfit / monthlyTarget) * 100;
      gap = monthlyTarget - actualNetProfit;
      positiveShortfall = Math.max(0, gap);
    } else {
      achievementPercentage = null;
      gap = null;
      positiveShortfall = 0;
    }
  }

  const averagePackagePrice = profile?.average_package_price ?? 0;
  const expectedNetMarginPct = profile?.expected_net_margin_pct ?? 0;

  const estimatedNetProfitPerClient =
    averagePackagePrice > 0 && expectedNetMarginPct > 0
      ? (averagePackagePrice * expectedNetMarginPct) / 100
      : 0;

  const requiredClients =
    estimatedNetProfitPerClient > 0 && monthlyTarget > 0
      ? Math.ceil(monthlyTarget / estimatedNetProfitPerClient)
      : null;

  return {
    northStarAmount,
    targetYears,
    annualTarget,
    monthlyTarget,
    actualNetProfit,
    achievementPercentage,
    gap,
    positiveShortfall,
    averagePackagePrice,
    expectedNetMarginPct,
    estimatedNetProfitPerClient,
    requiredClients,
  };
}

export interface BusinessSalesTargetMetrics {
  businessKey: string;
  allocationPercentage: number;
  profitPerUnit: number;
  salesUnit: string;
  planningDaysPerMonth: number;
  monthlyAllocationAmount: number;
  monthlySalesTarget: number;
  dailySalesTarget: number;
  dailyAllocationAmount: number;
}

/**
 * Life OS Funnel V2 Sales Target calculation derived from North Star monthly target.
 * Formulas:
 * monthlyTarget = northStarAmount / (targetYears * 12)
 * monthlySalesTarget = Math.ceil((monthlyTarget * allocationPercentage / 100) / profitPerUnit)
 * dailySalesTarget = Math.ceil(monthlySalesTarget / planningDaysPerMonth)
 */
export function calculateBusinessSalesTarget(
  monthlyTarget: number,
  allocationPercentage: number,
  profitPerUnit: number,
  planningDaysPerMonth: number = 30,
  salesUnit: string = 'unit',
  businessKey: string = ''
): BusinessSalesTargetMetrics {
  const safeAllocationPct = Math.max(0, Number(allocationPercentage) || 0);
  const safeProfitPerUnit = Math.max(1, Number(profitPerUnit) || 1);
  const safePlanningDays = Math.max(1, Number(planningDaysPerMonth) || 30);

  const monthlyAllocationAmount = (monthlyTarget * safeAllocationPct) / 100;
  const monthlySalesTarget = Math.ceil(monthlyAllocationAmount / safeProfitPerUnit);
  const dailySalesTarget = Math.ceil(monthlySalesTarget / safePlanningDays);
  const dailyAllocationAmount = safePlanningDays > 0 ? monthlyAllocationAmount / safePlanningDays : 0;

  return {
    businessKey,
    allocationPercentage: safeAllocationPct,
    profitPerUnit: safeProfitPerUnit,
    salesUnit,
    planningDaysPerMonth: safePlanningDays,
    monthlyAllocationAmount,
    monthlySalesTarget,
    dailySalesTarget,
    dailyAllocationAmount,
  };
}

