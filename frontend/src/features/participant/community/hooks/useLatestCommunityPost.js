import { useEffect, useState } from 'react';
import { formatRelativeCommunityTime } from '../utils/communityDateUtils';
import { subscribeToLatestCommunityPost } from '../services/communityService';

/**
 * Real-time latest visible community post for dashboard highlight cards.
 */
export default function useLatestCommunityPost() {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [relativeTimeNow, setRelativeTimeNow] = useState(() => new Date());

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const unsubscribe = subscribeToLatestCommunityPost(
      (latestPost) => {
        setPost(latestPost);
        setIsLoading(false);
        setHasError(false);
        setRelativeTimeNow(new Date());
      },
      () => {
        setPost(null);
        setIsLoading(false);
        setHasError(true);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRelativeTimeNow(new Date());
    }, 30000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const relativeTime = post
    ? formatRelativeCommunityTime(post.createdAt, relativeTimeNow)
    : '';

  return {
    post,
    isLoading,
    hasError,
    relativeTime,
  };
}
