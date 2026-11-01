/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export context, provider, and hook for unified, reactive single source of truth
export {
  useBusinessTargets,
  BusinessTargetsProvider,
  INITIAL_BUSINESS_TARGETS,
  type BusinessSummary,
  type BusinessTargetsContextType,
} from '../contexts/BusinessTargetsContext';
