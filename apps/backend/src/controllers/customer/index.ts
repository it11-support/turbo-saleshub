import prisma from '@/libs/prisma.js';
import { convertToPrismaOrderBy, sortOptionsParser } from '@/utils/sortOptionsParser.js';
import { ICommonRequestType, ICustomer, PaginationResult } from '@saleshub-tsm/types';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { getParetoProducts } from './functions.js';
import { generateLocalCode } from '@/utils/localCode.js';

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


export const customerList = async (
  req: Request<CustomerRequestType>,
  res: Response<CustomerResponseType>
) => {
  try {
    const { search = '', per_page = 10, page = 1, sort_options = [] } = req.query;

    const sort_options_mapped = () => {
      if (!sort_options) return []

      const parsed =
        typeof sort_options === 'string'
          ? JSON.parse(sort_options)
          : sort_options

      return parsed.map((s: any) => {
        if (s.key === 'rfm.segment' || s.key === 'segment') {
          return {
            ...s,
            key: 'rfm.rfmScore',
          }
        }
        return s
      })
    }


    const { groups, salesPersons, subgroups, slpCode, itemCount, loyaltyLevel, isNewCustomer } = req.query as {
      groups?: string | string[];
      salesPersons?: string | string[];
      subgroups?: string | string[];
      slpCode?: number;
      itemCount?: number;
      loyaltyLevel?: string | string[];
      isNewCustomer?: string | boolean
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
      groupNames,
      salesPersonNames,
      subGroupNames,
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

    const suggestions = await getSuggestedItems(Number(id), undefined, false);

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
  limit: number | undefined = 15,
  includeRecentOffered: boolean = false
): Promise<{ groceries: any[], distributor: any[] }> => {
  try {

    // 1. Ambil customer + subgroup
    const customer = await prisma.customers.findUnique({
      where: { id },
      include: { subgroup: true },
    });

    if (!customer || !customer.subgroup) {
      return { groceries: [], distributor: [] };
    }

    const subgroupCode = customer.subgroup.IndCode;

    // 2. Ambil semua customer lain dalam subgroup
    const subgroupCustomers = await prisma.customers.findMany({
      where: { subgroup: { IndCode: subgroupCode } },
      select: { id: true },
    });

    const subgroupCustomerIds = subgroupCustomers.map((c) => c.id);

    if (subgroupCustomerIds.length === 0) {
      return { groceries: [], distributor: [] };
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
    return res.status(200).json({ message: 'Subgroups fetched successfully', data: subgroups });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
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
    return res.status(200).json({ message: 'Groups fetched successfully', data: groups });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
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
    return res.status(200).json({ message: 'Customer created successfully', data: { newCustomer } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
