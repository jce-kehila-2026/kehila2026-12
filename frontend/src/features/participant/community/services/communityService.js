import {
  createBirthdayWishModel,
  createCommunityCommentModel,
  createCommunityPostModel,
  createCommunityStreakModel,
} from '../communityModels';

const createPlaceholderId = (prefix) => `${prefix}-${Date.now()}`;

// Temporary local placeholders for the future community Firestore service layer.
// These functions intentionally do not import Firebase or perform network/database work yet.

export async function getCommunityPosts() {
  return [];
}

export async function createCommunityPost(postData = {}) {
  return createCommunityPostModel({
    id: postData.id ?? createPlaceholderId('community-post'),
    ...postData,
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
  return createCommunityCommentModel({
    id: commentData.id ?? createPlaceholderId('community-comment'),
    postId,
    ...commentData,
  });
}

export async function getTodayCommunityBirthdays() {
  return [];
}

export async function sendBirthdayWish(wishData = {}) {
  return createBirthdayWishModel({
    id: wishData.id ?? createPlaceholderId('birthday-wish'),
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

export async function reportCommunityPost(postId, userId, reason = '') {
  return {
    success: true,
    postId,
    userId,
    reason,
  };
}
