import prisma from '@/libs/prisma.js';
import { convertToPrismaOrderBy, sortOptionsParser } from '@/utils/sortOptionsParser.js';
import { AuthenticatedRequest, ICommonRequestType, ICustomer, PaginationResult } from '@saleshub-tsm/types';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { getParetoProducts } from './functions.js';
import { generateLocalCode } from '@/utils/localCode.js';
import { activityLogger } from '@/services/logs/index.js';
import { handleApiError } from '@/utils/apiResponse.js';
import { customersWhereInput, productsGetPayload } from '@/generated/prisma/models.js';
import { Decimal } from '@prisma/client/runtime/client';
import { cacheGet, cacheSet } from '@/libs/cache.js';
import { getCachedFilterOptions } from '@/libs/filter-cache.js';
import { cacheKeys, invalidateCustomerFiltersCache } from '@/libs/cache-keys.js';

const CACHE_TTL = 900;

const MASTER_TTL = 3600;

type PotentialCustomerFilterOptions = {
  groupNames: string[]
  subGroupNames: string[]
  salesPersonNames: string[]
}


type CustomerFilterOptions = {
  groupNames: string[]
  subGroupNames: string[]
  salesPersonNames: string[]
}


type ProductCoverageResult = {
  summary: {
    totalItems: number
    orderedItems: number
    coverage: number
    lastPurchaseDate: Date | null
  }
  items: Array<{
    product: productsGetPayload<{}>
    revenue: number
    revenueMtd: number
    qtyKg: number
    orderedThisMonth: boolean
    lastPurchaseDate: Date | null
    isKeyProduct: boolean
  }>
}


type CustomerListQuery = {
  search?: string
  per_page?: number | string
  page?: number | string
  sort_options?: string | SortOption[]

  groups?: string | string[]
  salesPersons?: string | string[]
  subgroups?: string | string[]
  slpCode?: number
  itemCount?: number
  isNewCustomer?: string | boolean
  userId?: number
}

type SuggestedItemsResult = {
  groceries: SuggestedProduct[];
  distributor: SuggestedProduct[];
};

export type CustomerRequestType = {
  active?: string[];
  groups?: string[];
  subgroups?: string[];
  slpCode?: number;
} & ICommonRequestType;

type SortOption = {
  field: string
  order: 'asc' | 'desc'
}

export type CustomerResponseType = PaginationResult<ICustomer> & {
  groupNames?: (string | null)[];
  salesPersonNames?: (string | null)[];
  subGroupNames?: (string | null)[];
};

type ProductAnalytics = {
  ItemCode: string
  revenue: Decimal
  qtyKg: Decimal
  orderedThisMonth: boolean
  lastPurchaseDate: Date | null
  revenueMtd: Decimal
}

type CustomerRevenueResult = {
  totalRevenue: number | Decimal
  currentRevenue: number | Decimal
}

const parseSortOptions = (sort_options?: string | SortOption[]): SortOption[] => {
  if (!sort_options) return []

  if (typeof sort_options === 'string') {
    return JSON.parse(sort_options) as SortOption[]
  }

  if (Array.isArray(sort_options)) {
    return sort_options as SortOption[]
  }

  return []
}

const normalizeList = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const buildCustomerQuery = (
  search: string,
  groups?: string | string[],
  subgroups?: string | string[],
  salesPersons?: string | string[],
  slpCode?: number,
  isNewCustomer?: string | boolean,
  userId?: number
): customersWhereInput => {
  const query: customersWhereInput = {}

  if (search) {
    query.OR = [
      { CardCode: { contains: search } },
      { CardName: { contains: search } },
      { GroupName: { contains: search } },
      { CntctPrsn: { contains: search } },
      { Phone1: { contains: search } },
      { Cellular: { contains: search } },
      { SalesName: { contains: search } },
      { Address: { contains: search } },
      { City: { contains: search } },
      { PaymentTerm: { contains: search } },
      { PriceList: { contains: search } },
      {
        subgroup: {
          OR: [{ IndName: { contains: search } }, { IndDesc: { contains: search } }],
        },
      },
    ]
  }

  const selectedGroups = normalizeList(groups)
  if (selectedGroups.length > 0) {
    query.GroupName =
      selectedGroups.length === 1 ? { equals: selectedGroups[0] } : { in: selectedGroups }
  }

  const selectedSubgroups = normalizeList(subgroups)
  if (selectedSubgroups.length > 0) {
    query.subgroup = {
      is: {
        IndName:
          selectedSubgroups.length === 1
            ? { equals: selectedSubgroups[0] }
            : { in: selectedSubgroups },
      },
    }
  }

  if (slpCode) {
    query.SlpCode = Number(slpCode)
  } else if (userId) {
    query.potential_customer = {
      some: {
        sales_person_id: BigInt(userId),
      },
    }
  }

  if (isNewCustomer) {
    query.isLocal = isNewCustomer === 'true' || isNewCustomer === true
  }

  const selectedSalesPersons = normalizeList(salesPersons)
  if (selectedSalesPersons.length > 0) {
    query.SalesName =
      selectedSalesPersons.length === 1
        ? { equals: selectedSalesPersons[0] }
        : { in: selectedSalesPersons }
  }

  return query
}

