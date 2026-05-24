import { isAuthorFollowed } from './communityModerationUtils';

export const getPostCreatedAtTime = (post = {}) => {
  const createdAt = post.createdAt instanceof Date
    ? post.createdAt
    : new Date(post.createdAt ?? 0);
  const timestamp = createdAt.getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const filterPostsByTab = (posts, activeTab, followedAuthors = []) => posts.filter((post) => {
  if (activeTab === 'following') return isAuthorFollowed(post, followedAuthors);
  if (activeTab === 'anonymous') return post.isAnonymous === true;

  return true;
});

export const sortFeedPosts = (posts) => posts
  .map((post, index) => ({ post, index }))
  .sort((firstPost, secondPost) => {
    const dateDifference = getPostCreatedAtTime(secondPost.post) - getPostCreatedAtTime(firstPost.post);
    if (dateDifference !== 0) return dateDifference;

    return firstPost.index - secondPost.index;
  })
  .map(({ post }) => post);

export const getEmptyFeedMessage = (activeTab, followedAuthorsCount = 0) => {
  if (activeTab === 'following') {
    if (followedAuthorsCount === 0) {
      return {
        title: 'No followed authors yet',
        description: 'Use the Follow button on posts to build a local following feed on this device.',
      };
    }

    return {
      title: 'No posts from followed authors yet',
      description: 'Posts from authors you follow locally will appear here.',
    };
  }

  if (activeTab === 'anonymous') {
    return {
      title: 'No anonymous posts yet',
      description: 'Anonymous shares will appear here when members choose that option.',
    };
  }

  return {
    title: 'No posts yet',
    description: 'Be the first to share something with the community.',
  };
};
