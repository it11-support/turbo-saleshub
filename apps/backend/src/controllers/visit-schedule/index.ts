import { ISalesVisitRule, UpdateVisitScheduleDto } from '@saleshub-tsm/types';
import { differenceInCalendarWeeks, endOfMonth, startOfMonth, startOfWeek } from 'date-fns';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { dayOfWeeks, offeredStatus, VisitStatus } from '@/generated/prisma/client.js';
import prisma from '@/libs/prisma.js';
import { getSuggestedItems } from '../customer/index.js';

type TodayVisit = {
  id: bigint;
  customer_id: bigint;
  status: VisitStatus;
  start_at: Date;
  end_at: Date | null;
};

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
      return res.status(400).json({ message: 'salesPersonId is required' });
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
    return res.json({
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      data: schedulesWithSuggestions,
    });
  } catch (error) {
    console.error('❌ Error fetching schedules:', error);
    return res.status(500).json({ message: 'Server error', error });
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

    return res.status(200).json({ message: 'Schedules generated', data: response });
  } catch (error) {
    console.error('Error generating schedules:', error);
    return res.status(500).json({ message: 'Server error', error });
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
      return res.status(400).json({ message: 'salesPersonId and date are required' });
    }

    // Gunakan dayjs untuk semua logika tanggal
    const date = dayjs(dateStr);
    const today = dayjs();
    const limit = dayjs().subtract(1, 'day');

    // Skip Sunday
    if (date.day() === 0) {
      return res.status(200).json({
        message: 'Sunday has no schedule',
        data: { data: [], total: 0 },
      });
    }

    const weekOfMonth = getWeekOfMonth(date.toDate());
    const dayOfWeek = getDayOfWeekEnum(date.toDate());

    // Helper untuk format YYYY-MM-DD, aman dari timezone
    const toDateKey = (d: dayjs.Dayjs | string | Date) => dayjs(d).format('YYYY-MM-DD');

    const targetDateKey = toDateKey(date);
    const todayKey = toDateKey(today);

    // Ambil rules aktif sesuai sales person, hari, dan cycle
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

    const cycleSlot = getCycleSlot(date.toDate());

    const matchedRules = rules.filter(
      (r) => Array.isArray(r.visit_weeks) && r.visit_weeks.includes(cycleSlot)
    );

    const monthStart = startOfMonth(date.toDate());
    const monthEnd = endOfMonth(date.toDate());

    // Ambil semua visits bulan ini
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

    const manualSchedules = await prisma.visits.findMany({
      where: {
        sales_person_id: salesPersonId,
        visit_date: targetDateKey
      },
      include: {
        customer: { include: { subgroup: true } }
      }
    })

    // Group visits berdasarkan tanggal target
    const visitsOnTargetDate = visitsInMonth.filter(
      (v) => v.start_at && toDateKey(v.start_at) === targetDateKey
    )

    const visitMap = new Map<number, typeof visitsOnTargetDate>();
    for (const v of visitsOnTargetDate) {
      if (!visitMap.has(Number(v.customer_id))) visitMap.set(Number(v.customer_id), []);
      visitMap.get(Number(v.customer_id))!.push(v);
    }

    // Mapping rules ke data output
    const data = matchedRules.map((rule) => {
      const todayVisits = visitMap.get(Number(rule.customer_id)) || [];

      let status = 'Planned';
      let visit: (typeof todayVisits)[0] | null = null;

      if (todayVisits.length > 0) {
        // Ambil visit terakhir
        const lastVisit = todayVisits.sort(
          (a, b) => new Date(b.start_at!).getTime() - new Date(a.start_at!).getTime()
        )[0];
        visit = lastVisit;

        // 🔥 override status kalau tanggal sudah lewat dan masih Planned
        if (dayjs(lastVisit.start_at).isBefore(dayjs(), 'day') && lastVisit.status === 'Planned') {
          status = 'Missed';
        } else {
          status = lastVisit.status;
        }
      } else {
        // Tidak ada visit, cek kalau tanggal sudah lewat
        if (dayjs(targetDateKey).isBefore(dayjs(), 'day')) {
          status = 'Missed';
        }
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

    const ruleVisitIds = new Set(data.map((d) => d.id).filter((id) => id !== null));
    const filteredManualSchedules = manualSchedules.filter(
      (schedule) => !ruleVisitIds.has(schedule.id)
    );

    const dataManual = filteredManualSchedules.map((schedule) => {
      return {
        rule: {
          customer: schedule.customer
        },
        id: schedule?.id ?? null,
        sales_person_id: schedule.sales_person_id,
        customer_id: schedule.customer_id,
        visit_date: schedule.visit_date,
        max_items_per_visit: 15,
        status: schedule.status,
        is_virtual: !schedule,
        visit: {
          id: schedule.id,
          customer_id: schedule.customer_id,
          start_at: schedule.start_at,
          end_at: schedule.end_at,
          status: schedule.status,
        },
      }
    })

    // Auto update status Missed untuk visits yang Ongoing dan sudah lewat
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
        AND: [
          { start_at: null },
          { status: VisitStatus.Planned },
          { visit_date: { lt: dayjs().startOf('day').format('YYYY-MM-DD') } }
        ]
      },
      data: { status: VisitStatus.Missed }
    })

    const existingCustomerIds = new Set(dataManual.map(item => item.customer_id));

    const filteredData = data.filter(data => {
      return !existingCustomerIds.has(data.customer_id);
    });

    const allVisits = await prisma.visits.findMany({
      where: {
        customer_id: {
          in: [dataManual.map(item => item.customer_id), filteredData.map(item => item.customer_id)].flat()
        },
        visit_items: {
          some: {
            visit_item_concerns: {
              some: {
                status: {
                  status: {
                    notIn: ['Done', 'Closed']
                  }
                }
              }
            }
          }
        }
      },
      include: {
        visit_items: {
          include: {
            visit_item_concerns: {
              include: {
                category: true,
                status: true,
                follow_ups: {
                  orderBy: {
                    created_at: 'asc'
                  }
                }
              }
            }
          }
        }
      }
    })


    const finalData = [...dataManual, ...filteredData]

    const allVisitMaps = new Map()

    allVisits.forEach(visit => {
      const customerId = visit.customer_id

      if (!allVisitMaps.has(customerId)) {
        allVisitMaps.set(customerId, [])
      }

      const openItems = visit.visit_items.map(item => ({
        ...item,
        visit_date: visit.visit_date,
        visit_item_concerns: item.visit_item_concerns.filter(c =>
          !['Done', 'Closed'].includes(c.status?.status ?? '')
        )
      }))

      allVisitMaps.get(customerId).push(...openItems)
    })

    const mergeData = finalData.map(item => {
      const visitItems = allVisitMaps.get(item.customer_id) || []

      console.log(visitItems)

      return {
        ...item,
        open_issues: visitItems
      }
    })

    return res.status(200).json({
      message: 'Success',
      data: { data: mergeData, total: data.length, weekOfMonth },
    });
  } catch (error) {
    console.error('Error generating schedules:', error);
    return res.status(500).json({ message: 'Server error', error });
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
export const createVisitSchedule = async (req: Request, res: Response) => {
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
    });
    return res.status(200).json({ message: 'Success', data: visit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
