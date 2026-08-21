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
  totalRevenue: Decimal
  currentRevenue: Decimal
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
    } = req.query as CustomerListQuery;

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

    let selectedGroups: string[] = [];
    let selectedSubgroups: string[] = [];
    const activeOpts: string[] = [];
    let selectedSalesPersons: string[] = [];

    const query: customersWhereInput = search
      ? {
        OR: [
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
        ],
      }
      : {};

    if (activeOpts.length > 0) {
      query.NonActive = activeOpts.length === 1 ? { equals: activeOpts[0] } : { in: activeOpts };
    }

    if (groups) {
      if (Array.isArray(groups)) {
        selectedGroups = groups;
      } else {
        selectedGroups = [groups];
      }
    }
    if (subgroups) {
      if (Array.isArray(subgroups)) {
        selectedSubgroups = subgroups;
      } else {
        selectedSubgroups = [subgroups];
      }
    }

    if (slpCode) {
      query.SlpCode = Number(slpCode);
    } else if (userId) {
      query.potential_customers = {
        some: {
          user_id: BigInt(userId),
        },
      };
    }

    if (isNewCustomer) {
      query.isLocal = isNewCustomer === 'true' || isNewCustomer === true;
    }

    if (selectedGroups.length > 0) {
      query.GroupName =
        selectedGroups.length === 1 ? { equals: selectedGroups[0] } : { in: selectedGroups };
    }

    if (selectedSubgroups.length > 0) {
      query.subgroup = {
        is: {
          IndName:
            selectedSubgroups.length === 1
              ? { equals: selectedSubgroups[0] }
              : { in: selectedSubgroups },
        },
      };
    }


    if (salesPersons) {
      if (Array.isArray(salesPersons)) {
        selectedSalesPersons = salesPersons;
      } else {
        selectedSalesPersons = [salesPersons];
      }
    }

    if (selectedSalesPersons.length > 0) {
      query.SalesName =
        selectedSalesPersons.length === 1
          ? { equals: selectedSalesPersons[0] }
          : { in: selectedSalesPersons };
    }
    if (itemCount) {
      // prettier-ignore
      const grouped = await prisma.$queryRaw<
        { CardCode: string; itemCount: number }[]
      >`
        SELECT
          CardCode,
          COUNT(DISTINCT ItemCode) AS itemCount
        FROM sales_invoices
        GROUP BY CardCode
        HAVING COUNT(DISTINCT ItemCode) >= ${Number(itemCount)}
      `;

      query.CardCode = { in: grouped.map((g) => g.CardCode) };
    }

    const sortOptions = sortOptionsParser(sortOptionsMapped());
    const orderBy = convertToPrismaOrderBy(sortOptions);

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
      });

    const customerGroup = await prisma.customers.findMany({
      distinct: ['GroupName'],
      select: {
        GroupName: true,
      },
    });

    const customerSubgroups = await prisma.subgroups.findMany({
      distinct: ['IndName'],
      select: {
        IndName: true,
      },
    });

    const salesPersonsData = await prisma.customers.findMany({
      distinct: ['SalesName'],
      where: {
        sales_person: {
          user: {
            isNot: null
          }
        }
      },
      select: {
        SalesName: true,
      },
    });

    const salesPersonNames: (string | null)[] = salesPersonsData.map((sp) => sp.SalesName);
    const groupNames: (string | null)[] = customerGroup.map((g) => g.GroupName);
    const subGroupNames: (string | null)[] = customerSubgroups.map((g) => g.IndName);

    res.status(200).json({
      message: 'Success',
      data: {
        items: customers.map((c) => c),
        totalRecords: meta.totalCount,
        currentPage: meta.currentPage,
        perPage: Number(per_page),
        totalPages: meta.pageCount,
      },
      groupNames,
      salesPersonNames,
      subGroupNames,
    });
  } catch (error) {
    return handleApiError(error, res)
  }
};

