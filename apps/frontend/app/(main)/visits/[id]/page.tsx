'use client'

import OfferedProduct from '../../components/product/OfferedProduct'
import ProductOfferCard from '../../components/product/ProductOfferCard'
import { CustomerInfo } from '../../customers/components/CustomerInfo'
import NavButton from '../../customers/components/NavButton'
import AvgRevenueAndTarget from '../components/AvgRevenueAndTarget'
import CameraCaptureDialog from '../components/CameraCaptureDialog'
import Competitors from '../components/Competitors'
import ConfirmLocationDialog from '../components/ConfirmLocationDialog'
import ProductCoverage from '../components/ProductCoverage'
import { getFilteredProducts } from '../functions/filterProducts'
import { groupVisitItems } from '../functions/groupVisitItems'
import {
  IConcernCategory,
  IConcernStatus,
  IDashboardData,
  IInquiry,
  IResObject,
  IVisitItem,
  ProductWithFrequency,
} from '@saleshub-tsm/types'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AutoComplete } from 'primereact/autocomplete'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Checkbox } from 'primereact/checkbox'
import { Dialog } from 'primereact/dialog'
import { Divider } from 'primereact/divider'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { OverlayPanel } from 'primereact/overlaypanel'
import { Panel } from 'primereact/panel'
import { ProgressSpinner } from 'primereact/progressspinner'
import { memo, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/layout/context/AuthContext'
import { calculateDistance, getCurrentLocation } from '@/lib/geolocation'
import { useSalesVisit, useScheduleStore } from '@/stores'
import { useInquiryStore } from '@/stores/inquiry'
import { useProductsStore } from '@/stores/products'

const DISTANCE_THRESHOLD = 1000

interface IConcernCategoryResponse {
  concernCategories: IConcernCategory[]
}
interface IConcernStatusResponse {
  concernStatuses: IConcernStatus[]
}

interface ConcernCategoryRowProps {
  category: IConcernCategory
  selection: { notes: string; statusId: number | null } | undefined
  statusOptions: { label: string; value: number | null }[]
  onToggle: (id: number, checked: boolean) => void
  onNotesBlur: (id: number, notes: string) => void
  onStatusChange: (id: number, statusId: number | null) => void
  inputPrefix: string
}

const ConcernCategoryRow = memo(function ConcernCategoryRow({
  category,
  selection,
  statusOptions,
  onToggle,
  onNotesBlur,
  onStatusChange,
  inputPrefix,
}: ConcernCategoryRowProps) {
  const [notes, setNotes] = useState(selection?.notes ?? '')
  const [statusId, setStatusId] = useState<number | null>(selection?.statusId ?? null)

  useEffect(() => {
    if (selection) {
      setNotes(selection.notes)
      setStatusId(selection.statusId)
    }
  }, [selection?.notes, selection?.statusId])

  const id = Number(category.id)

  return (
    <div className="border-bottom-1 surface-border pb-3">
      <div className="flex align-items-center gap-2">
        <Checkbox
          inputId={`${inputPrefix}-concern-${category.id}`}
          checked={Boolean(selection)}
          onChange={(e) => onToggle(id, !!e.checked)}
        />
        <label htmlFor={`${inputPrefix}-concern-${category.id}`} className="font-semibold">
          {category.name}
        </label>
      </div>

      {selection && (
        <div className="flex flex-column gap-2 mt-2">
          <div className="flex flex-column gap-2">
            <label
              htmlFor={`${inputPrefix}-concern-notes-${category.id}`}
              className="text-primary-400 font-semibold"
            >
              Notes
            </label>
            <InputTextarea
              id={`${inputPrefix}-concern-notes-${category.id}`}
              rows={2}
              autoResize
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onNotesBlur(id, notes)}
              placeholder="Notes"
              className="w-full"
            />
          </div>

          <div className="flex flex-column gap-2">
            <label
              htmlFor={`${inputPrefix}-concern-status-${category.id}`}
              className="text-primary-400 font-semibold"
            >
              Status
            </label>
            <Dropdown
              inputId={`${inputPrefix}-concern-status-${category.id}`}
              value={statusId}
              options={statusOptions}
              onChange={(e) => {
                const newStatusId = e.value
                setStatusId(newStatusId)
                onStatusChange(id, newStatusId)
              }}
              placeholder="Select Status"
              className="w-full lg:w-300"
              showClear
            />
          </div>
        </div>
      )}
    </div>
  )
})

