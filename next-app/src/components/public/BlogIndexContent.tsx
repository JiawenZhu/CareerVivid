"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { blogPosts } from "../../lib/blogContent";

export function BlogIndexContent() {
  const categories = useMemo(() => ["All", ...Array.from(new Set(blogPosts.map((post) => post.category)))], []);
  const [activeCategory, setActiveCategory] = useState("All");
  const filteredPosts = activeCategory === "All" ? blogPosts : blogPosts.filter((post) => post.category === activeCategory);

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a97935]">CareerVivid blog</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
          Practical notes for a clearer job search.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#665a4a]">
          Articles about building better application routines with saved job context, resume tailoring, interview preparation, and AI tools.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activeCategory === category
                  ? "bg-[#211b16] text-[#fffaf1]"
                  : "border border-[#e4d3bc] bg-[#fffaf1] text-[#665a4a] hover:border-[#caa26c]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-10 text-center text-sm font-bold text-[#665a4a]">
            No posts found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <article key={post.slug} className="group flex overflow-hidden rounded-2xl border border-[#e4d3bc] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#caa26c] hover:shadow-xl">
                <a href={`/blog/${post.slug}`} className="flex min-w-0 flex-col">
                  <div className="relative aspect-video bg-[#f7f1e7]">
                    <div className="absolute inset-0 grid place-items-center px-8 text-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a97935]">{post.category}</p>
                        <p className="mt-3 text-2xl font-black leading-tight text-[#211b16]">{post.title}</p>
                      </div>
                    </div>
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#211b16] shadow-sm">
                      {post.category}
                    </div>
                  </div>

                  <div className="flex grow flex-col p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-[#665a4a]">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-xl font-black leading-tight text-[#211b16] transition group-hover:text-[#625bd5]">{post.title}</h2>
                    <p className="mt-4 grow text-sm font-medium leading-7 text-[#665a4a]">{post.description}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-[#f0e5d5] pt-4">
                      <p className="text-xs font-bold text-[#211b16]">By {post.author}</p>
                      <span className="flex items-center gap-1 text-sm font-black text-[#625bd5]">
                        Read more <ArrowRight size={16} />
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
