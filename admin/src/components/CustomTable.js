import React, { useState } from 'react';
import { useTable, usePagination, useSortBy } from 'react-table';
import Modal from 'react-modal';
import styles from '../styles/CustomTable.module.css';

const CustomTable = ({ columns, data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const defaultColumn = React.useMemo(
    () => ({
      // Default Filter and other properties can be added here
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    usePagination
  );

  const handleViewMore = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const renderCellContent = (content) => {
    if (typeof content === 'string') {
      if(content.startsWith("data:image/png;base64")){
        return (
          <a href="#" onClick={(e) => { e.preventDefault(); handleViewMore(content); }} className={styles.viewMoreLink}>View Signature</a>
        )
      }else{
        if (content.length > 100) {
          const shortContent = content.substring(0, 100);
          return (
            <>
              {shortContent}... 
              <a href="#" onClick={(e) => { e.preventDefault(); handleViewMore(content); }} className={styles.viewMoreLink}>View More</a>
            </>
          );
        }
        if (/<\/?[a-z][\s\S]*>/i.test(content)) {
          // Check if content is HTML
          return <div dangerouslySetInnerHTML={{ __html: content }} />;
        }
      } 
    }
    return content;
  };

  return (
    <div className={styles['table-container']}>
      <table {...getTableProps()} className={styles.table}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())} className={styles.header}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()} className={styles.cell}>
                    {renderCellContent(cell.value)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={columns.length}>
              <div className={styles.pagination}>
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                  {'<<'}
                </button>
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                  {'<'}
                </button>
                <button onClick={() => nextPage()} disabled={!canNextPage}>
                  {'>'}
                </button>
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                  {'>>'}
                </button>
                <span>
                  Page{' '}
                  <strong>
                    {pageIndex + 1} of {pageOptions.length}
                  </strong>{' '}
                </span>
                <span>
                  | Go to page:{' '}
                  <input
                    type="number"
                    defaultValue={pageIndex + 1}
                    onChange={e => {
                      const page = e.target.value ? Number(e.target.value) - 1 : 0;
                      gotoPage(page);
                    }}
                    style={{ width: '50px' }}
                  />
                </span>{' '}
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {modalContent.startsWith("data:image/png;base64") ?
        (
          <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            contentLabel="Full Content"
            className={styles.modal}
            overlayClassName={styles.overlay}
          >
            <div className={styles.modalContent}>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>Close</button>
              <img 
                src={modalContent}
                alt="Player Signature"
                className={styles.signatureImage}
              />
            </div>
          </Modal>
        ):(
          <Modal
            isOpen={isModalOpen}
            onRequestClose={() => setIsModalOpen(false)}
            contentLabel="Full Content"
            className={styles.modal}
            overlayClassName={styles.overlay}
          >
            <div>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>Close</button>
              <div dangerouslySetInnerHTML={{ __html: modalContent }} />
            </div>
          </Modal>
        )
      }
    </div>
  );
};

export default CustomTable;