type BulkOfferSelection = Record<number, { notes: string; statusId: number | null }>
type ProductOfferSelections = Record<
  number | string,
  Record<number, { notes: string; statusId: number | null }>
>

interface BulkOfferDialogProps {
  visible: boolean
  onHide: () => void
  concernCategories: IConcernCategory[]
  statusOptions: { label: string; value: number | null }[]
  onSave: (selection: BulkOfferSelection, markedItemIds: number[]) => void
  markedItemIds: number[]
}

const BulkOfferDialog = memo(function BulkOfferDialog({
  visible,
  onHide,
  concernCategories,
  statusOptions,
  onSave,
  markedItemIds,
}: BulkOfferDialogProps) {
  const [selection, setSelection] = useState<
    Record<number, { notes: string; statusId: number | null }>
  >({})

  useEffect(() => {
    if (!visible) {
      setSelection({})
    }
  }, [visible])

  const handleSave = () => {
    onSave(selection, markedItemIds)
    onHide()
  }

  const handleToggle = useCallback((id: number, checked: boolean) => {
    setSelection((prev) => {
      const next = { ...prev }
      if (!checked) {
        delete next[id]
        return next
      }
      return {
        ...next,
        [id]: {
          notes: prev[id]?.notes ?? '',
          statusId: prev[id]?.statusId ?? null,
        },
      }
    })
  }, [])

  const handleNotesBlur = useCallback((id: number, notes: string) => {
    setSelection((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        notes,
      },
    }))
  }, [])

  const handleStatusChange = useCallback((id: number, statusId: number | null) => {
    setSelection((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        statusId,
      },
    }))
  }, [])

  return (
    <Dialog
      modal
      blockScroll
      dismissableMask
      header="Submit Items for Offer"
      visible={visible}
      onHide={onHide}
      style={{ width: '90%', maxWidth: '400px' }}
      footer={
        <>
          <Button icon="pi pi-times" label="Cancel" severity="danger" outlined onClick={onHide} />
          <Button icon="pi pi-save" label="Save" outlined onClick={handleSave} />
        </>
      }
    >
      <div className="flex flex-column gap-3 w-full my-2">
        <h6>Select Topic</h6>
        {concernCategories.map((category: IConcernCategory) => {
          const rowSelection = selection[Number(category.id)]
          return (
            <ConcernCategoryRow
              key={Number(category.id)}
              category={category}
              selection={rowSelection}
              statusOptions={statusOptions}
              onToggle={handleToggle}
              onNotesBlur={handleNotesBlur}
              onStatusChange={handleStatusChange}
              inputPrefix="bulk"
            />
          )
        })}
      </div>
    </Dialog>
  )
})

interface ProductOfferDialogProps {
  visible: boolean
  onHide: () => void
  concernCategories: IConcernCategory[]
  statusOptions: { label: string; value: number | null }[]
  selectedProduct: ProductWithFrequency | null
  onSave: (selections: ProductOfferSelections) => void
}

