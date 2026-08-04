import { ChartType, TooltipItem } from 'chart.js'
import { Context } from 'chartjs-plugin-datalabels'

type TooltipCallbacks<T extends ChartType> = {
  title?: (ctx: TooltipItem<T>[]) => string
  label?: (ctx: TooltipItem<T>) => string
  footer?: (ctx: TooltipItem<T>[]) => string[]
  afterBody?: (ctx: TooltipItem<T>[]) => string[]
}

type DataLabelsOptions = {
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

type CommonChartOptions<T extends ChartType> = {
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
  tooltipCallbacks?: TooltipCallbacks<T>
  datalabels?: DataLabelsOptions
  ticksCallback?: (value: string | number) => string | number
}

export const getCommonChartOptions = <T extends ChartType = ChartType>(
  options: CommonChartOptions<T>
) => {
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
      title: title && {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      subtitle: subtitle && {
        display: true,
        text: subtitle,
        color: '#64748B',
        font: {
          size: 11,
        },
        padding: {
          bottom: 10,
        },
      },
      legend: {
        display: showLegend,
      },
      tooltip: {
        callbacks: tooltipCallbacks,
      },
      datalabels,
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
        title: xTitle && {
          display: true,
          text: xTitle,
        },
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
        title: yTitle && {
          display: true,
          text: yTitle,
        },
        ticks: ticksCallback ? { callback: ticksCallback } : undefined,
      },
    },
  }
}

export const getLineChartOptions = (
  options: Omit<CommonChartOptions<'line'>, 'xTitle' | 'stacked' | 'showLegend' | 'minY'>
) =>
  getCommonChartOptions<'line'>({
    ...options,
    showGridX: options.showGridX ?? false,
    showGridY: options.showGridY ?? true,
  })

export const getBarChartOptions = (options: CommonChartOptions<'bar'>) =>
  getCommonChartOptions<'bar'>({
    ...options,
    showGridX: options.showGridX ?? true,
    showGridY: options.showGridY ?? true,
  })
