import React, { useState } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { useComments, useCommunity } from '../../hooks/useCommunity';
import CommentItem from './CommentItem';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { comments, loading: loadingComments } = useComments(postId);
  const { addComment, deleteComment, updateComment } = useCommunity();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || !currentUser) return;

    setIsSubmitting(true);
    try {
      await addComment(postId, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(postId, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="mt-12 bg-white dark:bg-[#0d1117] rounded-2xl border border-gray-200 dark:border-gray-800/60 p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="text-primary-500" size={24} />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Post Comment Input */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Me" 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-sm font-bold">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-grow relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
              <div className="absolute bottom-3 right-3">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-4 bg-gray-50 dark:bg-[#161b22] rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Please <a href="/login" className="text-primary-500 hover:underline font-semibold">sign in</a> to join the conversation.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loadingComments ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                isEditing={editingId === comment.id}
                onEditStart={() => {
                  setEditingId(comment.id);
                  setEditContent(comment.content);
                }}
                onEditCancel={() => {
                  setEditingId(null);
                  setEditContent('');
                }}
                editValue={editContent}
                onEditChange={setEditContent}
              />
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