export const customerSummary = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customers.findUnique({
      where: { id: Number(id) },
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
        sales_invoices: customer.sales_invoices.map(({ returs, ...invoice }) => {
          const totalRetur = returs.reduce(
            (sum, retur) => sum + Number(retur.TotalSales ?? 0),
            0
          );

          return {
            ...invoice,
            TotalSales: Number(invoice.TotalSales ?? 0) + totalRetur,
          };
        }),
      }
      : null;

    res.status(200).json({ message: 'Success', data: customerWithNetSales });
  } catch (error) {
    return handleApiError(error, res)
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

export const purchaseHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customers.findUnique({
      where: { id: Number(id) },
      include: {
        sales_invoices: {
          include: {
            product: true,
            returs: true,
          },
          orderBy: {
            DocDate: 'desc',
          },
        },
        orders: {
          orderBy: {
            DocDate: 'desc',
          },
        },
      },
    });

    const now = dayjs();

    const ranges = {
      current: {
        start: now.startOf('month').toDate(),
        end: now.toDate(),
      },
      last3Months: {
        start: now.subtract(3, 'month').toDate(),
        end: now.toDate(),
      },
      last6Months: {
        start: now.subtract(6, 'month').toDate(),
        end: now.toDate(),
      },
    };

    const allOrders = customer?.orders;

    const ordersByRange = {
      current: allOrders?.filter(
        (o) =>
          dayjs(o.DocDate).toDate() >= ranges.current.start &&
          dayjs(o.DocDate).toDate() <= ranges.current.end
      ).length,
      last3Months: allOrders?.filter(
        (o) =>
          dayjs(o.DocDate).toDate() >= ranges.last3Months.start &&
          dayjs(o.DocDate).toDate() <= ranges.last3Months.end
      ).length,
      last6Months: allOrders?.filter(
        (o) =>
          dayjs(o.DocDate).toDate() >= ranges.last6Months.start &&
          dayjs(o.DocDate).toDate() <= ranges.last6Months.end
      ).length,
    };

    const allInvoices = customer?.sales_invoices;

    const invoiceCountByRange = {
      current: allInvoices?.filter(
        (o) =>
          dayjs(o.DocDate).toDate() >= ranges.current.start &&
          dayjs(o.DocDate).toDate() <= ranges.current.end
      ).length,
      last3Months: allInvoices?.filter(
        (o) =>
          dayjs(o.DocDate).toDate() >= ranges.last3Months.start &&
          dayjs(o.DocDate).toDate() <= ranges.last3Months.end
      ).length,
      last6Months: allInvoices?.filter(
        (o) =>
          dayjs(o.DocDate).toDate() >= ranges.last6Months.start &&
          dayjs(o.DocDate).toDate() <= ranges.last6Months.end
      ).length,
    };

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    type SalesInvoice = (typeof customer.sales_invoices)[number]

    type GroupedInvoice = SalesInvoice & {
      hasRetur: boolean
    }

    const grouped: Record<number, GroupedInvoice[]> = {};

    customer.sales_invoices.forEach((inv) => {
      if (!grouped[inv.DocNum]) {
        grouped[inv.DocNum] = [];
      }
      grouped[inv.DocNum].push({
        ...inv,
        hasRetur: (inv.returs?.length ?? 0) > 0,
      });
    });

    const docNums = Object.keys(grouped).map(Number);
    docNums.sort((a, b) => b - a);

    const firstDocNum = docNums[0];
    const lastPurchase = grouped[firstDocNum];

    res.status(200).json({
      message: 'Success',
      data: { customer, lastPurchase, ordersByRange, invoiceCountByRange },
    });
  } catch (error) {
    return handleApiError(error, res)
  }
};

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
): Promise<{ groceries: SuggestedProduct[], distributor: SuggestedProduct[] }> => {
  try {

    // 1. Ambil customer + subgroup
    const customer = await prisma.customers.findUnique({
      where: { id },
      include: { subgroup: true },
    });

    if (!customer) {
      return { groceries: [], distributor: [] };
    }

    const subgroupCode = customer.subgroup?.IndCode;

    // 2. Ambil semua customer lain dalam subgroup
    if (subgroupCode) {
      await prisma.customers.findMany({
        where: { subgroup: { IndCode: subgroupCode } },
        select: { id: true },
      });
    }

    // 4. Ambil semua item yg pernah dibeli customer ini
    const customerItems = await prisma.sales_invoices.findMany({
      where: { customer: { id } },
      distinct: ['ItemCode'],
      select: { ItemCode: true },
    });

    const boughtSet = new Set(
      customerItems.map((i) => i.ItemCode).filter((code): code is string => code !== null)
    );

    // 7. Filter item yang telah ditawarkan dalam 30 hari
    const recentVisitItems = await prisma.visit_items.findMany({
      where: {
        offered: true,
        OR: [
          // Exclude done item
          {
            visit_item_concerns: {
              some: {
                status: {
                  requires_action: false
                }
              }
            }
          },
          {
            // KONDISI 2: Status 'Closed' - exclude jika < 30 hari
            created_at: {
              gte: dayjs().subtract(30, 'days').toDate(),
            },
            visit_item_concerns: {
              some: {
                status: { requires_action: false }
              }
            }
          }
        ],
        visit: {
          customer_id: id,
        },
      },
      select: {
        product_id: true,
      },
    });

    const recentProductIds = new Set(recentVisitItems.map((item) => Number(item.product_id)));

    const distributorProducts = await prisma.products.findMany({
      where: { Distributor: 'Y' },
      include: { product_developments: true },
    });

    // Distributor group: ambil semua distributor, exclude jika sudah pernah dibeli
    let distributorItems = distributorProducts
      .map((p) => ({
        ...p,
        isDevelopment: (p.product_developments?.length ?? 0) > 0,
      }))
      .filter((p) => !boughtSet.has(p.ItemCode))
      .sort((a, b) => Number(b.isDevelopment) - Number(a.isDevelopment));

    const pareto = await getParetoProducts(id);


    let paretoProduct = pareto.sort((a, b) => Number(b.isDevelopment) - Number(a.isDevelopment));

    if (!includeRecentOffered) {
      distributorItems = distributorItems.filter((p) => !recentProductIds.has(Number(p.id)));
      paretoProduct = pareto.filter((p) => !recentProductIds.has(Number(p.id)));
    }

    const result = {
      distributor: distributorItems,
      groceries: paretoProduct,
    };

    return result;
  } catch (err) {
    console.error('getSuggestedItems error:', err);
    return { groceries: [], distributor: [] };
  }
};

