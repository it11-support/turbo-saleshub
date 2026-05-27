'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from 'primereact/button'
type Props = {
  handleEndVisit?: () => void
}
const NavButton = ({ handleEndVisit }: Props) => {
  const router = useRouter()

  const searchParams = useSearchParams();
  const fromPage = searchParams.get('from');
  const handleBack = () => fromPage ? router.push(`/${fromPage}`) : router.back();

  return (
    <div className="col-12 flex justify-content-start align-items-center gap-2 pl-0">
      <Button
        label="Back"
        icon="pi pi-chevron-left"
        severity="danger"
        size="small"
        outlined
        onClick={handleBack}
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
