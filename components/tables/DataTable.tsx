export type Column<T> = {
  header: string
  accessor: keyof T
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
}

export default function DataTable<T>({
  columns,
  data,
}: DataTableProps<T>) {
  return (
    <table className="min-w-full border-collapse text-sm">
      <thead>
        <tr className="text-left text-zinc-300 border-b border-white/10">
          {columns.map((col) => (
            <th
              key={String(col.accessor)}
              className="px-6 py-3 font-semibold"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, i) => (
          <tr
            key={i}
            className="border-b border-white/5 hover:bg-white/5 text-zinc-200"
          >
            {columns.map((col) => (
              <td
                key={String(col.accessor)}
                className="px-6 py-3"
              >
                {String(row[col.accessor])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}