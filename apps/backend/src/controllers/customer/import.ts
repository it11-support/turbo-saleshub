import { Request, Response } from 'express'
import fileUpload from 'express-fileupload'
import { parse } from 'csv-parse/sync'
import crypto from 'crypto'

import { handleApiError } from '@/utils/apiResponse.js'
import prisma from '@/libs/prisma.js'

interface PotentialCustomerCsvRow {
  Nama?: string
  Alamat?: string
  Segment?: string
  Kota?: string
}

export const importPotentialCustomers = async (
  req: Request,
  res: Response
) => {
  try {
    const { salesPersonId } = req.body

    console.log(salesPersonId)
    // =========================
    // Validate Sales Person
    // =========================

    if (!salesPersonId) {
      return res.status(400).json({
        message: 'Sales Person is required',
      })
    }

    let parsedSalesPersonId: bigint

    try {
      parsedSalesPersonId = BigInt(salesPersonId)
    } catch {
      return res.status(400).json({
        message: 'Invalid Sales Person ID',
      })
    }

    const salesPerson = await prisma.sales_persons.findUnique({
      where: {
        id: parsedSalesPersonId,
      },
      select: {
        id: true,
        SlpCode: true,
        SlpName: true,
      },
    })

    if (!salesPerson) {
      return res.status(404).json({
        message: 'Sales Person not found',
      })
    }

    // =========================
    // Validate uploaded file
    // =========================

    if (!req.files?.file) {
      return res.status(400).json({
        message: 'CSV file is required',
      })
    }

    const uploaded = req.files.file

    // Karena frontend hanya mengirim 1 file
    if (Array.isArray(uploaded)) {
      return res.status(400).json({
        message: 'Only one CSV file is allowed',
      })
    }

    const file = uploaded as fileUpload.UploadedFile

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        message: 'Only CSV files are allowed',
      })
    }

    // =========================
    // Parse CSV
    // =========================

    const rows = parse(file.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as PotentialCustomerCsvRow[]

    if (rows.length === 0) {
      return res.status(400).json({
        message: 'CSV file is empty',
      })
    }

    // =========================
    // Import rows
    // =========================

    let imported = 0
    const errors: string[] = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]

      // +2 karena index mulai 0 dan row pertama CSV adalah header
      const rowNumber = index + 2

      try {
        const name = row.Nama?.trim()
        const address = row.Alamat?.trim() || null
        const groupName = row.Segment?.trim() || null
        const city = row.Kota?.trim() || null

        if (!name) {
          errors.push(
            `Row ${rowNumber}: Nama is required`
          )
          continue
        }

        await prisma.$transaction(async (tx) => {
          // Generate unique local customer code
          const localCode =
            `LOCAL-${crypto.randomUUID()
              .replace(/-/g, '')
              .slice(0, 9)
              .toUpperCase()}`

          // Customer belum ada di SAP
          const customer = await tx.customers.create({
            data: {
              LocalCode: localCode,
              isLocal: true,

              CardName: name,
              Address: address,
              GroupName: groupName,
              City: city,
            },
          })

          // Assign potential customer ke Sales Person
          await tx.user_potential_customers.create({
            data: {
              customer_id: customer.id,
              sales_person_id: salesPerson.id,
            },
          })
        })

        imported++
      } catch (error) {
        console.error(
          `Failed importing row ${rowNumber}`,
          error
        )

        errors.push(
          `Row ${rowNumber}: ${error instanceof Error
            ? error.message
            : 'Import failed'
          }`
        )
      }
    }

    return res.status(200).json({
      message:
        errors.length === 0
          ? 'Potential customers imported successfully'
          : 'Import completed with some errors',

      status:
        errors.length === 0
          ? 'SUCCESS'
          : 'FAILED',

      imported,
      errors,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}