const applyItemCountFilter = async (
  query: customersWhereInput,
  itemCount?: number | string
): Promise<customersWhereInput> => {
  if (!itemCount) return query

  const grouped = await prisma.$queryRaw<
    { CardCode: string; itemCount: number }[]
  >`
    SELECT
      CardCode,
      COUNT(DISTINCT ItemCode) AS itemCount
    FROM sales_invoices
    GROUP BY CardCode
    HAVING COUNT(DISTINCT ItemCode) >= ${Number(itemCount)}
  `

  query.CardCode = { in: grouped.map((g) => g.CardCode) }
  return query
}

const fetchCustomerFilterOptions = async (): Promise<CustomerFilterOptions> => {
  const [customerGroups, customerSubgroups, salesPersons] = await Promise.all([
    prisma.customers.findMany({
      distinct: ['GroupName'],
      select: {
        GroupName: true,
      }
    }),
    prisma.subgroups.findMany({
      distinct: ['IndName'],
      select: {
        IndName: true,
      },
    }),
    prisma.customers.findMany({
      distinct: ['SalesName'],
      where: {
        sales_person: {
          user: {
            isNot: null,
          },
        },
      },
      select: {
        SalesName: true,
      },
    })
  ])

  return {
    groupNames: customerGroups.map((g) => g.GroupName).filter((v): v is string => v !== null),
    subGroupNames: customerSubgroups.map((g) => g.IndName).filter((v): v is string => v !== null),
    salesPersonNames: salesPersons.map((g) => g.SalesName).filter((v): v is string => v !== null),
  }
}

