'use client'

import { IProduct } from '@saleshub-tsm/types'
import { OverlayPanel } from 'primereact/overlaypanel'
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html'
import { RefObject } from 'react'

import useIsMobile from '@/layout/mobile/useIsMobile'

type DeltaOperation = {
  insert?: string | Record<string, unknown>
  attributes?: Record<string, unknown>
  delete?: number
  retain?: number
}

type Delta = {
  ops: DeltaOperation[]
}
type Props = {
  item: IProduct
  overlayRefs: RefObject<Record<string, OverlayPanel | null>>
}

const ProductOverlayPanel = ({ item, overlayRefs }: Props) => {
  const isMobile = useIsMobile(768)

  const convertDeltaToHtml = (delta: string | Delta): string => {
    try {
      const parsed: Delta = typeof delta === 'string' ? JSON.parse(delta) : delta

      const cleanedOps: DeltaOperation[] = parsed.ops.map((op) => {
        if (!op.attributes) return op

        const { color, background: _background, ...rest } = op.attributes

        if (color) {
          rest.color = 'var(--text-color-secondary)'
        }

        return {
          ...op,
          attributes: Object.keys(rest).length ? rest : undefined,
        }
      })

      const converter = new QuillDeltaToHtmlConverter(cleanedOps, {})
      return converter.convert()
    } catch (err) {
      console.error(err)
      return ''
    }
  }

  return (
    <OverlayPanel
      ref={(el) => {
        if (overlayRefs.current) {
          overlayRefs.current[item.ItemCode] = el
        }
      }}
      className={isMobile ? 'mobile-overlay' : ''}
      style={{
        width: isMobile ? '90vw' : '400px',
        maxWidth: '100vw',
        marginLeft: isMobile ? '5vw' : undefined,
      }}
    >
      <div
        className="p-3 text-sm"
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          wordBreak: 'break-word',
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: convertDeltaToHtml(item.ProductInfo as string | Delta),
          }}
        />
      </div>
    </OverlayPanel>
  )
}

export default ProductOverlayPanel
