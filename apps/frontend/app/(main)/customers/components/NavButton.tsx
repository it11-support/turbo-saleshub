'use client'

import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
type Props = {
  handleEndVisit?: () => void
}
const NavButton = ({ handleEndVisit }: Props) => {
  const router = useRouter()
  return (
    <div className="col-12 flex justify-content-start align-items-center gap-2">
      <Button
        label="Back"
        icon="pi pi-chevron-left"
        severity="danger"
        size="small"
        outlined
        onClick={() => router.back()}
      />
      {typeof handleEndVisit === 'function' && (
        <Button
          label="End Visit"
          icon="pi pi-check-circle"
          severity="success"
          size="small"
          outlined
          onClick={handleEndVisit}
        />
      )}
    </div>
  )
}

export default NavButton
