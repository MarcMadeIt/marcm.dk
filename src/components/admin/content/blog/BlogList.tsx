import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaTrash, FaFacebook, FaInstagram } from "react-icons/fa6";
import { getAllBlogs, deleteBlog } from "@/lib/server/actions";
import { useTranslation } from "react-i18next";
import { FaInfoCircle } from "react-icons/fa";
import { openSocialLink } from "@/utils/socialLinks";

interface BlogListProps {
  view: "cards" | "list";
  page: number;
  setTotal: (total: number) => void;
  blogItems: BlogItem[];
  setBlogs: React.Dispatch<React.SetStateAction<BlogItem[]>>;
}

interface BlogItem {
  id: number;
  content: string | null;
  images: string[];
  sharedFacebook?: boolean;
  sharedInstagram?: boolean;
  linkFacebook?: string;
  linkInstagram?: string;
}

const FALLBACK_IMAGE = "/demo.webp";

const BlogList = ({
  view,
  page,
  setTotal,
  blogItems,
  setBlogs,
}: BlogListProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const { blogs, total } = await getAllBlogs(page, itemsPerPage);
      setBlogs(blogs || []);
      setTotal(total);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, setTotal, setBlogs]);

  useEffect(() => {
    fetchBlogs();
  }, [page, setTotal, fetchBlogs]);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1920) {
        setItemsPerPage(8);
      } else if (width >= 1024) {
        setItemsPerPage(6);
      } else {
        setItemsPerPage(4);
      }
    };

    updateItemsPerPage();

    window.addEventListener("resize", updateItemsPerPage);

    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
    };
  }, []);

  const truncateDescription = (
    description: string | null,
    maxLength: number,
  ) => {
    if (!description || description.length <= maxLength)
      return description || "";
    return description.substring(0, maxLength) + "...";
  };

  const handleDelete = async () => {
    if (deletingBlogId !== null) {
      try {
        setDeleting(true);
        await deleteBlog(deletingBlogId);
        setDeletingBlogId(null);
        setIsModalOpen(false);
        fetchBlogs();
      } catch (error) {
        console.error("Failed to delete blog:", error);
      } finally {
        setDeleting(false);
      }
    }
  };

  const closeModal = () => {
    setDeletingBlogId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full mt-3">
      {loading ? (
        view === "cards" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-5">
            {[...Array(itemsPerPage)].map((_, index) => (
              <div
                key={index}
                className="card card-compact shadow-lg rounded-md"
              >
                <figure className="relative w-full aspect-4/3 h-56 overflow-hidden rounded-t-md">
                  <div className="skeleton w-full h-full"></div>
                </figure>
                <div className="card-body">
                  <div className="skeleton h-3 w-full mt-1"></div>
                  <div className="skeleton h-3 w-3/4 mt-1"></div>
                  <div className="card-actions justify-between items-center mt-2">
                    <div className="flex gap-2">
                      <div className="skeleton h-8 w-20"></div>
                      <div className="skeleton h-8 w-20"></div>
                    </div>
                    <div className="skeleton h-8 w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...Array(itemsPerPage)].map((_, index) => (
              <React.Fragment key={index}>
                <li>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <div className="skeleton w-14 h-14 rounded-md"></div>
                      <div className="skeleton h-4 w-48"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="skeleton h-8 w-20"></div>
                      <div className="skeleton h-8 w-20"></div>
                      <div className="skeleton h-8 w-16"></div>
                    </div>
                  </div>
                </li>
                <hr className="border-px rounded-lg border-base-200" />
              </React.Fragment>
            ))}
          </ul>
        )
      ) : blogItems.length === 0 ? (
        <div className="flex justify-center items-center h-40 w-full">
          <p className="text-gray-500">{t("no_blog")}</p>
        </div>
      ) : (
        <>
          {view === "cards" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 4xl:grid-cols-4 gap-5">
              {blogItems.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="card card-compact shadow-lg rounded-md"
                >
                  <figure className="relative w-full aspect-4/3 h-56 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      item.images.length === 1 ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={item.images[0]}
                            alt="Blog image"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            priority={itemIndex < 8}
                            loading="eager"
                          />
                        </div>
                      ) : (
                        <div className="carousel w-full h-full">
                          {item.images.map((image, index) => (
                            <div
                              key={index}
                              id={`slide${item.id}-${index}`}
                              className="carousel-item relative w-full h-full"
                            >
                              <Image
                                src={image || "/demo.png"}
                                alt={`Blog image ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                                priority={itemIndex < 8 && index === 0}
                                loading="eager"
                              />
                              {item.images.length > 1 && (
                                <div className="absolute left-2 right-2 top-1/2 flex -translate-y-1/2 transform justify-between">
                                  <button
                                    className="btn btn-circle btn-xs"
                                    onClick={() => {
                                      const prevSlide = document.getElementById(
                                        `slide${item.id}-${
                                          index === 0
                                            ? item.images.length - 1
                                            : index - 1
                                        }`,
                                      );
                                      prevSlide?.scrollIntoView({
                                        behavior: "instant",
                                        block: "nearest",
                                      });
                                    }}
                                  >
                                    ❮
                                  </button>
                                  <button
                                    className="btn btn-circle btn-xs"
                                    onClick={() => {
                                      const nextSlide = document.getElementById(
                                        `slide${item.id}-${
                                          index === item.images.length - 1
                                            ? 0
                                            : index + 1
                                        }`,
                                      );
                                      nextSlide?.scrollIntoView({
                                        behavior: "instant",
                                        block: "nearest",
                                      });
                                    }}
                                  >
                                    ❯
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="relative w-full h-full">
                        <Image
                          src={FALLBACK_IMAGE}
                          alt="Blog image"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                          priority={itemIndex < 8}
                          loading="eager"
                        />
                      </div>
                    )}
                  </figure>
                  <div className="card-body">
                    <p className="text-xs">
                      {truncateDescription(item.content, 100)}
                    </p>
                    <div className="card-actions justify-between items-center mt-2">
                      <div className="flex gap-2">
                        {item.linkFacebook && (
                          <button
                            onClick={() =>
                              openSocialLink(item.linkFacebook!, "facebook")
                            }
                            className="btn md:btn-sm"
                            title="Se Facebook opslag"
                          >
                            <FaFacebook className="text-lg  md:text-base" />
                            <span className=" font-normal text-base-content hidden md:block">
                              Facebook
                            </span>
                          </button>
                        )}
                        {item.linkInstagram && (
                          <button
                            onClick={() =>
                              openSocialLink(item.linkInstagram!, "instagram")
                            }
                            className="btn md:btn-sm"
                            title="Se Instagram opslag"
                          >
                            <FaInstagram className="text-lg  md:text-base" />
                            <span className="font-normal text-base-content hidden md:block">
                              Instagram
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn md:btn-sm"
                          onClick={() => {
                            setDeletingBlogId(item.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <FaTrash />
                          <span className="">{t("delete")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {blogItems.map((item) => (
                <React.Fragment key={item.id}>
                  <li>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <div className="relative w-14 h-14 rounded-md overflow-hidden">
                          <Image
                            src={
                              item.images && item.images.length > 0
                                ? item.images[0]
                                : FALLBACK_IMAGE
                            }
                            alt="Blog image"
                            fill
                            style={{ objectFit: "cover" }}
                            loading="eager"
                          />
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs">
                            {truncateDescription(item.content, 100)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-5 md:gap-2">
                        {item.linkFacebook && (
                          <button
                            onClick={() =>
                              openSocialLink(item.linkFacebook!, "facebook")
                            }
                            className="btn btn-sm"
                            title="Se Facebook opslag"
                          >
                            <FaFacebook className="text-[15px] md:text-base" />
                            <span className=" font-normal text-base-content hidden md:block">
                              Facebook
                            </span>
                          </button>
                        )}
                        {item.linkInstagram && (
                          <button
                            onClick={() =>
                              openSocialLink(item.linkInstagram!, "instagram")
                            }
                            className="btn btn-sm"
                            title="Se Instagram opslag"
                          >
                            <FaInstagram className="text-base" />
                            <span className="font-normal text-base-content hidden md:block">
                              Instagram
                            </span>
                          </button>
                        )}

                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setDeletingBlogId(item.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <FaTrash />
                          <span className="md:flex hidden">
                            {" "}
                            {t("delete")}{" "}
                          </span>
                        </button>
                      </div>
                    </div>
                  </li>
                  <hr className="border-px rounded-lg border-base-200" />
                </React.Fragment>
              ))}
            </ul>
          )}
        </>
      )}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {" "}
              {t("delete_blog_confirmation")}
            </h3>
            <div className="py-4">
              <p className="mb-2">{t("delete_blog_prompt")}</p>
              {deletingBlogId &&
                (blogItems.find((item) => item.id === deletingBlogId)
                  ?.linkFacebook ||
                  blogItems.find((item) => item.id === deletingBlogId)
                    ?.linkInstagram) && (
                  <div className="text-warning">
                    <div className="flex items-center gap-2 text-sm">
                      <FaInfoCircle size={17} />
                      {t("delete_blog_warning")}
                    </div>
                  </div>
                )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={closeModal}>
                {t("cancel")}
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t("deleting")}
                  </>
                ) : (
                  t("delete")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogList;
