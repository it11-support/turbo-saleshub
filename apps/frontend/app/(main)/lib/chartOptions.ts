import { TooltipItem } from 'chart.js'
import { Context } from 'chartjs-plugin-datalabels'

export const getCommonChartOptions = (options: {
  title?: string
  subtitle?: string
  xTitle?: string
  yTitle?: string
  stacked?: boolean
  minY?: number
  maxY?: number
  showLegend?: boolean
  showGridX?: boolean
  showGridY?: boolean
  tooltipCallbacks?: {
    title?: (ctx: TooltipItem<any>[]) => string
    label?: (ctx: TooltipItem<any>) => string
    footer?: (ctx: TooltipItem<any>[]) => string[]
    afterBody?: (ctx: TooltipItem<any>[]) => string[]
  }
  datalabels?: {
    display?: boolean | ((ctx: Context) => boolean)
    align?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'end' | 'start'
    anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'end' | 'start'
    offset?: number
    color?: string | ((ctx: Context) => string)
    font?: {
      size?: number
      weight?: string
    }
    formatter?: (value: number, ctx: Context) => string
    clip?: boolean
    clamp?: boolean
  }
  ticksCallback?: (value: string | number) => string | number
}) => {
  const {
    title,
    subtitle,
    xTitle,
    yTitle,
    stacked = false,
    minY = 0,
    maxY,
    showLegend = false,
    showGridX = false,
    showGridY = true,
    tooltipCallbacks = {},
    datalabels,
    ticksCallback,
  } = options

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: title
        ? {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold',
            },
          }
        : undefined,
      subtitle: subtitle
        ? {
            display: true,
            text: subtitle,
            color: '#64748B',
            font: {
              size: 11,
            },
            padding: {
              bottom: 10,
            },
          }
        : undefined,
      legend: {
        display: showLegend,
      },
      tooltip: {
        callbacks: tooltipCallbacks,
      },
      datalabels: datalabels,
    },
    scales: {
      x: {
        stacked,
        grid: {
          display: showGridX,
        },
        ticks: {
          autoSkip: false,
        },
        title: xTitle
          ? {
              display: true,
              text: xTitle,
            }
          : undefined,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
      y: {
        stacked,
        beginAtZero: true,
        min: minY,
        max: maxY,
        grid: {
          display: showGridY,
        },
        title: yTitle
          ? {
              display: true,
              text: yTitle,
            }
          : undefined,
        ticks: ticksCallback
          ? {
              callback: ticksCallback,
            }
          : undefined,
      },
    },
  }
}

export const getLineChartOptions = (options: {
  title?: string
  subtitle?: string
  yTitle?: string
  maxY?: number
  showGridX?: boolean
  showGridY?: boolean
  tooltipCallbacks?: {
    title?: (ctx: TooltipItem<'line'>[]) => string
    label?: (ctx: TooltipItem<'line'>) => string
    footer?: (ctx: TooltipItem<'line'>[]) => string[]
  }
  datalabels?: {
    display?: boolean | ((ctx: Context) => boolean)
    align?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'end' | 'start'
    anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'end' | 'start'
    offset?: number
    color?: string | ((ctx: Context) => string)
    font?: {
      size?: number
      weight?: string
    }
    formatter?: (value: number, ctx: Context) => string
  }
  ticksCallback?: (value: string | number) => string | number
}) => {
  return getCommonChartOptions({
    ...options,
    showGridX: options.showGridX ?? false,
    showGridY: options.showGridY ?? true,
  })
}

export const getBarChartOptions = (options: {
  title?: string
  subtitle?: string
  xTitle?: string
  yTitle?: string
  stacked?: boolean
  minY?: number
  maxY?: number
  showLegend?: boolean
  showGridX?: boolean
  showGridY?: boolean
  tooltipCallbacks?: {
    title?: (ctx: TooltipItem<'bar'>[]) => string
    label?: (ctx: TooltipItem<'bar'>) => string
    footer?: (ctx: TooltipItem<'bar'>[]) => string[]
  }
  datalabels?: {
    display?: boolean | ((ctx: Context) => boolean)
    align?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'end' | 'start'
    anchor?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'end' | 'start'
    offset?: number
    color?: string | ((ctx: Context) => string)
    font?: {
      size?: number
      weight?: string
    }
    formatter?: (value: number, ctx: Context) => string
    clip?: boolean
    clamp?: boolean
  }
  ticksCallback?: (value: string | number) => string | number
}) => {
  return getCommonChartOptions({
    ...options,
    showGridX: options.showGridX ?? true,
    showGridY: options.showGridY ?? true,
  })
}
