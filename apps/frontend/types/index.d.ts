import { ReactNode } from 'react'

import {
  Demo,
  LayoutType,
  SortOrderType,
  CustomEvent,
  ChartDataState,
  ChartOptionsState,
  AppMailSidebarItem,
  AppMailReplyProps,
  AppMailProps,
} from './demo'
import {
  Page,
  AppBreadcrumbProps,
  Breadcrumb,
  BreadcrumbItem,
  MenuProps,
  MenuModel,
  LayoutConfig,
  LayoutState,
  Breadcrumb,
  LayoutContextProps,
  MailContextProps,
  MenuContextProps,
  ChatContextProps,
  TaskContextProps,
  AppConfigProps,
  NodeRef,
  AppTopbarRef,
  AppMenuItemProps,
  AppMenuItem,
} from './layout'

type ChildContainerProps = {
  children: ReactNode
}

export type {
  Page,
  AppBreadcrumbProps,
  Breadcrumb,
  BreadcrumbItem,
  MenuProps,
  MenuModel,
  LayoutConfig,
  LayoutState,
  Breadcrumb,
  LayoutContextProps,
  MailContextProps,
  MenuContextProps,
  ChatContextProps,
  TaskContextProps,
  AppConfigProps,
  NodeRef,
  AppTopbarRef,
  AppMenuItemProps,
  ChildContainerProps,
  Demo,
  LayoutType,
  SortOrderType,
  CustomEvent,
  ChartDataState,
  ChartOptionsState,
  AppMailSidebarItem,
  AppMailReplyProps,
  AppMailProps,
  AppMenuItem,
}

export * from './sales'
export * from './visit'
export * from './visit-rules'
