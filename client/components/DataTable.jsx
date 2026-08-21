import { celledBorders } from '@client/components/tableStyles'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel
} from '@mui/material'
import { useState } from 'react'

const accessorOf = (column) => column.sortValue || ((row) => row[column.field || column.key])

const compare = (a, b) => {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  return Number(a) - Number(b)
}

const sortRows = (rows, sort, columns) => {
  const accessors = sort
    .map(({ key, direction }) => {
      const column = columns.find((c) => c.key === key)
      return column ? { get: accessorOf(column), sign: direction === 'desc' ? -1 : 1 } : null
    })
    .filter(Boolean)

  if (!accessors.length) return rows

  return [...rows].sort((a, b) => {
    for (const { get, sign } of accessors) {
      const result = compare(get(a), get(b)) * sign
      if (result) return result
    }
    return 0
  })
}

export const BooleanIcon = ({ value, ...props }) =>
  value ? <CheckIcon color="success" {...props} /> : <CloseIcon color="error" {...props} />

export const RowActions = ({ children }) => (
  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
    {children}
  </Stack>
)

export default ({ columns, rows, rowKey, rowProps, primarySort = [], defaultSort = [], 'data-cy': dataCy }) => {
  const [sort, setSort] = useState(defaultSort)
  const [active] = sort

  const toggleSort = (key) =>
    setSort(([current]) =>
      current && current.key === key && current.direction === 'asc'
        ? [{ key, direction: 'desc' }]
        : [{ key, direction: 'asc' }]
    )

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
      <Table data-cy={dataCy} size="small" sx={{ tableLayout: 'fixed', wordWrap: 'anywhere', ...celledBorders }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align}
                sortDirection={active && active.key === column.key ? active.direction : false}
                sx={{ width: column.width, fontWeight: 700 }}
              >
                {column.sortable ? (
                  <TableSortLabel
                    active={Boolean(active) && active.key === column.key}
                    direction={active && active.key === column.key ? active.direction : 'asc'}
                    onClick={() => toggleSort(column.key)}
                  >
                    {column.header}
                  </TableSortLabel>
                ) : (
                  column.header
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortRows(rows || [], [...primarySort, ...sort], columns).map((row) => (
            <TableRow hover key={rowKey(row)} {...(rowProps ? rowProps(row) : null)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align}
                  {...(typeof column.cellProps === 'function' ? column.cellProps(row) : column.cellProps)}
                >
                  {column.render ? column.render(row) : row[column.field || column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
