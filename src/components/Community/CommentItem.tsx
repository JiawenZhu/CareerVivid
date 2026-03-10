import { Trash2, User as UserIcon, Edit2, X, Check } from 'lucide-react';
import { CommunityComment } from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';

interface CommentItemProps {
  comment: CommunityComment;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string) => void;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  editValue: string;
  onEditChange: (value: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onDelete, 
  onUpdate,
  isEditing,
  onEditStart,
  onEditCancel,
  editValue,
  onEditChange
}) => {
  const { currentUser, isAdmin } = useAuth();
  const isAuthor = currentUser?.uid === comment.authorId;
  const canDelete = isAuthor || isAdmin;
  const canEdit = isAuthor;

  const formattedDate = comment.createdAt?.toDate 
    ? comment.createdAt.toDate().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date(comment.createdAt || Date.now()).toLocaleDateString();

  return (
    <div className="flex gap-3 py-5 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
      <div className="flex-shrink-0">
        {comment.authorAvatar ? (
          <img 
            src={comment.authorAvatar} 
            alt={comment.authorName} 
            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm" 
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 border border-gray-200 dark:border-gray-700">
            <UserIcon size={20} />
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              {comment.authorName}
            </span>
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-tight">
              {formattedDate}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {canEdit && !isEditing && (
              <button
                onClick={onEditStart}
                className="p-1.5 text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Edit Comment"
              >
                <Edit2 size={13} />
              </button>
            )}
            {canDelete && !isEditing && (
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete Comment"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white min-h-[80px] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={onEditCancel}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                title="Cancel"
              >
                <X size={16} />
              </button>
              <button
                onClick={() => onUpdate(comment.id)}
                disabled={!editValue.trim()}
                className="p-1.5 rounded-md bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50"
                title="Save Changes"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
