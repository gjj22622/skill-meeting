'use client';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, reviewCount, size = 'sm' }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const fontSize = size === 'sm' ? '0.875rem' : '1.1rem';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize }}>
      {'★'.repeat(fullStars)}
      {hasHalf && '½'}
      {'☆'.repeat(emptyStars)}
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em', marginLeft: '0.25rem' }}>
        {rating.toFixed(1)}
        {reviewCount !== undefined && ` (${reviewCount})`}
      </span>
    </span>
  );
}
