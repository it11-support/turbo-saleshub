import { Column, ColumnProps } from 'primereact/column'
import { DataTable, DataTableProps } from 'primereact/datatable'

type DataTableColumn = ColumnProps & {
  field: string
  header: string
}

type BaseDataTableProps<T> = {
  value: T[] | undefined
  columns: DataTableColumn[]
  paginator?: boolean
  rows?: number
  rowsPerPageOptions?: number[]
  filterDisplay?: 'menu' | 'row' | 'none'
  emptyMessage?: string
  className?: string
  tableClassName?: string
  tableStyle?: React.CSSProperties
  style?: React.CSSProperties
  loading?: boolean
  sortMode?: 'single' | 'multiple'
  selection?: T | T[] | null
  onSelectionChange?: (e: { value: T | T[] | null }) => void
  children?: React.ReactNode
}

const BaseDataTable = <T,>({
  value,
  columns,
  paginator = true,
  rows = 10,
  rowsPerPageOptions = [10, 25, 50],
  filterDisplay = 'menu',
  emptyMessage = 'No records found',
  className = 'p-datatable-sm',
  tableClassName,
  tableStyle,
  style,
  loading = false,
  sortMode = 'multiple',
  selection,
  onSelectionChange,
  children,
  ...restProps
}: BaseDataTableProps<T> & DataTableProps<any>) => {
  return (
    <DataTable
      value={value}
      paginator={paginator}
      rows={rows}
      rowsPerPageOptions={rowsPerPageOptions}
      filterDisplay={filterDisplay}
      emptyMessage={emptyMessage}
      className={className}
      style={style}
      loading={loading}
      sortMode={sortMode}
      selection={selection}
      onSelectionChange={onSelectionChange}
      tableClassName={tableClassName}
      tableStyle={tableStyle}
      {...restProps}
    >
      {columns.map((col, index) => (
        <Column
          key={col.field || index}
          field={col.field}
          header={col.header}
          sortable={col.sortable}
          filter={col.filter}
          body={col.body}
          style={col.style}
          headerStyle={col.headerStyle}
          bodyStyle={col.bodyStyle}
          hidden={col.hidden}
          exportable={col.exportable}
          filterElement={col.filterElement}
          filterHeaderStyle={col.filterHeaderStyle}
          filterHeaderClassName={col.filterHeaderClassName}
          headerClassName={col.headerClassName}
          bodyClassName={col.bodyClassName}
          className={col.className}
          pt={col.pt}
          frozen={col.frozen}
          alignFrozen={col.alignFrozen}
          columnKey={col.columnKey}
          editor={col.editor}
          filterMatchMode={col.filterMatchMode}
          filterPlaceholder={col.filterPlaceholder}
          filterFunction={col.filterFunction}
          footer={col.footer}
          footerStyle={col.footerStyle}
          footerClassName={col.footerClassName}
          headerTooltip={col.headerTooltip}
          headerTooltipOptions={col.headerTooltipOptions}
          reorderable={col.reorderable}
          resizeable={col.resizeable}
        />
      ))}
      {children}
    </DataTable>
  )
}

export default BaseDataTable
