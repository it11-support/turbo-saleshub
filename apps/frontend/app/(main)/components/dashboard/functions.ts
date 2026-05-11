import { ICustomerExtended } from '@saleshub-tsm/types'
import { formatDate } from 'date-fns'
import * as XLSX from 'xlsx-js-style'

export const exportToExcel = (data: ICustomerExtended[]) => {
  const header = [
    'Card Code',
    'Customer Name',
    'City',
    'Group',
    'Phone',
    'Sales Name',
    'Avg Revenue',
    'Last Transaction',
    'Total Items',
  ]

  const rows = data.map((item) => [
    item.CardCode,
    item.CardName,
    item.City,
    item.GroupName,
    item.Phone1 || item.Cellular || '-',
    item.SalesName,
    item.avgRevenuePerMonth ? parseFloat(item.avgRevenuePerMonth.toString()) : 0,
    item.lastTransactionDate ? formatDate(new Date(item.lastTransactionDate), 'dd/MM/yyyy') : '-',
    item.totalItems || 0,
  ])

  const worksheetData = [header, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  const headerStyle = {
    fill: { fgColor: { rgb: '4F46E5' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 12 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
    },
  }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1'
    if (!ws[address]) continue
    ws[address].s = headerStyle
  }

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const address = XLSX.utils.encode_cell({ r: R, c: 6 }) // Kolom G (index 6)
    if (!ws[address]) continue

    ws[address].t = 'n'
    ws[address].z = '"Rp." #,##0'

    ws[address].s = {
      alignment: { horizontal: 'right' },
    }
  }
  // 4. Atur Lebar Kolom (Width)
  ws['!cols'] = [
    { wch: 12 }, // CardCode
    { wch: 35 }, // CardName
    { wch: 15 }, // City
    { wch: 15 }, // GroupName
    { wch: 20 }, // Phone
    { wch: 20 }, // SalesName
    { wch: 15 }, // AvgRevenue
    { wch: 18 }, // LastTransaction
    { wch: 12 }, // TotalItems
  ]

  // 5. Buat Workbook dan Simpan
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Non Active Customers`)
  XLSX.writeFile(wb, `Non Active Customers - ${new Date().getTime()}.xlsx`)
}
