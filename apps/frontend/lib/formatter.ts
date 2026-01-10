export const formatCurrency = (
  value: number | string | null | undefined,
  short = false,
  isMoney = false
) => {
  if (!value) return
  const numberValue = typeof value === 'string' ? parseFloat(value) : value
  const absValue = Math.abs(numberValue)

  let formatted

  if (short) {
    return `${isMoney ? 'Rp. ' : ''}` + absValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
  if (absValue >= 1_000_000_000) {
    formatted = (numberValue / 1_000_000_000).toFixed(2) + ' B'
  } else if (absValue >= 1_000_000) {
    formatted = (numberValue / 1_000_000).toFixed(2) + ' M'
  } else if (absValue >= 1_000) {
    formatted = (numberValue / 1_000).toFixed(2) + ' K'
  } else {
    formatted = numberValue.toFixed(2)
  }

  return `${isMoney ? 'Rp. ' : ''}` + formatted.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const formatNumber = (id: number) => {
  return id.toLocaleString('id-ID')
}
