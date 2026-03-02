type Column<T> = {
  header: string
  accessor: keyof T
}

type Props<T> = {
  columns: Column<T>[]
  data: T[]
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
}: Props<T>) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.accessor)}
                className="text-left p-4 text-zinc-400 font-medium"
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
              className="border-t border-zinc-800 hover:bg-zinc-900/50"
            >
              {columns.map((col) => (
                <td key={String(col.accessor)} className="p-4">
                  {String(row[col.accessor] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}