import prisma from "@/libs/prisma.js"

export const generateLocalCode = async () => {
  const prefix = 'CUST-'

  const lastCode = await prisma.customers.findFirst({
    where: {
      LocalCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      LocalCode: 'desc',
    },
    select: {
      LocalCode: true,
    },
  })

  let lastNumber = 0

  if (lastCode?.LocalCode) {
    const parsed = parseInt(lastCode.LocalCode.replace(prefix, ''))
    lastNumber = isNaN(parsed) ? 0 : parsed
  }

  const newNumber = lastNumber + 1

  return `${prefix}${newNumber.toString().padStart(5, '0')}`
}
