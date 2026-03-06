import prisma from '@/libs/prisma.js';
import { convertToPrismaOrderBy, sortOptionsParser } from '@/utils/sortOptionsParser.js';
import { ICommonRequestType, ICustomer, PaginationResult } from '@saleshub-tsm/types';
import dayjs from 'dayjs';
import { Request, Response } from 'express';

export type CustomerRequestType = {
  active?: string[];
  groups?: string[];
  subgroups?: string[];
  slpCode?: number;
} & ICommonRequestType;

export type CustomerResponseType = PaginationResult<ICustomer> & {
  groupNames?: (string | null)[];
  salesPersonNames?: (string | null)[];
  subGroupNames?: (string | null)[];
};

const oneMonthAgo = dayjs().subtract(1, 'month').startOf('day').toDate();

export const customerList = async (
  req: Request<CustomerRequestType>,
  res: Response<CustomerResponseType>
) => {
  try {
    const { search = '', per_page = 10, page = 1, sort_options = [] } = req.query;

    const sort_options_mapped = () => {
      const sortOptions = JSON.parse(sort_options as string);
      return sortOptions.map((s: any) => {
        if (s.key === 'rfm.segment' || s.key === 'segment') {
          return {
            ...s,
            key: 'rfm.rfmScore',
          };
        }

        return s;
      });
    };


    const { groups, salesPersons, subgroups, slpCode, itemCount, loyaltyLevel } = req.query as {
      groups?: string | string[];
      salesPersons?: string | string[];
      subgroups?: string | string[];
      slpCode?: number;
      itemCount?: number;
      loyaltyLevel?: string | string[];
    };
    let selectedGroups: string[] = [];
    let selectedSubgroups: string[] = [];
    let activeOpts: string[] = [];
    let selectedSalesPersons: string[] = [];
    let selectedLevel: string[] = [];

    const query: any = search
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

    if (loyaltyLevel) {
      if (Array.isArray(loyaltyLevel)) {
        selectedLevel = loyaltyLevel;
      } else {
        selectedLevel = [loyaltyLevel];
      }
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

    if (selectedLevel.length > 0) {
      const hasLost = selectedLevel.includes('LOST');

      const segments = selectedLevel.filter((v) => v !== 'LOST');

      if (hasLost) {
        query.OR = [
          { rfm: null },

          {
            rfm: {
              segment:
                segments.length > 0
                  ? { in: ['LOST', ...segments] }
                  : { equals: 'LOST' },
            },
          },
        ];
      }

      else {
        query.rfm = {
          segment:
            selectedLevel.length === 1
              ? { equals: selectedLevel[0] }
              : { in: selectedLevel },
        };
      }
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

    const sortOptions = sortOptionsParser(sort_options_mapped());
    const orderBy = convertToPrismaOrderBy(sortOptions);

    const [customers, meta] = await prisma.customers
      .paginate({
        where: query,
        include: {
          sales_person: true,
          subgroup: true,
          rfm: true
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
      select: {
        SalesName: true,
      },
    });

    const salesPersonNames: (string | null)[] = salesPersonsData.map((sp) => sp.SalesName);
    const groupNames: (string | null)[] = customerGroup.map((g) => g.GroupName);
    const subGroupNames: (string | null)[] = customerSubgroups.map((g) => g.IndName);

    return res.status(200).json({
      message: 'Success',
      data: {
        items: customers.map((c) => ({
          ...c,
          rfm: c.rfm
            ? {
              ...c.rfm,
              monetary: c.rfm.monetary
                ? Number(c.rfm.monetary)
                : null,
            }
            : null,
        })),
        totalRecords: meta.totalCount,
        currentPage: meta.currentPage,
        perPage: Number(per_page),
        totalPages: meta.pageCount,
      },
      groupNames: groupNames,
      salesPersonNames: salesPersonNames,
      subGroupNames: subGroupNames,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
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

    return res.status(200).json({ message: 'Success', data: { customer: customerWithNetSales } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const itemSuggestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const suggestions = await getSuggestedItems(Number(id));

    return res.status(200).json({
      message: 'Success',
      data: { suggestions },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
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
      return res.status(404).json({ message: 'Customer not found' });
    }

    const grouped: Record<number, any[]> = {};

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

    return res.status(200).json({
      message: 'Success',
      data: { customer, lastPurchase, ordersByRange, invoiceCountByRange },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSuggestedItems = async (
  id: number,
  limit: number | undefined = undefined,
  includeRecentOffered: boolean = false
): Promise<any[]> => {
  try {
    // 1. Ambil customer + subgroup
    const customer = await prisma.customers.findUnique({
      where: { id },
      include: { subgroup: true },
    });

    if (!customer || !customer.subgroup) {
      return [];
    }

    const subgroupCode = customer.subgroup.IndCode;

    // 2. Ambil semua customer lain dalam subgroup
    const subgroupCustomers = await prisma.customers.findMany({
      where: { subgroup: { IndCode: subgroupCode } },
      select: { id: true },
    });

    const subgroupCustomerIds = subgroupCustomers.map((c) => c.id);

    if (subgroupCustomerIds.length === 0) {
      return [];
    }

    // 3. Group top-selling items di subgroup
    const topSelling = await prisma.sales_invoices.groupBy({
      by: ['ItemCode', 'Dscription'],
      where: {
        customer: {
          id: { in: subgroupCustomerIds },
        },
      },
      _count: { ItemCode: true },
      orderBy: {
        _count: { ItemCode: 'desc' },
      },
      take: 50,
    });

    // Filter null itemcodes
    const topItemCodes = topSelling
      .map((i) => i.ItemCode)
      .filter((code): code is string => code !== null);

    if (topItemCodes.length === 0) {
      return [];
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

    // 5. Ambil detail produk dari item top-selling
    const products = await prisma.products.findMany({
      where: { ItemCode: { in: topItemCodes } },
      include: {
        product_developments: true,
      },
    });

    // 6. Buat map frekuensi pembelian
    const frequencyMap = new Map(topSelling.map((item) => [item.ItemCode, item._count.ItemCode]));

    // 7. Filter item yang telah ditawarkan dalam 30 hari
    const recentVisitItems = await prisma.visit_items.findMany({
      where: {
        offered: true,
        visit: {
          customer_id: id,
          start_at: {
            gte: oneMonthAgo,
          },
        },
      },
      select: {
        product_id: true,
      },
    });

    const recentProductIds = new Set(recentVisitItems.map((item) => item.product_id));

    // 8. Filter item yg belum pernah dibeli dan tambahkan frequency
    let suggestions = products
      .filter((p) => !boughtSet.has(p.ItemCode))
      .map((p) => ({
        ...p,
        boughtFrequency: frequencyMap.get(p.ItemCode) ?? 0,
      }))
      .sort((a, b) => b.boughtFrequency - a.boughtFrequency);

    if (limit !== undefined) {
      suggestions = suggestions.slice(0, limit);
    }
    if (!includeRecentOffered) {
      suggestions = suggestions.filter((p) => !recentProductIds.has(p.id));
    }

    const productDevelopments = await prisma.products.findMany({
      where: {
        product_developments: {
          some: {
            subgroup: {
              IndCode: subgroupCode,
            },
          },
        },
      },
      include: {
        product_developments: true,
      },
    });

    const devIds = new Set(productDevelopments.map((p) => p.id));
    const filteredDevProducts = includeRecentOffered
      ? productDevelopments
      : productDevelopments.filter((p) => !recentProductIds.has(p.id));

    suggestions = [
      ...filteredDevProducts.map((p) => ({
        ...p,
        boughtFrequency: frequencyMap.get(p.ItemCode) ?? 0,
      })),
      ...suggestions.filter((p) => !devIds.has(p.id)),
    ];

    return suggestions;
  } catch (err) {
    console.error('getSuggestedItems error:', err);
    return [];
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
    return res.status(200).json({ message: 'Subgroups fetched successfully', data: { subgroups } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