export const customerList = async (
  req: Request<CustomerRequestType>,
  res: Response<CustomerResponseType>
) => {
  try {
    const {
      search = '',
      per_page = 10,
      page = 1,
      sort_options = [],
      groups,
      salesPersons,
      subgroups,
      slpCode,
      itemCount,
      isNewCustomer,
      userId
    } = req.query as CustomerListQuery

    const sortOptions = sortOptionsParser(parseSortOptions(sort_options))
    const orderBy = convertToPrismaOrderBy(sortOptions)

    let query = buildCustomerQuery(
      search,
      groups,
      subgroups,
      salesPersons,
      slpCode,
      isNewCustomer,
      userId
    )
    query = await applyItemCountFilter(query, itemCount)

    const [customers, meta] = await prisma.customers
      .paginate({
        where: query,
        include: {
          sales_person: true,
          subgroup: true,
        },
        orderBy,
      })
      .withPages({
        page: Number(page),
        limit: Number(per_page),
        includePageCount: true,
      })

    const customerFilterOptions = await getCachedFilterOptions<CustomerFilterOptions>(
      'saleshub:filters:customers',
      fetchCustomerFilterOptions,
      CACHE_TTL * 4
    )

    res.status(200).json({
      message: 'Success',
      data: {
        items: customers.map((c) => c),
        totalRecords: meta.totalCount,
        currentPage: meta.currentPage,
        perPage: Number(per_page),
        totalPages: meta.pageCount,
      },
      ...customerFilterOptions
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}


export const potentialCustomerList = async (
  req: Request<CustomerRequestType>,
  res: Response<CustomerResponseType>
) => {
  try {
    const {
      search = '',
      per_page = 10,
      page = 1,
      sort_options = [],
      groups,
      subgroups,
      salesPersons,
    } = req.query as CustomerListQuery

    const sortOptionsMapped = (): SortOption[] => {
      if (!sort_options) return []

      if (typeof sort_options === 'string') {
        return JSON.parse(sort_options) as SortOption[]
      }

      if (Array.isArray(sort_options)) {
        return sort_options as SortOption[]
      }

      return []
    }

    let selectedGroups: string[] = []
    let selectedSubgroups: string[] = []
    let selectedSalesPersons: string[] = []

    /**
     * Potential customer WAJIB memiliki record
     * di user_potential_customers.
     */
    const query: customersWhereInput = {
      potential_customer: {
        some: {},
      },
    }

    // =========================
    // SEARCH
    // =========================

    if (search) {
      query.AND = [
        {
          OR: [
            { CardCode: { contains: search } },
            { LocalCode: { contains: search } },
            { CardName: { contains: search } },
            { GroupName: { contains: search } },
            { CntctPrsn: { contains: search } },
            { Phone1: { contains: search } },
            { Cellular: { contains: search } },
            { Address: { contains: search } },
            { City: { contains: search } },
            {
              subgroup: {
                OR: [
                  { IndName: { contains: search } },
                  { IndDesc: { contains: search } },
                ],
              },
            },
          ],
        },
      ]
    }

    // =========================
    // GROUP
    // =========================

    if (groups) {
      selectedGroups = Array.isArray(groups)
        ? groups
        : [groups]
    }

    if (selectedGroups.length > 0) {
      query.GroupName =
        selectedGroups.length === 1
          ? { equals: selectedGroups[0] }
          : { in: selectedGroups }
    }

    // =========================
    // SUBGROUP
    // =========================

    if (subgroups) {
      selectedSubgroups = Array.isArray(subgroups)
        ? subgroups
        : [subgroups]
    }

    if (selectedSubgroups.length > 0) {
      query.subgroup = {
        is: {
          IndName:
            selectedSubgroups.length === 1
              ? { equals: selectedSubgroups[0] }
              : { in: selectedSubgroups },
        },
      }
    }

    // =========================
    // SALES PERSON
    // =========================

    if (salesPersons) {
      selectedSalesPersons = Array.isArray(salesPersons)
        ? salesPersons
        : [salesPersons]
    }

    if (selectedSalesPersons.length > 0) {
      query.potential_customer = {
        some: {
          sales_person: {
            SlpName:
              selectedSalesPersons.length === 1
                ? { equals: selectedSalesPersons[0] }
                : { in: selectedSalesPersons },
          },
        },
      }
    }

    // =========================
    // SORT
    // =========================

    const sortOptions =
      sortOptionsParser(sortOptionsMapped())

    const orderBy =
      convertToPrismaOrderBy(sortOptions)

    // =========================
    // CUSTOMERS
    // =========================

    const [customers, meta] = await prisma.customers
      .paginate({
        where: query,

        include: {
          subgroup: true,

          potential_customer: {
            include: {
              sales_person: true,
            },
          },
        },

        orderBy,
      })
      .withPages({
        page: Number(page),
        limit: Number(per_page),
        includePageCount: true,
      })

    // =========================
    // FILTER OPTIONS CACHE
    // =========================

    const {
      groupNames,
      subGroupNames,
      salesPersonNames,
    } =
      await getCachedFilterOptions<PotentialCustomerFilterOptions>(
        'saleshub:filters:potential-customers',

        async () => {
          const [
            customerGroup,
            customerSubgroups,
            salesPersonsData,
          ] = await Promise.all([
            prisma.customers.findMany({
              where: {
                potential_customer: {
                  some: {},
                },
              },
              distinct: ['GroupName'],
              select: {
                GroupName: true,
              },
            }),

            prisma.customers.findMany({
              where: {
                potential_customer: {
                  some: {},
                },
                subgroup: {
                  isNot: null,
                },
              },
              distinct: ['GroupName'],
              select: {
                subgroup: {
                  select: {
                    IndName: true,
                  },
                },
              },
            }),

            prisma.sales_persons.findMany({
              where: {
                potential_customers: {
                  some: {},
                },
              },
              select: {
                id: true,
                SlpName: true,
              },
              orderBy: {
                SlpName: 'asc',
              },
            }),
          ])

          // =========================
          // OPTIONS
          // =========================

          const groupNames = customerGroup
            .map((g) => g.GroupName)
            .filter(
              (name): name is string =>
                name !== null
            )

          const subGroupNames = [
            ...new Set(
              customerSubgroups
                .map(
                  (c) =>
                    c.subgroup?.IndName
                )
                .filter(
                  (name): name is string =>
                    name !== null &&
                    name !== undefined
                )
            ),
          ]

          const salesPersonNames =
            salesPersonsData
              .map((sp) => sp.SlpName)
              .filter(
                (name): name is string =>
                  name !== null
              )

          return {
            groupNames,
            subGroupNames,
            salesPersonNames,
          }
        },

        3600
      )

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      message: 'Success',

      data: {
        items: customers,
        totalRecords: meta.totalCount,
        currentPage: meta.currentPage,
        perPage: Number(per_page),
        totalPages: meta.pageCount,
      },

      groupNames,
      salesPersonNames,
      subGroupNames,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}


export const customerSummary = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: 'Customer ID is required',
      });
    }

    let customerId: bigint;

    try {
      customerId = BigInt(id);
    } catch {
      return res.status(400).json({
        message: 'Invalid customer ID',
      });
    }

    const customer = await prisma.customers.findUnique({
      where: {
        id: customerId,
      },
      include: {
        sales_person: true,
        sales_invoices: {
          include: {
            product: true,
            returs: {
              select: {
                TotalSales: true,
              },
            },
          },
        },
        subgroup: true,
      },
    });

    const customerWithNetSales = customer
      ? {
        ...customer,
        sales_invoices: customer.sales_invoices.map(
          ({ returs, ...invoice }) => {
            const totalRetur = returs.reduce(
              (sum, retur) => sum + Number(retur.TotalSales ?? 0),
              0
            );

            return {
              ...invoice,
              TotalSales: Number(invoice.TotalSales ?? 0) + totalRetur,
            };
          }
        ),
      }
      : null;

    return res.status(200).json({
      message: 'Success',
      data: customerWithNetSales,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
};

export const itemSuggestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { distributor, groceries } = await getSuggestedItems(Number(id), false);

    res.status(200).json({
      message: 'Success',
      data: { distributor, groceries },
    });
  } catch (error) {
    return handleApiError(error, res)
  }
};

