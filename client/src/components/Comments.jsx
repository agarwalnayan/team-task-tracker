import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { extractData } from '../utils/extractData';

export default function Comments({ taskId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/comments/task/${taskId}`);
      setComments(extractData(response));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/api/comments/task/${taskId}`, {
        content: newComment
      });
      // Extract actual comment data from response wrapper
      const newCommentData = response.data || response;
      setComments([newCommentData, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none transition-all"
          rows="3"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Post Comment
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {Array.isArray(comments) && comments.map((comment) => (
          <div key={comment._id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  {(comment.author?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900 dark:text-white">
                    {comment.author?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    {comment.edited && ' (edited)'}
                  </p>
                </div>
              </div>
              {comment.author?._id === user?._id && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}