'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-auth';
import { useCreateReview, useProductReviews } from '@/hooks/use-reviews';

export function ProductReviews({ productId }: { productId: string }) {
  const { data: user } = useCurrentUser();
  const { data: reviews, isLoading } = useProductReviews(productId);
  const createReview = useCreateReview(productId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createReview.mutateAsync({ rating, comment: comment || undefined });
      setComment('');
      setSubmitted(true);
    } catch {
      setError('You can only review a product after it has been delivered to you.');
    }
  }

  return (
    <div className="mt-10 border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold">Reviews</h2>

      {isLoading ? (
        <p className="mt-2 text-sm text-gray-500">Loading reviews...</p>
      ) : !reviews || reviews.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded border border-gray-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{review.buyer?.name ?? 'Buyer'}</span>
                <span className="text-orange-600">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              {review.comment && <p className="mt-1 text-gray-600">{review.comment}</p>}
              <p className="mt-1 text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 text-sm">
          <label className="text-xs text-gray-500">Your rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-24 rounded border border-gray-300 px-2 py-1"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? '' : 's'}
              </option>
            ))}
          </select>
          <label className="text-xs text-gray-500">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="rounded border border-gray-300 px-2 py-1"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {submitted && !error && (
            <p className="text-xs text-green-600">Thanks for your review!</p>
          )}
          <button
            type="submit"
            disabled={createReview.isPending}
            className="w-fit rounded bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {createReview.isPending ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-xs text-gray-500">Log in to leave a review after your order is delivered.</p>
      )}
    </div>
  );
}