const ProductOfferDialog = memo(function ProductOfferDialog({
  visible,
  onHide,
  concernCategories,
  statusOptions,
  selectedProduct,
  onSave,
}: ProductOfferDialogProps) {
  const [concernSelections, setConcernSelections] = useState<
    Record<number | string, Record<number, { notes: string; statusId: number | null }>>
  >({})

  useEffect(() => {
    if (!visible) {
      setConcernSelections({})
    }
  }, [visible])

  useEffect(() => {
    if (visible && selectedProduct) {
      setConcernSelections({})
    }
  }, [visible, selectedProduct?.id])

  const handleSave = () => {
    onSave(concernSelections)
    onHide()
  }

  const productId = selectedProduct ? Number(selectedProduct.id) : null

  const handleToggle = useCallback(
    (categoryId: number, checked: boolean) => {
      if (productId === null) return
      setConcernSelections((prev) => {
        if (!checked) {
          const next = { ...prev }
          const productSelections = { ...(next[productId] || {}) }
          delete productSelections[categoryId]
          if (Object.keys(productSelections).length === 0) {
            delete next[productId]
          } else {
            next[productId] = productSelections
          }
          return next
        }
        return {
          ...prev,
          [productId]: {
            ...(prev[productId] || {}),
            [categoryId]: {
              notes: prev[productId]?.[categoryId]?.notes ?? '',
              statusId: prev[productId]?.[categoryId]?.statusId ?? null,
            },
          },
        }
      })
    },
    [productId]
  )

  const handleNotesBlur = useCallback(
    (categoryId: number, notes: string) => {
      if (productId === null) return
      setConcernSelections((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [categoryId]: {
            ...prev[productId]?.[categoryId],
            notes,
          },
        },
      }))
    },
    [productId]
  )

  const handleStatusChange = useCallback(
    (categoryId: number, statusId: number | null) => {
      if (productId === null) return
      setConcernSelections((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [categoryId]: {
            ...prev[productId]?.[categoryId],
            statusId,
          },
        },
      }))
    },
    [productId]
  )

  return (
    <Dialog
      modal
      blockScroll
      dismissableMask
      header="Product Offer"
      visible={visible}
      onHide={onHide}
      style={{ width: '90%', maxWidth: '400px' }}
      footer={
        <>
          <Button icon="pi pi-times" label="Cancel" severity="danger" outlined onClick={onHide} />
          <Button icon="pi pi-save" label="Save" outlined onClick={handleSave} />
        </>
      }
    >
      <div className="flex flex-column gap-3 w-full my-2">
        <h5>{selectedProduct?.ItemName}</h5>
        <h6>Select Topic</h6>
        {concernCategories.map((category: IConcernCategory) => {
          const selection =
            productId !== null ? concernSelections[productId]?.[Number(category.id)] : undefined
          return (
            <ConcernCategoryRow
              key={Number(category.id)}
              category={category}
              selection={selection}
              statusOptions={statusOptions}
              onToggle={(categoryId, checked) => handleToggle(categoryId, checked)}
              onNotesBlur={(categoryId, notes) => handleNotesBlur(categoryId, notes)}
              onStatusChange={(categoryId, statusId) => handleStatusChange(categoryId, statusId)}
              inputPrefix="product"
            />
          )
        })}
      </div>
    </Dialog>
  )
})

interface ProductGridItemProps {
  item: ProductWithFrequency
  category: string
  markedItemIds: Set<number | bigint>
  visitItemMap: Record<number, IVisitItem>
  overlayRefs: RefObject<Record<string, OverlayPanel | null>>
  setSelectedProduct?: (item: ProductWithFrequency | null) => void
  setShowOfferDialog?: (show: boolean) => void
  handleTagForOffer?: (item: ProductWithFrequency) => void
}

const ProductGridItem = memo(function ProductGridItem({
  item,
  category,
  markedItemIds,
  visitItemMap,
  overlayRefs,
  setSelectedProduct,
  setShowOfferDialog,
  handleTagForOffer,
}: ProductGridItemProps) {
  const visitItem = visitItemMap[Number(item.id)]
  const visitItemConcerns = visitItem?.visit_item_concerns

  return (
    <div key={`${category}-${item.ItemCode}`} className="col-12 lg:col-6 xl:col-4">
      <ProductOfferCard
        item={item}
        category={category}
        visitItemConcern={visitItemConcerns?.[0]}
        overlayRefs={overlayRefs}
        setSelectedProduct={setSelectedProduct}
        setShowOfferDialog={setShowOfferDialog}
        handleTagForOffer={handleTagForOffer}
        markedForOffer={markedItemIds.has(item.id)}
      />
    </div>
  )
})

const VisitNoteInput = memo(function VisitNoteInput({ visitId }: { visitId: string }) {
  const visitNote = useSalesVisit((state) => state.visitNote)
  const setVisitNote = useSalesVisit((state) => state.setVisitNote)

  return (
    <div className="col-12 xl:col-6 md:col-6">
      <label htmlFor={`note-${visitId}`} className="block mb-2">
        Visit Note
      </label>
      <InputTextarea
        id={`note-${visitId}`}
        rows={2}
        autoResize
        value={visitNote}
        onChange={(e) => setVisitNote(e.target.value)}
        placeholder="Visit notes"
        className="w-full"
      />
    </div>
  )
})

interface InquiryItemProps {
  inquiry: IInquiry
  index: number
  products: any[]
  setSearchStore: (query: string) => void
  onUpdate: (index: number, field: keyof IInquiry, value: any) => void
  onRemove: (index: number) => void
  onSync: (id: number) => void
  visitId: string
}

