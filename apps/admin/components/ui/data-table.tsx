import type { ReactNode } from 'react';
export function DataTable<T>({ rows, columns, rowKey, caption }: {
    rows: T[];
    columns: {
        label: string;
        render: (row: T) => ReactNode;
    }[];
    rowKey: (row: T) => string;
    caption: string;
}) { return <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}><table><caption className="sr-only">{caption}</caption><thead><tr>{columns.map(c => <th key={c.label} scope="col">{c.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(c => <td key={c.label}>{c.render(row)}</td>)}</tr>)}</tbody></table></div>; }
