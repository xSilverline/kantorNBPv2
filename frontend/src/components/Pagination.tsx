import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage <= 3) {
            return [1, 2, 3, "...", totalPages - 1, totalPages];
        }

        if (currentPage >= totalPages - 2) {
            return [1, 2, "...", totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 disabled:opacity-50"
            >
                <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {getPageNumbers().map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === "number" && onPageChange(page)}
                    className={`w-8 h-8 rounded ${currentPage === page ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
                    disabled={page === "..."}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 disabled:opacity-50"
            >
                <ChevronRightIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export default Pagination;