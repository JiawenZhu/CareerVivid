"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { blogPosts } from "../../lib/blogContent";

export function BlogIndexContent() {
  const categories = useMemo(() => ["All", ...Array.from(new Set(blogPosts.map((post) => post.category)))], []);
  const [activeCategory, setActiveCategory] = useState("All");
  const filteredPosts = activeCategory === "All" ? blogPosts : blogPosts.filter((post) => post.category === activeCategory);

  return (
    <main className="bg-white dark:bg-gray-950">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white md:text-5xl">
          Career Resources &amp; Tips
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-400">
          Expert advice to help you land your dream job.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activeCategory === category
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            No posts found. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <article key={post.slug} className="group flex cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <a href={`/blog/${post.slug}`} className="flex min-w-0 flex-col">
                  <div className="relative aspect-video overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <div className="absolute inset-0 grid place-items-center px-8 text-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{post.category}</p>
                        <p className="mt-3 text-2xl font-black leading-tight text-gray-800 dark:text-gray-100">{post.title}</p>
                      </div>
                    </div>
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900 shadow-sm backdrop-blur-sm dark:bg-black/80 dark:text-white">
                      {post.category}
                    </div>
                  </div>

                  <div className="flex grow flex-col p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Published: {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="line-clamp-2 text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-[#625bd5] dark:text-white dark:group-hover:text-[#8d88e6]">{post.title}</h2>
                    <p className="mt-4 line-clamp-3 grow text-gray-600 dark:text-gray-300">{post.description}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">By {post.author}</p>
                      <span className="flex items-center gap-1 text-sm font-semibold text-[#625bd5] dark:text-[#8d88e6]">
                        Read More <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