export const purchaseHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params

    const customerId = Number(id)

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        message: 'Invalid customer ID',
      })
    }

    // =========================
    // CACHE
    // =========================

    const cacheKey =
      `saleshub:customer-purchase-history:${customerId}`

    const cached = await cacheGet<{
      customer: {
        id: number
        CardCode: string | null
        CardName: string | null
        LocalCode: string | null
        GroupName: string | null
        SalesName: string | null
      } | null
      lastPurchase: Array<{
        id: bigint
        DocNum: number
        LineNum: number
        DocDate: Date | null
        CardCode: string
        CardName: string | null
        ItemCode: string
        Dscription: string | null
        QtyKg: Decimal | null
        unitMsr: string | null
        PriceBefDisc: Decimal | null
        DiscLine: Decimal | null
        DiscTotal: Decimal | null
        TotalSales: Decimal | null
        created_at: Date | null
        updated_at: Date | null
        product: productsGetPayload<{}>
        hasRetur: boolean
      }>
      ordersByRange: {
        current: number
        last3Months: number
        last6Months: number
      }
      invoiceCountByRange: {
        current: number
        last3Months: number
        last6Months: number
      }
    }>(cacheKey)

    if (cached) {
      return res.status(200).json({
        message: 'Success',
        data: cached,
      })
    }

    // =========================
    // DATE RANGES
    // =========================

    const now = dayjs()

    const currentStart = now.startOf('month').toDate()
    const last3MonthsStart = now.subtract(3, 'month').toDate()
    const last6MonthsStart = now.subtract(6, 'month').toDate()
    const rangeEnd = now.toDate()

    // =========================
    // CUSTOMER
    // =========================
    // Hanya kolom ringan. Riwayat invoice
    // tidak pernah dikirim ke frontend
    // dari endpoint ini.

    const customer = await prisma.customers.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        CardCode: true,
        CardName: true,
        LocalCode: true,
        GroupName: true,
        SalesName: true,
      },
    })

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      })
    }

    const emptyRange = {
      current: 0,
      last3Months: 0,
      last6Months: 0,
    }

    if (!customer.CardCode) {
      const emptyResult = {
        customer,
        lastPurchase: [],
        ordersByRange: emptyRange,
        invoiceCountByRange: emptyRange,
      }

      await cacheSet(
        cacheKey,
        emptyResult,
        CACHE_TTL
      )

      return res.status(200).json({
        message: 'Success',
        data: emptyResult,
      })
    }

    const cardCode = customer.CardCode

    // =========================
    // AGGREGATION
    // =========================
    // Dihitung di database, bukan dengan
    // menarik seluruh baris ke memory.

    type RangeCountRow = {
      current: number
      last3Months: number
      last6Months: number
    }

    const [
      invoiceCounts,
      orderCounts,
      latestDoc,
    ] = await Promise.all([
      prisma.$queryRaw<RangeCountRow[]>`
        SELECT
          COUNT(CASE
            WHEN DocDate >= ${currentStart}
             AND DocDate <= ${rangeEnd}
            THEN 1 END) AS current,
          COUNT(CASE
            WHEN DocDate >= ${last3MonthsStart}
             AND DocDate <= ${rangeEnd}
            THEN 1 END) AS last3Months,
          COUNT(CASE
            WHEN DocDate >= ${last6MonthsStart}
             AND DocDate <= ${rangeEnd}
            THEN 1 END) AS last6Months
        FROM sales_invoices
        WHERE CardCode = ${cardCode}
      `,

      prisma.$queryRaw<RangeCountRow[]>`
        SELECT
          COUNT(CASE
            WHEN DocDate >= ${currentStart}
             AND DocDate <= ${rangeEnd}
            THEN 1 END) AS current,
          COUNT(CASE
            WHEN DocDate >= ${last3MonthsStart}
             AND DocDate <= ${rangeEnd}
            THEN 1 END) AS last3Months,
          COUNT(CASE
            WHEN DocDate >= ${last6MonthsStart}
             AND DocDate <= ${rangeEnd}
            THEN 1 END) AS last6Months
        FROM orders
        WHERE CardCode = ${cardCode}
      `,

      prisma.sales_invoices.findFirst({
        where: {
          CardCode: cardCode,
        },
        orderBy: {
          DocNum: 'desc',
        },
        select: {
          DocNum: true,
        },
      }),
    ])

    const invoiceCountByRange = {
      current: Number(invoiceCounts[0]?.current ?? 0),
      last3Months: Number(invoiceCounts[0]?.last3Months ?? 0),
      last6Months: Number(invoiceCounts[0]?.last6Months ?? 0),
    }

    const ordersByRange = {
      current: Number(orderCounts[0]?.current ?? 0),
      last3Months: Number(orderCounts[0]?.last3Months ?? 0),
      last6Months: Number(orderCounts[0]?.last6Months ?? 0),
    }

    // =========================
    // LAST PURCHASE
    // =========================
    // Hanya baris dari dokumen terakhir,
    // bukan seluruh riwayat.

    const lastPurchase = latestDoc
      ? await prisma.sales_invoices.findMany({
        where: {
          CardCode: cardCode,
          DocNum: latestDoc.DocNum,
        },
        include: {
          product: true,
          returs: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          LineNum: 'asc',
        },
      }).then((rows) =>
        rows.map((inv) => ({
          ...inv,
          hasRetur: (inv.returs?.length ?? 0) > 0,
        }))
      )
      : []

    // =========================
    // RESULT
    // =========================

    const resultData = {
      customer,
      lastPurchase,
      ordersByRange,
      invoiceCountByRange,
    }

    // =========================
    // CACHE - 15 MIN
    // =========================

    await cacheSet(
      cacheKey,
      resultData,
      CACHE_TTL
    )

    return res.status(200).json({
      message: 'Success',
      data: resultData,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}

type SuggestedProduct = productsGetPayload<{
  include: {
    product_developments: true
  }
}> & {
  isDevelopment: boolean
}


export const getSuggestedItems = async (
  id: number,
  includeRecentOffered: boolean = false
): Promise<SuggestedItemsResult> => {
  try {
    const cacheKey =
      `saleshub:suggested-items:${id}:${includeRecentOffered ? 'with-recent' : 'without-recent'}`;

    // =============================
    // CACHE
    // =============================
    const cached = await cacheGet<SuggestedItemsResult>(cacheKey);

    if (cached) {
      return cached;
    }

    // =============================
    // CUSTOMER
    // =============================
    // Hanya untuk memastikan customer ada.
    // Subgroup tidak digunakan langsung di function ini.
    const customer = await prisma.customers.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!customer) {
      return {
        groceries: [],
        distributor: [],
      };
    }

    // =============================
    // CUSTOMER PURCHASE HISTORY
    // =============================
    const customerItems = await prisma.sales_invoices.findMany({
      where: {
        customer: { id },
      },
      distinct: ['ItemCode'],
      select: {
        ItemCode: true,
      },
    });

    const boughtSet = new Set(
      customerItems
        .map((item) => item.ItemCode)
        .filter(
          (code): code is string =>
            code !== null
        )
    );

    // =============================
    // RECENT OFFERED PRODUCTS
    // =============================
    const recentVisitItems = await prisma.visit_items.findMany({
      where: {
        offered: true,

        OR: [
          {
            visit_item_concerns: {
              some: {
                status: {
                  requires_action: false,
                },
              },
            },
          },
          {
            created_at: {
              gte: dayjs()
                .subtract(30, 'days')
                .toDate(),
            },

            visit_item_concerns: {
              some: {
                status: {
                  requires_action: false,
                },
              },
            },
          },
        ],

        visit: {
          customer_id: id,
        },
      },

      select: {
        product_id: true,
      },
    });

    const recentProductIds = new Set(
      recentVisitItems.map(
        (item) => Number(item.product_id)
      )
    );

    // =============================
    // DISTRIBUTOR PRODUCTS
    // =============================
    const distributorProducts =
      await prisma.products.findMany({
        where: {
          Distributor: 'Y',
        },

        include: {
          product_developments: true,
        },
      });

    let distributorItems: SuggestedProduct[] =
      distributorProducts
        .map((product) => ({
          ...product,

          isDevelopment:
            product.product_developments.length > 0,
        }))
        .filter(
          (product) =>
            !boughtSet.has(product.ItemCode)
        )
        .sort(
          (a, b) =>
            Number(b.isDevelopment) -
            Number(a.isDevelopment)
        );

    // =============================
    // GROCERY / PARETO
    // =============================
    const pareto =
      await getParetoProducts(id);

    // Copy array sebelum sort.
    // Jangan mutate result dari getParetoProducts.
    let paretoProduct = [...pareto].sort(
      (a, b) =>
        Number(b.isDevelopment) -
        Number(a.isDevelopment)
    );

    // =============================
    // FILTER RECENT OFFERED
    // =============================
    if (!includeRecentOffered) {
      distributorItems =
        distributorItems.filter(
          (product) =>
            !recentProductIds.has(
              Number(product.id)
            )
        );

      paretoProduct =
        paretoProduct.filter(
          (product) =>
            !recentProductIds.has(
              Number(product.id)
            )
        );
    }

    // =============================
    // RESULT
    // =============================
    const result: SuggestedItemsResult = {
      distributor: distributorItems,
      groceries: paretoProduct,
    };

    // Cache 15 menit
    await cacheSet(
      cacheKey,
      result,
      CACHE_TTL
    );

    return result;

  } catch (err) {
    console.error(
      'getSuggestedItems error:',
      err
    );

    return {
      groceries: [],
      distributor: [],
    };
  }
}

