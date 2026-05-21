export const COMMUNITY_POST_STATUS = {
  visible: 'visible',
  hidden: 'hidden',
  deleted: 'deleted',
};

export const COMMUNITY_USER_STATUS = {
  active: 'active',
  inactive: 'inactive',
  blocked: 'blocked',
};

export const createCommunityPostModel = ({
  id,
  authorId = null,
  authorDisplayName = 'Current User',
  isAnonymous = false,
  content = '',
  createdAt = new Date(),
  updatedAt = createdAt,
  likesCount = 0,
  likedBy = [],
  commentsCount = 0,
  comments = [],
  status = COMMUNITY_POST_STATUS.visible,
  reportsCount = 0,
  reportedBy = [],
  hiddenByAdmin = false,
} = {}) => ({
  id,
  authorId,
  authorDisplayName,
  isAnonymous,
  content,
  createdAt,
  updatedAt,
  likesCount,
  likedBy,
  commentsCount,
  comments,
  status,
  reportsCount,
  reportedBy,
  hiddenByAdmin,
});

export const createCommunityCommentModel = ({
  id,
  postId = null,
  authorId = null,
  authorDisplayName = 'Current User',
  content = '',
  createdAt = new Date(),
  updatedAt = createdAt,
  status = COMMUNITY_POST_STATUS.visible,
  reportsCount = 0,
  reportedBy = [],
  hiddenByAdmin = false,
} = {}) => ({
  id,
  postId,
  authorId,
  authorDisplayName,
  content,
  createdAt,
  updatedAt,
  status,
  reportsCount,
  reportedBy,
  hiddenByAdmin,
});

export const createCommunityUserProfileModel = ({
  id,
  displayName = '',
  avatarUrl = '',
  birthday = null,
  showBirthday = true,
  allowAnonymousPosting = true,
  communityJoinedAt = new Date(),
  profileCompleted = false,
  role = 'participant',
  status = COMMUNITY_USER_STATUS.active,
} = {}) => ({
  id,
  displayName,
  avatarUrl,
  birthday,
  showBirthday,
  allowAnonymousPosting,
  communityJoinedAt,
  profileCompleted,
  role,
  status,
});

export const createBirthdayWishModel = ({
  id,
  senderId = null,
  receiverId = null,
  message = '',
  isTemplateMessage = false,
  createdAt = new Date(),
} = {}) => ({
  id,
  senderId,
  receiverId,
  message,
  isTemplateMessage,
  createdAt,
});

export const createCommunityStreakModel = ({
  userId = null,
  streakCount = 0,
  lastActivityDate = null,
  updatedAt = new Date(),
} = {}) => ({
  userId,
  streakCount,
  lastActivityDate,
  updatedAt,
});
