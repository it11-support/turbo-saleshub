import { AuthenticatedRequest, ISalesVisitRule, TVisitStatus, UpdateVisitScheduleDto } from '@saleshub-tsm/types';
import { differenceInCalendarWeeks, endOfMonth, startOfMonth, startOfWeek } from 'date-fns';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { dayOfWeeks, offeredStatus, VisitStatus } from '@/generated/prisma/client.js';
import prisma from '@/libs/prisma.js';
import { getSuggestedItems } from '../customer/index.js';
import { activityLogger } from '@/services/logs/index.js';

export const getScheduleBySalsePerson = async (req: Request, res: Response) => {
  try {
    const salesPersonId = Number(req.query.salesPersonId);
    let month = Number(req.query.month);

    if (!month || isNaN(month)) {
      month = new Date().getMonth() + 1;
    }

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const date = new Date().getDate();
    if (!salesPersonId) {
      res.status(400).json({ message: 'salesPersonId is required' });
      return;
    }

    const page = req.query.page ? Number(req.query.page) : 1;
    const perPage = req.query.perPage ? Number(req.query.perPage) : 10;
    const skip = (page - 1) * perPage;

    const where: any = {
      sales_person_id: salesPersonId,
      visit_date: {
        gte: new Date(year, month - 1, date),
      },
    };

    const schedules = await prisma.sales_visit_schedules.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: {
        visit_date: 'asc',
      },
      skip,
      take: perPage,
    });

    const total = await prisma.sales_visit_schedules.count({ where });
    const schedulesWithSuggestions = await Promise.all(
      schedules.map(async (s) => {
        const suggestedItems = await getSuggestedItems(Number(s.customer.id), 15);
        return {
          ...s,
          suggestedItems,
        };
      })
    );
    res.json({
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      data: schedulesWithSuggestions,
    });
  } catch (error) {
    console.error('❌ Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const generateScheduleByRules = async (req: Request, res: Response) => {
  try {
    const { sales_person_id, year, month } = req.body;

    // 1. Ambil semua rules aktif untuk sales person
    const rules = await prisma.sales_visit_rules.findMany({
      where: { sales_person_id, active: true },
    });

    const insertedSchedules: any[] = [];

    // 2. Loop setiap rule
    for (const rule of rules) {
      // Ambil suggested items untuk customer
      const suggestedItems = await getSuggestedItems(Number(rule.customer_id));
      const mergedSuggestedItems = [
        ...suggestedItems.distributor,
        ...suggestedItems.groceries,
      ];

      // Generate tanggal visit
      const visitWeeks = Array.isArray(rule.visit_weeks)
        ? rule.visit_weeks
        : JSON.parse(rule.visit_weeks as any);

      const dates = generateVisitDatesFromRule({ ...rule, visit_weeks: visitWeeks }, year, month);

      // Batasi MAX items per visit
      const MAX_ITEMS = rule.max_items_per_visit as number;

      // Loop tanggal dan assign items
      for (let idx = 0; idx < dates.length; idx++) {
        const visit_date = dates[idx];
        const start = idx * MAX_ITEMS;
        const end = start + MAX_ITEMS;
        const itemsForThisVisit = mergedSuggestedItems
          .slice(start, end)
          .map((item) => item.ItemCode); // biarkan string/BigInt

        // 3a. Buat schedule
        try {
          const scheduleCreated = await prisma.sales_visit_schedules.create({
            data: {
              rule_id: rule.id,
              sales_person_id,
              customer_id: rule.customer_id,
              visit_date,
              status: 'planned',
            },
          });

          // 3b. Buat schedule items
          if (itemsForThisVisit.length > 0) {
            const scheduleItemsData = itemsForThisVisit.map((code) => ({
              schedule_id: scheduleCreated.id,
              ItemCode: code.toString(), // pastikan string
              offered: 'N' as offeredStatus, // default offered status sesuai enum
            }));

            await prisma.sales_visit_schedule_items.createMany({
              data: scheduleItemsData,
              skipDuplicates: true, // aman jika ada duplikat
            });
          }
          insertedSchedules.push(scheduleCreated);
        } catch (err: any) {
          if (err.code === 'P2002') {
            continue;
          }
          console.error('Insert error:', err);
        }
      }
    }

    const response = {
      success: true,
      rules_count: rules.length,
      schedules_generated: insertedSchedules.length,
    };

    res.status(200).json({ message: 'Schedules generated', data: response });
  } catch (error) {
    console.error('Error generating schedules:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateSchedule = async (id: number, data: UpdateVisitScheduleDto) => {
  try {
    return prisma.sales_visit_schedules.update({
      where: { id },
      data: {
        status: data.status,
        visit_date: data.visit_date ? new Date(data.visit_date) : undefined,
      },
    });
  } catch (error) {
    console.log('Error updating visit schedule:', error);
    throw error;
  }
};

export const deleteSchedule = async (id: number) => {
  try {
    return prisma.sales_visit_schedules.delete({
      where: { id },
    });
  } catch (error) {
    console.log('Error deleting visit schedule:', error);
    throw error;
  }
};

const generateVisitDatesFromRule = (rule: ISalesVisitRule, year: number, month: number) => {
  const visitWeeks = Array.isArray(rule.visit_weeks)
    ? rule.visit_weeks
    : JSON.parse(rule.visit_weeks as any);

  const targetDay = weekdayMap[rule.day_of_week];

  const result: Date[] = [];
  const date = new Date(year, month - 1, 1);

  let weekNumber = 0;

  while (date.getMonth() === month - 1) {
    const mondayBasedDay = (date.getDay() + 6) % 7;

    if (mondayBasedDay === targetDay) {
      weekNumber++;

      if (visitWeeks.includes(weekNumber)) {
        result.push(new Date(date));
      }
    }

    date.setDate(date.getDate() + 1);
  }

  return result;
};

const weekdayMap: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
};

const ANCHOR_MONDAY = startOfWeek(new Date('2025-01-01'), { weekStartsOn: 1 });

export const getScheduleByDate = async (req: Request, res: Response) => {
  try {
    const salesPersonId = Number(req.query.salesPersonId);
    const dateStr = req.query.date as string;

    if (!salesPersonId || !dateStr) {
      res.status(400).json({ message: 'salesPersonId and date are required' });
    }

    const date = dayjs(dateStr);
    const targetDateKey = date.format('YYYY-MM-DD');
    const limit = dayjs().subtract(1, 'day');

    if (date.day() === 0) {
      res.status(200).json({
        message: 'Sunday has no schedule',
        data: { data: [], total: 0 },
      });
    }

    const weekOfMonth = getWeekOfMonth(date.toDate());
    const dayOfWeek = getDayOfWeekEnum(date.toDate());
    const cycleSlot = getCycleSlot(date.toDate());

    // ================= RULES =================
    const rules = await prisma.sales_visit_rules.findMany({
      where: {
        sales_person_id: salesPersonId,
        day_of_week: dayOfWeek,
        active: true,
      },
      include: {
        customer: { include: { subgroup: true } },
        salesPerson: true,
      },
      orderBy: { customer_id: 'asc' },
    });

    const matchedRules = rules.filter(
      (r) => Array.isArray(r.visit_weeks) && r.visit_weeks.includes(cycleSlot)
    );

    // ================= VISITS =================
    const monthStart = startOfMonth(date.toDate());
    const monthEnd = endOfMonth(date.toDate());

    const visitsInMonth = await prisma.visits.findMany({
      where: {
        sales_person_id: salesPersonId,
        customer_id: { in: matchedRules.map((r) => r.customer_id) },
        start_at: { gte: monthStart, lte: monthEnd },
      },
      select: {
        id: true,
        customer_id: true,
        start_at: true,
        end_at: true,
        status: true,
      },
    });

    const visitMap = new Map<number, typeof visitsInMonth>();

    visitsInMonth.forEach(v => {
      if (!v.start_at) return;
      if (dayjs(v.start_at).format('YYYY-MM-DD') !== targetDateKey) return;

      if (!visitMap.has(Number(v.customer_id))) {
        visitMap.set(Number(v.customer_id), []);
      }
      visitMap.get(Number(v.customer_id))!.push(v);
    });

    const ruleData = matchedRules.map(rule => {
      const visits = visitMap.get(Number(rule.customer_id)) || [];

      let visit = null;
      let status: TVisitStatus = VisitStatus.Planned;

      if (visits.length > 0) {
        const last = visits.sort((a, b) =>
          new Date(b.start_at!).getTime() - new Date(a.start_at!).getTime()
        )[0];

        visit = last;

        if (
          dayjs(last.start_at).isBefore(dayjs(), 'day') &&
          last.status === VisitStatus.Planned
        ) {
          status = VisitStatus.Missed;
        } else {
          status = last.status;
        }
      } else if (date.isBefore(dayjs(), 'day')) {
        status = VisitStatus.Missed;
      }

      return {
        rule,
        id: visit?.id ?? null,
        sales_person_id: rule.sales_person_id,
        customer_id: rule.customer_id,
        visit_date: targetDateKey,
        max_items_per_visit: rule.max_items_per_visit,
        status,
        is_virtual: !visit,
        visit,
      };
    });

    // ================= MANUAL =================
    const manualSchedules = await prisma.visits.findMany({
      where: {
        sales_person_id: salesPersonId,
        visit_date: targetDateKey,
      },
      include: {
        customer: { include: { subgroup: true } },
      },
    });

    const ruleVisitIds = new Set(ruleData.map(d => d.id).filter(Boolean));

    const dataManual = manualSchedules
      .filter(s => !ruleVisitIds.has(s.id))
      .map(schedule => ({
        rule: { customer: schedule.customer },
        id: schedule.id,
        sales_person_id: schedule.sales_person_id,
        customer_id: schedule.customer_id,
        visit_date: schedule.visit_date,
        max_items_per_visit: 15,
        status: schedule.status,
        is_virtual: false,
        visit: schedule,
      }));

    // ================= STATUS UPDATE =================
    await prisma.visits.updateMany({
      where: {
        sales_person_id: salesPersonId,
        start_at: { lt: limit.toDate() },
        status: VisitStatus.Ongoing,
      },
      data: { status: VisitStatus.Missed },
    });

    await prisma.visits.updateMany({
      where: {
        sales_person_id: salesPersonId,
        start_at: null,
        status: VisitStatus.Planned,
        visit_date: { lt: dayjs().format('YYYY-MM-DD') },
      },
      data: { status: VisitStatus.Missed },
    });

    // ================= FILTER RULE DUPLICATE =================
    const getKey = (item: any) =>
      `${item.customer_id}-${item.visit_date}`;
    const manualKeys = new Set(dataManual.map(getKey));
    // ================= FOLLOW UP =================
    const start = dayjs(dateStr).startOf('day').toDate();
    const end = dayjs(dateStr).add(1, 'day').startOf('day').toDate();

    const followUps = await prisma.follow_ups.findMany({
      where: {
        next_follow_up_date: { gte: start, lt: end },
        visit_item_concerns: {
          visit_items: {
            visit: {
              sales_person_id: salesPersonId,
            },
          },
          status: {
            status: { notIn: ['Done', 'Closed'] },
          },
        },
      },
      include: {
        visit_item_concerns: {
          include: {
            visit_items: {
              include: {
                visit: {
                  include: {
                    customer: { include: { subgroup: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const followUpSchedules = followUps.map(fu => {
      const visit = fu.visit_item_concerns.visit_items.visit;

      return {
        rule: { customer: visit.customer },
        id: visit.id,
        sales_person_id: visit.sales_person_id,
        customer_id: visit.customer_id,
        visit_date: targetDateKey,
        max_items_per_visit: 15,
        status: VisitStatus.Planned,
        is_virtual: true,
        visit,
        is_followup: true,
        next_follow_up_date: fu.next_follow_up_date
      };
    });

    const rawFollowUps = followUpSchedules.filter(f => !manualKeys.has(getKey(f)))

    const followUpMap = new Map<number, any>();

    rawFollowUps.forEach(f => {
      if (!followUpMap.has(Number(f.customer_id))) {
        followUpMap.set(Number(f.customer_id), f);
      }
    });

    const filteredFollowUps = Array.from(followUpMap.values());
    const afterFollowUpKeys = new Set([
      ...dataManual.map(getKey),
      ...filteredFollowUps.map(getKey),
    ]);

    const filteredData = ruleData.filter(
      r => !afterFollowUpKeys.has(getKey(r))
    );
    // ================= FINAL =================
    const finalData = [...filteredFollowUps, ...dataManual, ...filteredData];

    // 🔥 FIX: include ALL customers (termasuk follow-up)
    const allCustomerIds = Array.from(new Set(finalData.map(d => d.customer_id)));

    const allVisits = await prisma.visits.findMany({
      where: {
        customer_id: { in: allCustomerIds },
        visit_items: {
          some: {
            visit_item_concerns: {
              some: {
                status: {
                  status: { notIn: ['Done', 'Closed'] },
                },
              },
            },
          },
        },
      },
      include: {
        visit_items: {
          include: {
            visit_item_concerns: {
              include: {
                category: true,
                status: true,
                follow_ups: {
                  orderBy: { created_at: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const allVisitMaps = new Map<number, any[]>();

    allVisits.forEach(visit => {
      const openItems = visit.visit_items.map(item => ({
        ...item,
        visit_date: visit.visit_date,
        visit_item_concerns: item.visit_item_concerns.filter(c =>
          !['Done', 'Closed'].includes(c.status?.status ?? '')
        ),
      }));

      if (!allVisitMaps.has(Number(visit.customer_id))) {
        allVisitMaps.set(Number(visit.customer_id), []);
      }

      allVisitMaps.get(Number(visit.customer_id))!.push(...openItems);
    });

    const mergeData = finalData.map(item => ({
      ...item,
      open_issues: allVisitMaps.get(Number(item.customer_id)) || [],
    }));

    res.status(200).json({
      message: 'Success',
      data: { data: mergeData, total: mergeData.length, weekOfMonth },
    });

  } catch (error) {
    console.error('Error generating schedules:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getCycleSlot = (date: Date) => {
  const targetMonday = startOfWeek(date, { weekStartsOn: 1 });
  const diff = differenceInCalendarWeeks(targetMonday, ANCHOR_MONDAY);

  return (((diff % 4) + 4) % 4) + 1;
};

export const getWeekOfMonth = (date: Date) => {
  const start = startOfMonth(date);

  // Ubah ke ISO weekday: Mon=1 ... Sun=7
  const startDay = start.getDay() === 0 ? 7 : start.getDay();

  return Math.ceil((date.getDate() + startDay - 1) / 7);
};

export const getDayOfWeekEnum = (date: Date): dayOfWeeks => {
  const map = {
    1: dayOfWeeks.Monday,
    2: dayOfWeeks.Tuesday,
    3: dayOfWeeks.Wednesday,
    4: dayOfWeeks.Thursday,
    5: dayOfWeeks.Friday,
    6: dayOfWeeks.Saturday,
  } as const;

  return map[date.getDay() as keyof typeof map];
};
export const createVisitSchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customer_id, sales_person_id, visit_date } = req.body
    const date = dayjs(visit_date).format("YYYY-MM-DD")

    const visit = await prisma.visits.upsert({
      where: {
        customer_id_visit_date: {
          customer_id: Number(customer_id),
          visit_date: date,
        },
      },
      update: {},
      create: {
        sales_person_id: Number(sales_person_id),
        customer_id: Number(customer_id),
        visit_date: date,
        status: VisitStatus.Planned,
      },
      include: {
        customer: true
      }
    });

    activityLogger({
      req,
      actionType: 'Visit Schedule',
      description: `Visit schedule created: ${visit.visit_date} for customer ${visit.customer.CardName}`,
      status: 'SUCCESS',
    })
    res.status(200).json({ message: 'Success', data: visit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
