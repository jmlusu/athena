import React from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white border border-[#E2E8F0] rounded-lg">
      <div className="text-xs font-mono text-[#64748B]">
        Showing <span className="font-bold text-[#18181B]">{start.toLocaleString()}</span>–{" "}
        <span className="font-bold text-[#18181B]">{end.toLocaleString()}</span> of{" "}
        <span className="font-bold text-[#18181B]">{total.toLocaleString()}</span> items
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2.5 py-1.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-xs text-[#18181B] font-mono"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>

        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2.5 py-1.5 text-xs font-mono rounded-md border border-[#E2E8F0] bg-white text-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F5F7] transition-colors"
        >
          Prev
        </button>

        <span className="text-xs font-mono text-[#64748B] px-2">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 text-xs font-mono rounded-md border border-[#E2E8F0] bg-white text-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F4F5F7] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};