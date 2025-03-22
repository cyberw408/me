import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Box,
  Typography,
  Paper,
  SxProps,
  Theme
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { generateAriaId, getSortableColumnAriaProps, valueToScreenReaderText } from '../utils/accessibility';

export interface Column<T> {
  id: string;
  label: string;
  accessor: (row: T) => any;
  format?: (value: any) => React.ReactNode;
  screenReaderFormat?: (value: any) => string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  width?: string | number;
}

type GetRowIdFunction<T> = (row: T, index: number) => string | number;

interface AccessibleTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  caption?: string;
  emptyMessage?: string;
  getRowId?: GetRowIdFunction<T>;
  sortable?: boolean;
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  dense?: boolean;
  stickyHeader?: boolean;
}

type Order = 'asc' | 'desc';

/**
 * An accessible table component that supports pagination, sorting, and screen reader optimizations
 */
function AccessibleTable<T>({
  columns,
  data,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  caption,
  emptyMessage = "No data available",
  getRowId = (row: T, index: number) => index,
  sortable = true,
  defaultSortBy,
  defaultSortDirection = 'asc',
  onRowClick,
  dense = false,
  stickyHeader = false
}: AccessibleTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [orderBy, setOrderBy] = useState<string | undefined>(defaultSortBy);
  const [order, setOrder] = useState<Order>(defaultSortDirection);
  const [sortedData, setSortedData] = useState<T[]>(data);
  const [tableId] = useState(() => generateAriaId('table'));
  
  const { colors, accessibility } = useTheme();

  // Update sorted data when data, order, or orderBy changes
  useEffect(() => {
    let sorted = [...data];
    
    if (orderBy) {
      const column = columns.find(col => col.id === orderBy);
      if (column) {
        sorted = sorted.sort((a, b) => {
          const aValue = column.accessor(a);
          const bValue = column.accessor(b);
          
          if (aValue < bValue) {
            return order === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return order === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
    }
    
    setSortedData(sorted);
  }, [data, order, orderBy, columns]);

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate table styles based on accessibility options
  const getTableStyles = (): SxProps<Theme> => {
    let styles: SxProps<Theme> = {
      fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
    };
    
    if (accessibility.highContrast) {
      styles = {
        ...styles,
        '& .MuiTableHead-root': {
          bgcolor: 'background.paper',
        },
        '& .MuiTableCell-head': {
          color: 'text.primary',
          fontWeight: 'bold',
          borderBottom: '2px solid',
          borderColor: 'text.primary',
        },
        '& .MuiTableRow-root:nth-of-type(odd)': {
          bgcolor: 'action.hover',
        },
        '& .MuiTableCell-body': {
          borderColor: 'text.secondary',
        },
        '& .MuiTableSortLabel-root': {
          color: 'text.primary',
          '&:hover': {
            color: 'text.primary',
          },
          '&.Mui-active': {
            color: 'text.primary',
            '& .MuiTableSortLabel-icon': {
              color: 'text.primary',
            },
          },
        },
      };
    }
    
    return styles;
  };

  // Display empty state if no data
  if (!data.length) {
    return (
      <Box 
        role="status" 
        aria-live="polite"
        sx={{ 
          p: 3, 
          textAlign: 'center',
          color: accessibility.highContrast ? 'text.primary' : 'text.secondary',
          fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
        }}
      >
        {emptyMessage}
      </Box>
    );
  }

  // Current page data
  const currentPageData = rowsPerPage > 0
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  return (
    <Box sx={{ width: '100%' }}>
      {caption && (
        <Typography
          component="div"
          sx={{
            p: 2,
            fontWeight: 'medium',
            color: accessibility.highContrast ? 'text.primary' : colors.primary,
            fontSize: accessibility.largeText ? '1.2rem' : '1rem',
          }}
          id={`${tableId}-caption`}
        >
          {caption}
        </Typography>
      )}
      
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          overflow: 'auto',
          maxHeight: stickyHeader ? 'calc(100vh - 350px)' : undefined,
          border: accessibility.highContrast ? '2px solid' : '1px solid #eee',
          borderColor: accessibility.highContrast ? 'text.primary' : undefined,
          borderRadius: 1,
        }}
      >
        <Table 
          aria-labelledby={caption ? `${tableId}-caption` : undefined}
          size={dense ? 'small' : 'medium'}
          stickyHeader={stickyHeader}
          sx={getTableStyles()}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ 
                    width: column.width,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    bgcolor: accessibility.highContrast ? undefined : `${colors.primary}05`,
                  }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      {...getSortableColumnAriaProps(orderBy === column.id, (orderBy === column.id ? order : 'asc'))}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                  
                  {/* Hidden text for screen readers explaining the column purpose */}
                  <span className="sr-only">
                    {`Column ${column.label}. ${
                      sortable && column.sortable !== false
                        ? orderBy === column.id
                          ? `Sorted ${order === 'asc' ? 'ascending' : 'descending'}`
                          : 'Not sorted. Click to sort'
                        : ''
                    }`}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageData.map((row, index) => {
              const rowId = getRowId(row, index);
              
              return (
                <TableRow
                  hover
                  key={rowId.toString()}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : -1}
                  role={onRowClick ? 'button' : undefined}
                  sx={{ 
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': { bgcolor: accessibility.highContrast ? undefined : `${colors.primary}05` },
                  }}
                  onKeyDown={onRowClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  } : undefined}
                >
                  {columns.map((column) => {
                    const value = column.accessor(row);
                    const formattedValue = column.format ? column.format(value) : value;
                    const screenReaderText = column.screenReaderFormat 
                      ? column.screenReaderFormat(value) 
                      : valueToScreenReaderText(value);
                    
                    return (
                      <TableCell 
                        key={column.id} 
                        align={column.align || 'left'}
                      >
                        {formattedValue}
                        
                        {/* Hidden text for complex values (charts, badges, etc.) */}
                        {typeof formattedValue !== 'string' && typeof formattedValue !== 'number' && (
                          <span className="sr-only">{screenReaderText}</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelDisplayedRows={({ from, to, count }) => (
          <>
            <span className="sr-only">
              {`Showing page ${page + 1} of ${Math.ceil(count / rowsPerPage)}, displaying rows ${from} to ${to} of ${count} total rows`}
            </span>
            <span aria-hidden="true">{`${from}-${to} of ${count}`}</span>
          </>
        )}
        labelRowsPerPage={
          <>
            <span aria-hidden="true">Rows per page:</span>
            <span className="sr-only">Select number of rows per page</span>
          </>
        }
        sx={{
          '& .MuiTablePagination-select': {
            paddingTop: '8px',
            paddingBottom: '8px',
          },
          '& .MuiSelect-select': {
            fontSize: accessibility.largeText ? '1.1rem' : undefined,
          },
          ...(accessibility.highContrast && {
            color: 'text.primary',
            '& .MuiSelect-select': {
              borderColor: 'text.primary',
            },
            '& .MuiSvgIcon-root': {
              color: 'text.primary',
            },
          }),
        }}
      />
    </Box>
  );
}

export default AccessibleTable;