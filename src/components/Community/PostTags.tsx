import React from 'react';
import { navigate } from '../../utils/navigation';
import { slugifyTag } from '../../utils/tagUtils';

const TAG_COLORS = [
    'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60',
    'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
    'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
    'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60',
];

const PostTags: React.FC<{ tags?: string[]; className?: string }> = ({ tags, className = 'mb-4' }) => {
    if (!tags?.length) return null;

    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
            {tags.map((tag, index) => (
                <button key={tag} onClick={(event) => { event.stopPropagation(); navigate(`/community?tag=${slugifyTag(tag)}`); }} className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity ${TAG_COLORS[index % TAG_COLORS.length]}`}>
                    #{tag}
                </button>
            ))}
        </div>
    );
};

export default PostTags;
