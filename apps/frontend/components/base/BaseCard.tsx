import { Card } from 'primereact/card'

type BaseCardProps = {
  children?: React.ReactNode
  title?: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
  contentClassName?: string
  header?: React.ReactNode
  style?: React.CSSProperties
  pt?: any
}

const BaseCard = ({
  children,
  title,
  subtitle,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  contentClassName = '',
  header,
  style,
  pt,
}: BaseCardProps) => {
  const defaultRootStyle: React.CSSProperties = {
    borderRadius: '12px',
    padding: '1rem',
    ...style,
  }

  const defaultBodyStyle: React.CSSProperties = {
    height: '100%',
    padding: '0.5rem',
    paddingBottom: '2rem',
  }

  const defaultContentStyle: React.CSSProperties = {
    padding: '0.5rem',
    height: '100%',
  }

  const mergedPt = {
    root: {
      style: defaultRootStyle,
      ...pt?.root,
    },
    body: {
      className: bodyClassName,
      style: defaultBodyStyle,
      ...pt?.body,
    },
    content: {
      className: contentClassName,
      style: defaultContentStyle,
      ...pt?.content,
    },
    header: {
      className: headerClassName,
      style: pt?.header?.style,
      ...pt?.header,
    },
  }

  return (
    <Card pt={mergedPt} className={className} title={title} subTitle={subtitle} header={header}>
      {children}
    </Card>
  )
}

export default BaseCard