export const fetchSubgroups = async (req: Request, res: Response) => {
  try {
    const subgroups = await getCachedFilterOptions<{
      IndCode: number
      IndName: string
    }[]>(
      cacheKeys.customerSubgroups(),
      async () =>
        prisma.subgroups.findMany({
          select: {
            IndCode: true,
            IndName: true,
          },
          distinct: ['IndCode'],
        }),
      MASTER_TTL
    );
    res.status(200).json({ message: 'Subgroups fetched successfully', data: subgroups });
  } catch (error) {
    return handleApiError(error, res)
  }
};

export const fetchGroups = async (req: Request, res: Response) => {
  try {
    const groups = await getCachedFilterOptions<{
      GroupName: string | null
    }[]>(
      cacheKeys.customerGroups(),
      async () =>
        prisma.customers.findMany({
          select: {
            GroupName: true,
          },
          distinct: ['GroupName'],
        }),
      MASTER_TTL
    );
    res.status(200).json({ message: 'Groups fetched successfully', data: groups });
  } catch (error) {
    return handleApiError(error, res)
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      CardCode,
      CardName,
      GroupName,
      CntctPrsn,
      SlpCode,
      SalesName,
      subgroup,
      City,
      Address,
      Cellular,
      Phone1
    } = req.body;
    const newCustomer = await prisma.customers.create({
      data: {
        LocalCode: await generateLocalCode(),
        isLocal: true,
        CardCode,
        CardName,
        GroupName,
        Cellular,
        CntctPrsn,
        SalesName,
        City,
        Phone1,
        Address,
        sales_person: { connect: { SlpCode: Number(SlpCode) } },
        subgroup: { connect: { IndCode: subgroup } },

      },
      include: {
        sales_person: true,
      }
    });

    // Customer baru mengubah daftar
    // group, subgroup, dan sales person
    // yang dipakai sebagai filter option.

    await invalidateCustomerFiltersCache();

    activityLogger({
      req,
      actionType: 'Customer',
      description: `New customer created: ${CardName}`,
      status: 'SUCCESS'
    })
    res.status(200).json({ message: 'Customer created successfully', data: { newCustomer } });
  } catch (error) {

    const errorMessage = (error as Error).message;
    activityLogger({
      req,
      actionType: 'Customer',
      description: `Create customer failed: ${errorMessage}`,
      status: 'FAILED'
    })
    return handleApiError(error, res)
  }
}