const InquiryItem = memo(function InquiryItem({
  inquiry,
  index,
  products,
  setSearchStore,
  onUpdate,
  onRemove,
  onSync,
  visitId,
}: InquiryItemProps) {
  const [productName, setProductName] = useState(inquiry.product_name || '')
  const [notes, setNotes] = useState(inquiry.notes || '')

  useEffect(() => {
    setProductName(inquiry.product_name || '')
    setNotes(inquiry.notes || '')
  }, [inquiry.product_name, inquiry.notes])

  const handleNotesBlur = () => {
    if (notes !== inquiry.notes) {
      onUpdate(index, 'notes', notes)
    }
  }

  const handleProductSelect = (e: any) => {
    const selected = e.value
    setProductName(selected.ItemName)
    onUpdate(index, 'product_name', selected.ItemName)
    onUpdate(index, 'product_id', selected.id)
  }

  const handleProductChange = (e: any) => {
    setProductName(e.value)
  }

  const handleProductBlur = () => {
    if (productName !== inquiry.product_name) {
      onUpdate(index, 'product_name', productName)
      onUpdate(index, 'product_id', null)
    }
  }

  const handleRemove = () => {
    onRemove(index)
    onSync(Number(visitId))
  }

  return (
    <div className="mb-3 p-3 border-1 surface-border border-round">
      <div className="flex justify-content-between align-items-center mb-2">
        <span className="text-sm font-semibold">Inquiry #{index + 1}</span>
        <Button icon="pi pi-trash" severity="danger" text onClick={handleRemove} />
      </div>

      <AutoComplete
        value={productName}
        suggestions={products}
        field="ItemName"
        className="w-full my-2"
        inputClassName="w-full"
        placeholder="Search product..."
        completeMethod={(e) => setSearchStore(e.query)}
        onChange={handleProductChange}
        onSelect={handleProductSelect}
        onBlur={handleProductBlur}
      />

      <InputTextarea
        placeholder="Notes"
        className="w-full my-2"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
      />
    </div>
  )
})

