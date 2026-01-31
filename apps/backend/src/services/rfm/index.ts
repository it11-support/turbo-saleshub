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
  // All customer orders
  const fromDate = dayjs().subtract(12, 'month').toDate()

  const orders = await prisma.orders.findMany({
    where: {
      CardCode: {
        not: null
      },
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

  const map = new Map<string, CustomerScoreMap>()

  for (const o of orders) {

    if (!o.CardCode || !o.DocNum || !o.DocDate) continue

    const key = o.CardCode

    if (!map.has(key)) {
      map.set(key, {
        lastOrder: o.DocDate,
        frequencySet: new Set(),
        monetary: 0
      })
    }

    const data = map.get(key)!

    // frequency = unique DocNum
    data.frequencySet.add(o.DocNum)

    // monetary = price * qty
    const price = Number(o.Price ?? 0)
    const qty = Number(o.Quantity ?? 0)

    data.monetary += price * qty

    // last order
    if (o.DocDate > data.lastOrder) {
      data.lastOrder = o.DocDate
    }
  }

  const today = dayjs()

  const customers: {
    cardCode: string
    recency: number
    frequency: number
    monetary: number
  }[] = []

  for (const [cardCode, d] of map) {

    const recency = today.diff(dayjs(d.lastOrder), 'day')

    customers.push({
      cardCode,
      recency,
      frequency: d.frequencySet.size,
      monetary: d.monetary
    })
  }

  const recencies = customers.map(c => c.recency).sort((a, b) => a - b)
  const frequencies = customers.map(c => c.frequency).sort((a, b) => a - b)
  const monetaries = customers.map(c => c.monetary).sort((a, b) => a - b)


  for (const c of customers) {
    const rScore = scoreByQuintile(c.recency, recencies, true)
    const fScore = scoreByQuintile(c.frequency, frequencies)
    const mScore = scoreByQuintile(c.monetary, monetaries)

    const segment = getSegment(rScore, fScore, mScore)

    const rfmScore = `${rScore}${fScore}${mScore}`

    const customer = await prisma.customers.findUnique({
      where: {
        CardCode: c.cardCode
      },
      select: {
        id: true
      }
    })
    if (!customer) continue


    await prisma.customer_rfm.upsert({
      where: {
        customerId: customer.id
      },
      update: {
        recency: c.recency,
        frequency: c.frequency,
        monetary: c.monetary,

        rScore,
        fScore,
        mScore,

        rfmScore,
        segment
      },
      create: {
        customerId: customer.id,

        recency: c.recency,
        frequency: c.frequency,
        monetary: c.monetary,

        rScore,
        fScore,
        mScore,

        rfmScore,
        segment
      }
    })
  }

}
