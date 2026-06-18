import {
  isAuthorFollowed,
  isPostOwnedByCurrentUser,
} from './communityModerationUtils';

export const getPostCreatedAtTime = (post = {}) => {
  const createdAt = post.createdAt instanceof Date
    ? post.createdAt
    : new Date(post.createdAt ?? 0);
  const timestamp = createdAt.getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const filterPostsByTab = (
  posts,
  activeTab,
  followedAuthors = [],
  localUserId = '',
  localUserName = '',
) => posts.filter((post) => {
  if (activeTab === 'following') return isAuthorFollowed(post, followedAuthors);
  if (activeTab === 'my-posts') return isPostOwnedByCurrentUser(post, localUserId, localUserName);
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

// Returns participant-UI translation keys; the caller localizes them with `t`.
export const getEmptyFeedMessage = (activeTab, followedAuthorsCount = 0) => {
  if (activeTab === 'following') {
    if (followedAuthorsCount === 0) {
      return {
        titleKey: 'emptyFollowingNoneTitle',
        descriptionKey: 'emptyFollowingNoneDesc',
      };
    }

    return {
      titleKey: 'emptyFollowingTitle',
      descriptionKey: 'emptyFollowingDesc',
    };
  }

  if (activeTab === 'anonymous') {
    return {
      titleKey: 'emptyAnonymousTitle',
      descriptionKey: 'emptyAnonymousDesc',
    };
  }

  if (activeTab === 'my-posts') {
    return {
      titleKey: 'emptyMyPostsTitle',
      descriptionKey: 'emptyMyPostsDesc',
    };
  }

  return {
    titleKey: 'emptyAllTitle',
    descriptionKey: 'emptyAllDesc',
  };
};