export const fetchCustomerRevenue = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const customerId = Number(req.params.id)

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        message: 'Invalid customer ID',
      })
    }

    // =========================
    // CACHE
    // =========================

    const cacheKey =
      `saleshub:customer-revenue:${customerId}`

    const cached =
      await cacheGet<CustomerRevenueResult>(cacheKey)

    if (cached) {
      return res.status(200).json({
        message: 'Customer revenue fetched successfully',
        data: cached,
      })
    }

    // =========================
    // CUSTOMER
    // =========================

    const customer = await prisma.customers.findUnique({
      where: {
        id: customerId,
      },
      select: {
        CardCode: true,
      },
    })

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      })
    }

    if (!customer.CardCode) {
      const emptyResult: CustomerRevenueResult = {
        currentRevenue: 0,
        totalRevenue: 0,
      }

      await cacheSet(
        cacheKey,
        emptyResult,
        CACHE_TTL
      )

      return res.status(200).json({
        message: 'Customer revenue fetched successfully',
        data: emptyResult,
      })
    }

    // =========================
    // REVENUE QUERY
    // =========================

    const [result] = await prisma.$queryRaw<
      CustomerRevenueResult[]
    >`
      WITH invoice_revenue AS (
          SELECT
              s.DocDate,
              s.TotalSales + COALESCE(r.total_retur, 0) AS revenue
          FROM sales_invoices s
          INNER JOIN customers c
              ON c.CardCode = s.CardCode
          LEFT JOIN (
              SELECT
                  DocNum,
                  LineNum,
                  SUM(TotalSales) AS total_retur
              FROM retur_invoices
              GROUP BY DocNum, LineNum
          ) r
              ON r.DocNum = s.DocNum
            AND r.LineNum = s.LineNum
          WHERE c.id = ${customerId}
      )

      SELECT
          COALESCE(
              SUM(
                  CASE
                      WHEN DocDate >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), '%Y-%m-01')
                      AND DocDate < DATE_FORMAT(CURDATE(), '%Y-%m-01')
                      THEN revenue
                      ELSE 0
                  END
              ),
              0
          ) AS totalRevenue,

          COALESCE(
              SUM(
                  CASE
                      WHEN YEAR(DocDate) = YEAR(CURDATE())
                      AND MONTH(DocDate) = MONTH(CURDATE())
                      THEN revenue
                      ELSE 0
                  END
              ),
              0
          ) AS currentRevenue

      FROM invoice_revenue;
      `

    // =========================
    // NORMALIZE RESULT
    // =========================

    const resultData: CustomerRevenueResult = {
      currentRevenue:
        Number(result?.currentRevenue ?? 0),

      totalRevenue:
        Number(result?.totalRevenue ?? 0),
    }

    // =========================
    // CACHE 15 MINUTES
    // =========================

    await cacheSet(
      cacheKey,
      resultData,
      CACHE_TTL
    )

    return res.status(200).json({
      message: 'Customer revenue fetched successfully',
      data: resultData,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}

export const fetchProductCoverageByCustomer = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const customerId = Number(req.params.id)

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        message: 'Invalid customer ID',
      })
    }

    // =============================
    // CACHE
    // =============================

    const cacheKey =
      `saleshub:customer-product-coverage:${customerId}`

    const cached =
      await cacheGet<ProductCoverageResult>(cacheKey)

    if (cached) {
      return res.json({
        message: 'Customer product coverage fetched successfully',
        data: cached,
      })
    }

    // =============================
    // CUSTOMER
    // =============================

    const customer = await prisma.customers.findUnique({
      where: {
        id: customerId,
      },
      select: {
        CardCode: true,
      },
    })

    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found',
      })
    }

    if (!customer.CardCode) {
      return res.json({
        message: 'Customer product coverage fetched successfully',
        data: {
          summary: {
            totalItems: 0,
            orderedItems: 0,
            coverage: 0,
            lastPurchaseDate: null,
          },
          items: [],
        },
      })
    }

    // =============================
    // PRODUCT ANALYTICS
    // =============================

    const productAnalytics =
      await prisma.$queryRaw<ProductAnalytics[]>`
        WITH retur_summary AS (
          SELECT
            DocNum,
            LineNum,
            SUM(TotalSales) AS retur_amount
          FROM retur_invoices
          GROUP BY
            DocNum,
            LineNum
        )

        SELECT
          s.ItemCode,

          SUM(
            s.TotalSales + COALESCE(r.retur_amount, 0)
          ) AS revenue,

          SUM(
            CASE
              WHEN s.DocDate >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND s.DocDate < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              THEN s.TotalSales + COALESCE(r.retur_amount, 0)
              ELSE 0
            END
          ) AS revenueMtd,

          SUM(s.QtyKg) AS qtyKg,

          MAX(s.DocDate) AS lastPurchaseDate,

          MAX(
            s.DocDate >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
          ) AS orderedThisMonth

        FROM sales_invoices s

        LEFT JOIN retur_summary r
          ON r.DocNum = s.DocNum
          AND r.LineNum = s.LineNum

        WHERE
          s.CardCode = ${customer.CardCode}

        GROUP BY
          s.ItemCode

        HAVING
          revenue <> 0

        ORDER BY
          revenue DESC,
          qtyKg DESC,
          s.ItemCode;
      `

    // =============================
    // PRODUCTS
    // =============================

    const products = await prisma.products.findMany({
      where: {
        ItemCode: {
          in: productAnalytics.map(
            (pa) => pa.ItemCode
          ),
        },
        validFor: 'Y',
        frozenFor: 'N',
      },
    })

    const productMap = new Map(
      products.map((p) => [p.ItemCode, p])
    )

    const items = productAnalytics
      .filter((pa) =>
        productMap.has(pa.ItemCode)
      )
      .map((pa) => ({
        product: productMap.get(pa.ItemCode)!,
        revenue: Number(pa.revenue),
        revenueMtd: Number(pa.revenueMtd),
        qtyKg: Number(pa.qtyKg),
        orderedThisMonth:
          Boolean(pa.orderedThisMonth),
        lastPurchaseDate:
          pa.lastPurchaseDate,
      }))

    // =============================
    // COVERAGE
    // =============================

    const totalItems = items.length

    const orderedItems = items.filter(
      (item) => item.orderedThisMonth
    ).length

    const coverage =
      totalItems === 0
        ? 0
        : (orderedItems / totalItems) * 100

    const lastPurchaseDate =
      items.reduce<Date | null>(
        (latest, item) => {
          if (!item.lastPurchaseDate) {
            return latest
          }

          if (
            !latest ||
            item.lastPurchaseDate > latest
          ) {
            return item.lastPurchaseDate
          }

          return latest
        },
        null
      )

    // =============================
    // KEY PRODUCTS
    // =============================

    const totalRevenue = items.reduce(
      (sum, item) =>
        sum + Number(item.revenue),
      0
    )

    const keyRevenue = totalRevenue * 0.8

    let cumulativeRevenue = 0

    const itemsWithKeyFlag = items.map(
      (item) => {
        const revenue =
          Number(item.revenue)

        const isKeyProduct =
          cumulativeRevenue < keyRevenue

        cumulativeRevenue += revenue

        return {
          ...item,
          isKeyProduct,
        }
      }
    )

    // =============================
    // RESULT
    // =============================

    const result: ProductCoverageResult = {
      summary: {
        totalItems,
        orderedItems,
        coverage,
        lastPurchaseDate,
      },
      items: itemsWithKeyFlag,
    }

    // =============================
    // CACHE 15 MINUTES
    // =============================

    await cacheSet(
      cacheKey,
      result,
      CACHE_TTL
    )

    return res.json({
      message:
        'Customer product coverage fetched successfully',
      data: result,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}
