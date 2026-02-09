import React from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

interface BlogPaginationProps {
  page: number;
  setPage: (page: number) => void;
  total: number;
}

const BlogPagination = ({ page, setPage, total }: BlogPaginationProps) => {
  const totalPages = Math.ceil(total / 6);

  const handlePrevious = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (total <= 6) return null;
  return (
    <div className="join bg-base-100">
      <button
        className="join-item btn bg-base-100"
        onClick={handlePrevious}
        disabled={page === 1}
      >
        <FaAngleLeft />
      </button>
      <span className="join-item btn bg-base-100">Side {page}</span>
      <button
        className="join-item btn bg-base-100"
        onClick={handleNext}
        disabled={page >= totalPages}
      >
        <FaAngleRight />
      </button>
    </div>
  );
};

export default BlogPagination;
