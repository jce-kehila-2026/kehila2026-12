import {
  createBirthdayWishModel,
  createCommunityStreakModel,
} from '../communityModels';
import { communityPosts } from '../communityMockData';
import {
  createCommentModel,
  createPostModel,
  getInitialPosts,
} from '../communityInteractionHelpers';

// Temporary local placeholders for the future community Firestore service layer.
// These functions intentionally do not import Firebase or perform network/database work yet.

export async function getCommunityPosts() {
  return getInitialPosts(communityPosts);
}

export async function createCommunityPost(postData = {}) {
  return createPostModel({
    author: postData.author ?? postData.authorDisplayName ?? 'Current User',
    authorId: postData.authorId ?? postData.userId ?? null,
    content: postData.content ?? '',
    isAnonymous: Boolean(postData.isAnonymous),
    attachment: postData.attachment ?? null,
  });
}

export async function updateCommunityPost(postId, updates = {}) {
  return {
    success: true,
    postId,
    updates,
  };
}

export async function deleteCommunityPost(postId) {
  return {
    success: true,
    postId,
  };
}

export async function toggleCommunityPostLike(postId, userId) {
  return {
    success: true,
    postId,
    userId,
  };
}

export async function addCommunityPostComment(postId, commentData = {}) {
  return {
    ...createCommentModel(
      commentData.content ?? '',
      commentData.author ?? commentData.authorDisplayName ?? 'Current User',
      commentData.authorId ?? commentData.userId ?? 'current-user',
    ),
    postId,
  };
}

export async function getTodayCommunityBirthdays() {
  return [];
}

export async function sendBirthdayWish(wishData = {}) {
  return createBirthdayWishModel({
    id: wishData.id ?? `birthday-wish-${Date.now()}`,
    ...wishData,
  });
}

export async function getCommunityStreak(userId) {
  return createCommunityStreakModel({
    userId,
  });
}

export async function updateCommunityStreak(userId, streakData = {}) {
  return createCommunityStreakModel({
    userId,
    ...streakData,
    updatedAt: streakData.updatedAt ?? new Date(),
  });
}

export async function reportCommunityPost(postId, reportData = {}) {
  const reporterUserId = typeof reportData === 'string'
    ? reportData
    : reportData.reporterUserId ?? reportData.userId ?? null;

  return {
    success: true,
    postId,
    reporterUserId,
    reason: typeof reportData === 'string' ? '' : reportData.reason ?? '',
    postOwnerId: typeof reportData === 'string' ? null : reportData.postOwnerId ?? null,
    createdAt: typeof reportData === 'string' ? new Date() : reportData.createdAt ?? new Date(),
  };
}
