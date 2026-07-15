import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

type ChartCardProps = {
  children?: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  header?: React.ReactNode
  isLoading?: boolean
  skeletonType?: 'rect' | 'chart-horizontal' | 'chart-vertical'
  chartType?: 'bar' | 'line' | 'doughnut' | 'pie'
  chartData: any
  chartOptions: any
  chartHeight?: string | number
  plugins?: any[]
  style?: React.CSSProperties
  pt?: {
    root?: React.CSSProperties
    body?: React.CSSProperties
    content?: React.CSSProperties
  }
}

const ChartCard = ({
  children,
  title,
  subtitle,
  className = '',
  header,
  isLoading = false,
  chartType = 'bar',
  chartData,
  chartOptions,
  chartHeight = '350px',
  plugins = [ChartDataLabels],
  style,
  pt,
}: ChartCardProps) => {
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
      style: defaultBodyStyle,
      ...pt?.body,
    },
    content: {
      style: defaultContentStyle,
      ...pt?.content,
    },
  }

  if (isLoading) {
    return (
      <div style={{ height: '500px' }}>
        <Card pt={mergedPt} className={className} header={header} title={title} subTitle={subtitle}>
          {children}
        </Card>
      </div>
    )
  }

  return (
    <Card pt={mergedPt} className={className} header={header} title={title} subTitle={subtitle}>
      <Chart
        type={chartType}
        data={chartData}
        options={chartOptions}
        style={{ width: '100%', height: chartHeight }}
        plugins={plugins}
      />
      {children}
    </Card>
  )
}

export default ChartCard