export const fetchSubgroups = async (req: Request, res: Response) => {
  try {
    const subgroups = await prisma.subgroups.findMany({
      select: {
        IndCode: true,
        IndName: true,
      },
      distinct: ['IndCode'],
    });
    res.status(200).json({ message: 'Subgroups fetched successfully', data: subgroups });
  } catch (error) {
    return handleApiError(error, res)
  }
};

export const fetchGroups = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.customers.findMany({
      select: {
        GroupName: true,
      },
      distinct: ['GroupName'],
    });
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

    const customerId = Number(req.params.id);

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

    return res.json({
      message: 'Customer revenue fetched successfully',
      data: {
        currentRevenue: Number(result.currentRevenue),
        totalRevenue: Number(result.totalRevenue),
      }
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}

export const fetchProductCoverageByCustomer = async (req: Request<{ id: string }>, res: Response) => {
  try {

    const customerId = Number(req.params.id)

    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        CardCode: true,
      }
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    const productAnalytics = await prisma.$queryRaw<ProductAnalytics[]>`
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

    const products = await prisma.products.findMany({
      where: {
        ItemCode: {
          in: productAnalytics.map((pa) => pa.ItemCode),
        },
        validFor: 'Y',
        frozenFor: 'N',
      }
    })

    const productMap = new Map(products.map((p) => [p.ItemCode, p]));

    const items = productAnalytics
      .filter((pa) => productMap.has(pa.ItemCode))
      .map((pa) => ({
        product: productMap.get(pa.ItemCode)!,
        revenue: Number(pa.revenue),
        revenueMtd: Number(pa.revenueMtd),
        qtyKg: Number(pa.qtyKg),
        orderedThisMonth: pa.orderedThisMonth,
        lastPurchaseDate: pa.lastPurchaseDate,
      }))

    const totalItems = items.length
    const orderedItems = items.filter((item) => item.orderedThisMonth).length
    const coverage =
      totalItems === 0
        ? 0
        : (orderedItems / totalItems) * 100

    const lastPurchaseDate = items.reduce<Date | null>(
      (latest, item) => {
        if (!item.lastPurchaseDate) return latest

        if (!latest || item.lastPurchaseDate > latest) {
          return item.lastPurchaseDate
        }

        return latest
      },
      null
    )

    const totalRevenue = items.reduce(
      (sum, item) => sum + Number(item.revenue),
      0
    )

    const keyRevenue = totalRevenue * 0.8


    let cumulativeRevenue = 0
    const itemsWithKeyFlag = items.map((item) => {
      const revenue = Number(item.revenue)

      const isKeyProduct = cumulativeRevenue < keyRevenue

      cumulativeRevenue += revenue

      return {
        ...item,
        isKeyProduct,
      }
    })



    return res.json({
      message: 'Customer product coverage fetched successfully',
      data: {
        summary: {
          totalItems,
          orderedItems,
          coverage,
          lastPurchaseDate
        },
        items: itemsWithKeyFlag,
      }

    })

  } catch (error) {
    return handleApiError(error, res)
  }
}
