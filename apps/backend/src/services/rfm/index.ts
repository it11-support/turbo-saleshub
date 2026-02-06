import { CustomerSegment } from "@/generated/prisma/enums.js"
import prisma from "@/libs/prisma.js"
import dayjs from "dayjs"

type CustomerScoreMap = {
  lastOrder: Date
  frequencySet: Set<number>
  monetary: number
}

export const scoreByQuintile = (
  value: number,
  sortedValues: number[],
  reverse = false
) => {
  if (!sortedValues.length) return 1

  const pos = sortedValues.indexOf(value)
  const percentile = (pos + 1) / sortedValues.length

  let score = Math.ceil(percentile * 5)

  // Recency: makin kecil makin bagus
  if (reverse) {
    score = 6 - score
  }

  return Math.min(Math.max(score, 1), 5)
}

export const getSegment = (r: number, f: number, m: number): CustomerSegment => {
  if (r >= 4 && f >= 4 && m >= 4) return 'VIP'

  if (r >= 4 && f >= 3) return 'LOYAL'

  if (r >= 3 && f >= 2) return 'POTENTIAL'

  if (r <= 2 && f >= 2) return 'AT_RISK'

  return 'LOST'
}


export const calculateRFM = async () => {

  // === CONFIG ===
  const MONTH_RANGE = 3
  const fromDate = dayjs()
    .subtract(MONTH_RANGE, 'month')
    .startOf('month')
    .toDate()

  // ============================

  const orders = await prisma.orders.findMany({
    where: {
      CardCode: { not: null },
      DocDate: {
        not: null,
        gte: fromDate
      }
    },
    select: {
      CardCode: true,
      DocNum: true,
      DocDate: true,
      Price: true,
      Quantity: true
    }
  })

  if (!orders.length) return


  // ============================
  // GROUPING
  // ============================

  const map = new Map<string, CustomerScoreMap>()

  for (const o of orders) {

    if (!o.CardCode || !o.DocNum || !o.DocDate) continue

    if (!map.has(o.CardCode)) {
      map.set(o.CardCode, {
        lastOrder: o.DocDate,
        frequencySet: new Set(),
        monetary: 0
      })
    }

    const data = map.get(o.CardCode)!

    data.frequencySet.add(o.DocNum)

    const price = Number(o.Price ?? 0)
    const qty = Number(o.Quantity ?? 0)

    data.monetary += price * qty

    if (o.DocDate > data.lastOrder) {
      data.lastOrder = o.DocDate
    }
  }


  // ============================
  // BUILD CUSTOMER DATA
  // ============================

  const today = dayjs()

  const customers = []

  for (const [cardCode, d] of map) {

    const recency = today.diff(dayjs(d.lastOrder), 'day')

    customers.push({
      cardCode,
      recency,
      frequency: d.frequencySet.size,
      monetary: d.monetary
    })
  }


  // ============================
  // SCORING
  // ============================

  const recencies = customers.map(c => c.recency).sort((a, b) => a - b)
  const frequencies = customers.map(c => c.frequency).sort((a, b) => a - b)
  const monetaries = customers.map(c => c.monetary).sort((a, b) => a - b)


  // ============================
  // GET ALL CUSTOMERS (ONCE)
  // ============================

  const dbCustomers = await prisma.customers.findMany({
    where: {
      CardCode: {
        in: customers.map(c => c.cardCode)
      }
    },
    select: {
      id: true,
      CardCode: true
    }
  })

  const customerMap = new Map(
    dbCustomers.map(c => [c.CardCode, c.id])
  )


  // ============================
  // UPSERT RFM
  // ============================

  const now = new Date()

  for (const c of customers) {

    const rScore = scoreByQuintile(c.recency, recencies, true)
    const fScore = scoreByQuintile(c.frequency, frequencies)
    const mScore = scoreByQuintile(c.monetary, monetaries)

    const segment = getSegment(rScore, fScore, mScore)

    const rfmScore = `${rScore}${fScore}${mScore}`

    const customerId = customerMap.get(c.cardCode)

    if (!customerId) continue


    await prisma.customer_rfm.upsert({

      where: {
        customerId
      },

      update: {
        recency: c.recency,
        frequency: c.frequency,
        monetary: c.monetary,

        rScore,
        fScore,
        mScore,

        rfmScore,
        segment,

        lastCalculated: now
      },

      create: {
        customerId,

        recency: c.recency,
        frequency: c.frequency,
        monetary: c.monetary,

        rScore,
        fScore,
        mScore,

        rfmScore,
        segment,

        lastCalculated: now
      }
    })
  }

}
