type ParsedPhone = {
  number: string
  isMobile: boolean
}

export const parsePhone = (phone: string | null | undefined): ParsedPhone[] => {
  if (!phone) return []

  // Hapus semua huruf
  const cleaned = phone.replace(/[^0-9/]/g, '').trim()

  // Jika setelah dibersihkan tidak ada digit, kembalikan kosong
  if (!/\d/.test(cleaned)) return []

  // Tentukan apakah mobile (dimulai dengan 08)
  const digitsOnly = cleaned.replace(/[^\d]/g, '')
  const isMobile = /^08\d+/.test(digitsOnly)

  if (!isMobile) {
    // Non-mobile, tampilkan apa adanya
    return [{ number: cleaned, isMobile: false }]
  }

  // Mobile, parsing jika ada "/"
  const parts = cleaned.split('/').filter(Boolean)
  const results: ParsedPhone[] = []

  results.push({ number: parts[0], isMobile: true })

  for (let i = 1; i < parts.length; i++) {
    let extra = parts[i]

    if (extra.length < parts[0].length) {
      const prefix = parts[0].slice(0, parts[0].length - extra.length)
      extra = prefix + extra
    }

    results.push({ number: extra, isMobile: true })
  }

  return results
}

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return ''
  const cleaned = phone.replace(/[^0-9/]/g, '').trim()

  if (!/\d/.test(cleaned)) return ''

  return cleaned
}
