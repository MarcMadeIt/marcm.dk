"use client";

import React, { useState } from "react";
import { FaAngleLeft } from "react-icons/fa6";
import BlogList from "./BlogList";
import BlogPagination from "./BlogPagination";
import BlogListChange from "./BlogListChange";
import CreateBlog from "./createBlog/CreateBlog";
import { useTranslation } from "react-i18next";

// Define a type for blog items
interface BlogItem {
  id: number;
  title: string;
  content: string;
  images: string[]; // Add the 'images' property
  // Add other fields as needed
}

const Blog = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<"cards" | "list">("cards");
  const [showCreateBlog, setShowCreateBlog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [blogs, setBlogs] = useState<BlogItem[]>([]); // Use the updated type

  const fetchBlogs = async () => {
    // This will be used by the BlogList component to refresh data
  };

  const handleViewChange = (view: "cards" | "list") => {
    setView(view);
  };

  const handleBlogCreated = () => {
    setShowCreateBlog(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex flex-col md:items-start gap-7">
      {showCreateBlog ? (
        <div className="flex flex-col items-start gap-5">
          <button onClick={() => setShowCreateBlog(false)} className="btn">
            <FaAngleLeft />
            {t("back")}
          </button>
          <CreateBlog
            onBlogCreated={handleBlogCreated}
            setShowCreateBlog={setShowCreateBlog}
            fetchBlogs={fetchBlogs}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center w-full">
            <button
              onClick={() => setShowCreateBlog(true)}
              className="btn btn-primary btn-sm md:btn-md"
            >
              {t("create")} {t("blog")}
            </button>
            <BlogListChange onViewChange={handleViewChange} />
          </div>
          <BlogList
            view={view}
            blogItems={blogs}
            page={page}
            setTotal={setTotal}
            setBlogs={setBlogs}
          />
          <div className="flex w-full justify-center">
            <BlogPagination page={page} setPage={setPage} total={total} />
          </div>
        </>
      )}
      {showToast && (
        <div className="toast bottom-20 md:bottom-0 toast-end">
          <div className="alert alert-success text-neutral-content">
            <span className="text-base md:text-lg">{t("blog_created")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;