const VisitsPage = () => {
  const { user } = useAuth()
  const isUserWithoutSlp = !user?.sales_person

  const salesVisitStore = useSalesVisit()
  const {
    fetchSalesVisit,
    salesVisit,
    syncOfferedItems,
    endVisit,
    startVisit,
    processItems,
    location,
    uploadVisitImage,
    setLocation,
  } = salesVisitStore
  const { fetchScheduleByDate, currentDate } = useScheduleStore()
  const { id } = useParams()
  const searchParams = useSearchParams()

  const {
    fetchProducts,
    data: products,
    setSearch: setSearchStore,
    search: searchStore,
  } = useProductsStore()

  const type = searchParams.get('type')
  const router = useRouter()

  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithFrequency | null>(null)

  const [suggestedGroup, setSuggestedGroup] = useState('')

  const [activeProductGroup, setActiveProductGroup] = useState<ProductWithFrequency[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [markedAs, setMarkedAs] = useState<ProductWithFrequency[]>([])
  const [showBulkOfferDialog, setShowBulkOfferDialog] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [dialogMode, setDialogMode] = useState<
    | 'NO_LOCATION'
    | 'DISTANCE_TOO_FAR'
    | 'LOW_ACCURACY'
    | 'PERMISSION_DENIED'
    | 'POSITION_UNAVAILABLE'
  >('NO_LOCATION')
  const [distance, setDistance] = useState<number>()
  const overlayRefs = useRef<Record<string, OverlayPanel | null>>({})
  const [cameraDialogVisible, setCameraDialogVisible] = useState(false)

  const { inquiries, addInquiry, removeInquiry, updateInquiry, syncInquiries, fetchInquiries } =
    useInquiryStore()

  const handleInquiryUpdate = useCallback(
    (index: number, field: keyof IInquiry, value: any) => {
      updateInquiry(index, field, value)
    },
    [updateInquiry]
  )

  const handleInquiryRemove = useCallback(
    (index: number) => {
      removeInquiry(index)
    },
    [removeInquiry]
  )

  const handleInquirySync = useCallback(
    (id: number) => {
      syncInquiries(id)
    },
    [syncInquiries]
  )

  const { data: concernCategoriesData, mutate: mutateCategories } =
    useFetch<IResObject<IConcernCategoryResponse>>('concern-categories')

  const concernCategories = useMemo(
    () => concernCategoriesData?.data?.concernCategories ?? [],
    [concernCategoriesData?.data?.concernCategories]
  )

  const { data: concernStatusesData, mutate: mutateStatus } = useFetch<
    IResObject<IConcernStatusResponse>
  >('concern-categories/statuses')

  const concernStatuses = useMemo(
    () => concernStatusesData?.data?.concernStatuses ?? [],
    [concernStatusesData?.data?.concernStatuses]
  )

  const statusOptions = useMemo(
    () => concernStatuses.map((s: IConcernStatus) => ({ label: s.status, value: Number(s.id) })),
    [concernStatuses]
  )

  const handleProductOfferSave = useCallback(
    (selections: ProductOfferSelections) => {
      syncOfferedItems(selections).then(() => {
        fetchSalesVisit(Number(id), type === 'rule' ? 'rule' : undefined)
        mutateCategories()
        mutateStatus()
      })
    },
    [syncOfferedItems, fetchSalesVisit, id, type, mutateCategories, mutateStatus]
  )

  const handleBulkOfferSave = useCallback(
    (selection: BulkOfferSelection, markedItemIds: number[]) => {
      processItems(selection, markedItemIds).then(() => {
        fetchSalesVisit(Number(id), type === 'rule' ? 'rule' : undefined)
        mutateCategories()
        mutateStatus()
        setMarkedAs([])
      })
    },
    [processItems, fetchSalesVisit, id, type, mutateCategories, mutateStatus, setMarkedAs]
  )
  const { suggestedItems, customer, visit_items } = salesVisit

  const { mutate: mutateVisitDistribution } = useFetch<IResObject<IDashboardData['data']>>(
    'summary/visits-distribution',
    undefined,
    {
      dedupingInterval: 60000,
      revalidateIfStale: false,
      revalidateOnReconnect: true,
    }
  )

  useEffect(() => {
    fetchProducts()
    fetchInquiries(Number(id))
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [searchStore])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchSalesVisit(Number(id), type === 'rule' ? 'rule' : undefined)
  }, [])

  useEffect(() => {
    if (!showOfferDialog) {
      setSelectedProduct(null)
    }
  }, [showOfferDialog])

  const requestEndVisit = async () => {
    if (!salesVisit.photo_url) {
      setCameraDialogVisible(true)
      return
    }

    await handleEndVisit()
  }
  const handleEndVisit = async () => {
    // await syncOfferedItems()
    await endVisit().then(() => {
      fetchScheduleByDate(Number(salesVisit?.sales_person_id), currentDate)
      mutateVisitDistribution()
      router.back()
    })
  }
  const handleStartVisit = async () => {
    try {
      const currentLocation = await getCurrentLocation()
      setLocation(currentLocation)

      // GPS kurang akurat
      if (currentLocation.accuracy > DISTANCE_THRESHOLD) {
        setDialogMode('LOW_ACCURACY')
        setDialogVisible(true)
        return
      }

      const hasLocation = customer?.lat != null && customer?.lng != null

      // Customer belum punya lokasi
      if (!hasLocation) {
        setDialogMode('NO_LOCATION')
        setDialogVisible(true)
        return
      }

      const distance = calculateDistance(
        Number(customer.lat),
        Number(customer.lng),
        currentLocation.latitude,
        currentLocation.longitude
      )

      // Customer terlalu jauh
      if (distance > DISTANCE_THRESHOLD) {
        setDistance(distance)
        setDialogMode('DISTANCE_TOO_FAR')
        setDialogVisible(true)
        return
      }

      await startVisit(Number(salesVisit.id))
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          setDialogMode('PERMISSION_DENIED')
          setDialogVisible(true)
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setDialogMode('POSITION_UNAVAILABLE')
          setDialogVisible(true)
        } else {
          throw error
        }
      }
    }
  }

  const suggestedGroups = useMemo(
    () =>
      [
        { key: 'distributor', label: 'Distributor', items: suggestedItems?.distributor ?? [] },
        { key: 'groceries', label: 'Groceries', items: suggestedItems?.groceries ?? [] },
      ] as const,
    [suggestedItems]
  )

  useEffect(() => {
    if (isUserWithoutSlp) {
      setSuggestedGroup('distributor')
    }
  }, [isUserWithoutSlp])

  useEffect(() => {
    if (!suggestedGroup) {
      setActiveProductGroup([])
    }
    setActiveProductGroup(
      suggestedGroups.find((group) => group.key === suggestedGroup)?.items ?? []
    )
  }, [suggestedGroup, suggestedGroups])

  const handleChangeSuggestedGroup = (value: string) => {
    setSuggestedGroup(value)
    setSelectedCategories([])

    const activeGroup = suggestedGroups.find((group) => group.key === value)
    setActiveProductGroup(activeGroup?.items ?? [])
    setSearch('')
    setMarkedAs([])
  }

  const isDistributor = suggestedGroup === 'distributor'

  const markedItemIds = useMemo(() => new Set(markedAs.map((i) => i.id)), [markedAs])

  const visitItemMap = useMemo(() => {
    return (visit_items ?? []).reduce((acc, vi: IVisitItem) => {
      if (vi.product_id !== null && vi.product_id !== undefined) {
        acc[Number(vi.product_id)] = vi
      }
      return acc
    }, {} as any)
  }, [visit_items])

  const filteredActiveProductGroup = useMemo(() => {
    if (isUserWithoutSlp) {
      return activeProductGroup.filter((item) => {
        const cat = item.ProductCategory?.toLowerCase() ?? ''
        const name = item.ItemName?.toLowerCase() ?? ''
        const isBeverage = cat === 'beverage'
        const isMoninOrMilklab = name.includes('monin') || name.includes('milklab')
        return isBeverage && isMoninOrMilklab
      })
    }
    return activeProductGroup
  }, [activeProductGroup, isUserWithoutSlp])

  const distributorCategories = useMemo(() => {
    if (!isDistributor) return []
    return filteredActiveProductGroup.reduce(
      (acc, item) => {
        const categoryName = item.ProductCategory ?? ''

        const exists = acc.find((option) => option.value === categoryName)

        if (categoryName && !exists) {
          acc.push({
            value: categoryName,
            label: categoryName,
          })
        }
        return acc
      },
      [] as { value: string; label: string }[]
    )
  }, [isDistributor, filteredActiveProductGroup])

  const offeredProductIds = useMemo(
    () => new Set((visit_items ?? []).map((item) => item.product_id)),
    [visit_items]
  )

  const filteredProducts = useMemo(
    () =>
      getFilteredProducts({
        activeProductGroup: filteredActiveProductGroup,
        offeredProductIds,
        selectedCategories,
        keyword: debouncedSearch,
      }),
    [filteredActiveProductGroup, offeredProductIds, selectedCategories, debouncedSearch]
  )

  useEffect(() => {
    if (!isDistributor) return

    const keyword = debouncedSearch.trim().toLowerCase()

    if (!keyword) {
      setSelectedCategories([])
      return
    }

    const matchedCategories = Array.from(
      new Set(
        filteredActiveProductGroup
          .filter((item) => item.ItemName?.toLowerCase().includes(keyword))
          .map((item) => item.ProductCategory ?? '')
          .filter(Boolean)
      )
    )

    setSelectedCategories(matchedCategories)
  }, [debouncedSearch, isDistributor, filteredActiveProductGroup])

  const { distributor: offeredDistributor, groceries: offeredGroceries } = groupVisitItems(
    salesVisit.visit_items ?? []
  )

  const isVisitInitated = salesVisit.start_at !== null

  const handleTagAllForOffer = (items: ProductWithFrequency[]) => {
    const itemIds = new Set(items.map((item) => item.id))
    const allTagged = items.every((item) => markedItemIds.has(item.id))

    if (allTagged) {
      setMarkedAs((prev) => prev.filter((item) => !itemIds.has(item.id)))
    } else {
      const toAdd = items.filter((item) => !markedItemIds.has(item.id))
      setMarkedAs((prev) => [...prev, ...toAdd])
    }
  }

  const handleTagForOffer = (item: ProductWithFrequency) => {
    if (markedItemIds.has(item.id)) {
      setMarkedAs((prev) => prev.filter((i) => i.id !== item.id))
    } else {
      setMarkedAs((prev) => [...prev, item])
    }
  }

  const handleUploadImage = async (file: File) => {
    await uploadVisitImage(file)

    setCameraDialogVisible(false)

    await handleEndVisit()
  }

  if (!salesVisit.id)
    return (
      <div
        className="absolute top-0 left-0 w-full h-full flex align-items-center justify-content-center bg-white-alpha-60 z-2"
        style={{ borderRadius: '6px' }}
      >
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
      </div>
    )

  return (
    <>
      <div className="card p-3">
        <NavButton handleEndVisit={salesVisit.start_at ? requestEndVisit : undefined} />
        <p className="m-0 text-2xl ml-2 mt-2">{customer?.CardName}</p>
        <CustomerInfo
          customer={customer}
          className="flex-1 px-0 py-2"
          subgroupIcon="pi pi-tags"
          subgroupIconColor="var(--teal-500)"
        />
        <Divider />

        <h5 className="ml-2">Target Overview</h5>
        <div className="p-2">
          <AvgRevenueAndTarget customer={customer} />
        </div>
        <Divider />
        <h5 className="ml-2">Product Coverage</h5>
        <div className="p-2">
          <ProductCoverage customer={customer} />
        </div>

        <Divider />
        {!isVisitInitated ? (
          <div className="col-12 xl:col-6 md:col-6">
            <Button
              label="Start"
              icon="pi pi-play"
              severity="success"
              outlined
              size="small"
              onClick={handleStartVisit}
            />
          </div>
        ) : (
          <div>
            <div className="col-12 xl:col-6 md:col-6">
              <h5>Product Offer</h5>
            </div>
            {!isUserWithoutSlp && (
              <div className="col-12 xl:col-6 md:col-6">
                <div className="">
                  <label htmlFor={`itemGroup-${salesVisit.id}`} className="block mb-2">
                    Item Group
                  </label>
                  <Dropdown
                    id={`itemGroup-${salesVisit.id}`}
                    options={suggestedGroups.map((group) => {
                      return { label: group.key.toUpperCase(), value: group.key }
                    })}
                    value={suggestedGroup}
                    onChange={(e) => handleChangeSuggestedGroup(e.value)}
                    placeholder="Item Group"
                    className="w-full"
                  />
                </div>
              </div>
            )}
            {suggestedGroup && (
              <div className="col-12 xl:col-6 md:col-6 mb-2">
                <label htmlFor={`search-${salesVisit.id}`} className="block mb-2">
                  Search
                </label>
                <InputText
                  id={`search-${salesVisit.id}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Items"
                  className="w-full"
                />
              </div>
            )}

            {activeProductGroup.length > 0 && (
              <>
                <div className="mx-2 mt-3">
                  <h6>SUGGESTED ITEMS {suggestedGroup?.toUpperCase()}</h6>
                  {markedAs.length > 0 && (
                    <div className="flex align-items-center gap-2 my-3">
                      <Button
                        size="small"
                        outlined
                        severity="success"
                        icon="pi pi-cog pi-spin"
                        label="Process Tagged Items"
                        onClick={() => setShowBulkOfferDialog(true)}
                      />
                    </div>
                  )}
                  {isDistributor && distributorCategories.length > 0 ? (
                    <div className="flex flex-column gap-3">
                      {distributorCategories
                        .filter((cat) =>
                          filteredProducts.some((item) => item.ProductCategory === cat.value)
                        )
                        .map((cat) => {
                          const items = filteredProducts.filter(
                            (item) => item.ProductCategory === cat.value
                          )

                          return (
                            <Panel key={cat.value} header={cat.label} toggleable>
                              <div className="flex flex-column ">
                                <label
                                  htmlFor={`checkbox-closed-${cat.value}`}
                                  className="flex align-items-center gap-2 mb-2"
                                >
                                  <Checkbox
                                    inputId={`checkbox-closed-${cat.value}`}
                                    checked={items.every((item) =>
                                      markedAs.some((i) => i.id === item.id)
                                    )}
                                    onChange={() => handleTagAllForOffer(items)}
                                  />
                                  <span>Tag all</span>
                                </label>
                              </div>
                              <div className="grid">
                                {items.map((item) => {
                                  const category = item.ProductCategory
                                    ? item.ProductCategory.charAt(0) +
                                      item.ProductCategory.slice(1).toLocaleLowerCase()
                                    : ''

                                  return (
                                    <ProductGridItem
                                      key={`distributor-${item.ItemCode}`}
                                      item={item}
                                      category={category}
                                      markedItemIds={markedItemIds}
                                      visitItemMap={visitItemMap}
                                      overlayRefs={overlayRefs}
                                      setSelectedProduct={setSelectedProduct}
                                      setShowOfferDialog={setShowOfferDialog}
                                      handleTagForOffer={handleTagForOffer}
                                    />
                                  )
                                })}
                              </div>
                            </Panel>
                          )
                        })}
                      {filteredProducts.length === 0 && search && (
                        <div className="col-12">
                          <div className="flex align-items-center justify-content-start w-full text-sm text-yellow-500">
                            <i className="mr-2 pi pi-exclamation-triangle"></i>
                            <p className="m-0">No Items Found</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid">
                      {filteredProducts.map((item) => {
                        const category = item.ProductCategory
                          ? item.ProductCategory.charAt(0) +
                            item.ProductCategory.slice(1).toLocaleLowerCase()
                          : ''
                        return (
                          <ProductGridItem
                            key={`groceries-${item.ItemCode}`}
                            item={item}
                            category={category}
                            markedItemIds={markedItemIds}
                            visitItemMap={visitItemMap}
                            overlayRefs={overlayRefs}
                            setSelectedProduct={setSelectedProduct}
                            setShowOfferDialog={setShowOfferDialog}
                            handleTagForOffer={handleTagForOffer}
                          />
                        )
                      })}
                      {filteredProducts.length === 0 && (
                        <div className="col-12">
                          <div className="flex align-items-center justify-content-start w-full text-sm text-yellow-500">
                            <i className="mr-2 pi pi-exclamation-triangle"></i>
                            <p className="m-0">No Items Found</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {(salesVisit.visit_items?.length ?? 0) > 0 && (
              <>
                <Divider />
                <h5 className="ml-2">Offered Items</h5>
                {(offeredDistributor?.length ?? 0) > 0 && (
                  <Card className="w-full h-full shadow-none px-0" title="DISTRIBUTOR">
                    {offeredDistributor?.map((distributorItem) => {
                      const category = distributorItem.category
                      const visitItems = distributorItem.items
                      return (
                        <div key={`distributor-${category}`} className="py-3">
                          <h5>{category}</h5>
                          <div className="grid">
                            {visitItems.map((visitItem) => {
                              return (
                                <OfferedProduct
                                  visitItem={visitItem}
                                  key={visitItem.id.toString()}
                                  defaultOpen={false}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </Card>
                )}
                {(offeredGroceries?.length ?? 0) > 0 && (
                  <Card className="w-full h-full shadow-none px-0" title="GROCERIES">
                    <div className="grid">
                      {offeredGroceries?.map((groceriesItem) => {
                        return (
                          <OfferedProduct
                            defaultOpen={false}
                            visitItem={groceriesItem}
                            key={groceriesItem.id.toString()}
                          />
                        )
                      })}
                    </div>
                  </Card>
                )}
              </>
            )}

            <div className="col-12 xl:col-6 md:col-6 mt-5">
              <h5>Notes & Inquiries</h5>
            </div>
            <VisitNoteInput visitId={String(salesVisit.id)} />
            <div className="col-12 xl:col-6 md:col-6">
              {/* HEADER */}
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="font-semibold">Product Inquiry</span>
              </div>

              {/* LIST */}
              {inquiries.map((inq, index) => (
                <InquiryItem
                  key={index}
                  inquiry={inq}
                  index={index}
                  products={products}
                  setSearchStore={setSearchStore}
                  onUpdate={handleInquiryUpdate}
                  onRemove={handleInquiryRemove}
                  onSync={handleInquirySync}
                  visitId={String(id)}
                />
              ))}
              <div className="flex align-items-center gap-2">
                <Button
                  severity="success"
                  outlined
                  rounded
                  icon="pi pi-plus"
                  size="small"
                  onClick={addInquiry}
                />
                <Button
                  disabled={
                    inquiries.length === 1 &&
                    !inquiries[0].product_id &&
                    !inquiries[0].product_name &&
                    !inquiries[0].notes
                  }
                  severity="success"
                  outlined
                  rounded
                  icon="pi pi-check"
                  size="small"
                  onClick={() => syncInquiries(Number(id))}
                />
              </div>
            </div>
            <Competitors />
          </div>
        )}
      </div>
      <ConfirmLocationDialog
        visible={dialogVisible}
        mode={dialogMode}
        distance={distance}
        accuracy={location?.accuracy}
        onHide={() => setDialogVisible(false)}
        onSaveLocation={async () => {
          if (!location) return

          setDialogVisible(false)

          await startVisit(Number(salesVisit.id), dialogMode)
        }}
      />
      <CameraCaptureDialog
        visible={cameraDialogVisible}
        onHide={() => setCameraDialogVisible(false)}
        onSave={handleUploadImage}
      />

      <ProductOfferDialog
        visible={showOfferDialog}
        onHide={() => setShowOfferDialog(false)}
        concernCategories={concernCategories}
        statusOptions={statusOptions}
        selectedProduct={selectedProduct}
        onSave={handleProductOfferSave}
      />
      <BulkOfferDialog
        visible={showBulkOfferDialog}
        onHide={() => {
          setShowBulkOfferDialog(false)
          setMarkedAs([])
        }}
        concernCategories={concernCategories}
        statusOptions={statusOptions}
        onSave={handleBulkOfferSave}
        markedItemIds={markedAs.map((item) => Number(item.id))}
      />
    </>
  )
}

export default VisitsPage
