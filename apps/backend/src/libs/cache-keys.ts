import { cacheDelete, cacheDeletePattern } from '@/libs/cache.js';

export const cacheKeys = {
  // =====================================================
  // FILTER OPTIONS (master data, jarang berubah)
  // =====================================================

  customerFilters: () => 'saleshub:filters:customers',
  potentialCustomerFilters: () =>
    'saleshub:filters:potential-customers',
  productCategories: () =>
    'saleshub:filters:product-categories',
  customerGroups: () => 'saleshub:master:customer-groups',
  customerSubgroups: () => 'saleshub:master:customer-subgroups',
  competitors: () => 'saleshub:master:competitors',
  salesPersons: (scope: string) =>
    `saleshub:master:sales-persons:${scope}`,
  activityActionTypes: () =>
    'saleshub:master:activity-action-types',

  // =====================================================
  // PER-CUSTOMER
  // =====================================================

  customerPurchaseHistory: (id: number) =>
    `saleshub:customer-purchase-history:${id}`,
  customerRevenue: (id: number) =>
    `saleshub:customer-revenue:${id}`,
  customerProductCoverage: (id: number) =>
    `saleshub:customer-product-coverage:${id}`,

  // =====================================================
  // PER-USER
  // =====================================================

  userMe: (id: number) => `saleshub:user:me:${id}`,
  userConfig: (id: number) =>
    `saleshub:user:config:${id}`,
} as const;

// =====================================================
// INVALIDATION HELPERS
// =====================================================
// Panggil setelah mutasi database.
// Redis gagal tidak boleh menggagalkan request,
// jadi helper ini tidak melempar error.

// =====================================================
// CUSTOMER
// =====================================================

export const invalidateCustomerCache = async (
  customerId: number,
): Promise<void> => {
  await Promise.all([
    cacheDelete(
      cacheKeys.customerPurchaseHistory(customerId),
      cacheKeys.customerRevenue(customerId),
      cacheKeys.customerProductCoverage(customerId),
    ),
    cacheDeletePattern(
      `saleshub:suggested-items:${customerId}:*`,
    ),
    cacheDeletePattern(
      `saleshub:pareto-products:${customerId}:*`,
    ),
  ]);
};

// =====================================================
// CUSTOMER FILTER OPTIONS
// =====================================================
// Dipanggil ketika customer dibuat,
// diimpor, atau potential customer berubah.

export const invalidateCustomerFiltersCache =
  async (): Promise<void> => {
    await Promise.all([
      cacheDelete(
        cacheKeys.customerFilters(),
        cacheKeys.potentialCustomerFilters(),
      ),
    ]);
  };

// =====================================================
// SUMMARY
// =====================================================

export const invalidateSummaryCache = async (): Promise<void> => {
  await cacheDeletePattern('saleshub:summary:*');
};

// =====================================================
// SALES PERSON MASTER
// =====================================================

export const invalidateSalesPersonsCache =
  async (): Promise<void> => {
    await cacheDeletePattern(
      'saleshub:master:sales-persons:*',
    );
  };

// =====================================================
// USER
// =====================================================

export const invalidateUserCache = async (
  userId: number,
): Promise<void> => {
  await Promise.all([
    cacheDelete(
      cacheKeys.userMe(userId),
      cacheKeys.userConfig(userId),
    ),
    cacheDeletePattern('saleshub:visits-followups:*'),
    cacheDeletePattern('saleshub:schedule-list:*'),
    invalidateSalesPersonsCache(),
  ]);
};

// =====================================================
// VISIT / SCHEDULE
// =====================================================
// Dipanggil saat visit, item, concern,
// atau schedule berubah.

export const invalidateVisitCache = async (): Promise<void> => {
  await Promise.all([
    cacheDeletePattern('saleshub:schedule-list:*'),
    cacheDeletePattern('saleshub:schedule-by-date:*'),
    cacheDeletePattern('saleshub:schedule-by-sales-person:*'),
    cacheDeletePattern('saleshub:visits-followups:*'),
  ]);
};
