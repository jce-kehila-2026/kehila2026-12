import {
  createBirthdayWishModel,
  createCommunityStreakModel,
  createCommunityUserProfileModel,
} from '../communityModels';
import { communityPosts } from '../communityMockData';
import {
  createCommentModel,
  createPostModel,
  getInitialCommunityUserProfile,
  getInitialPosts,
} from '../communityInteractionHelpers';
import { loadStoredFollowedAuthors } from './communityStorageService';

// Local Community adapter.
// This module is the main Community API surface. It currently returns local/mock
// data and local model objects, and can later be replaced internally with
// Firestore calls without changing component imports.

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

export async function toggleCommunityPostSupport(postId, userId) {
  return {
    success: true,
    postId,
    userId,
  };
}

export async function createCommunityComment(postId, commentData = {}) {
  return {
    ...createCommentModel(
      commentData.content ?? '',
      commentData.author ?? commentData.authorDisplayName ?? 'Current User',
      commentData.authorId ?? commentData.userId ?? 'current-user',
    ),
    postId,
  };
}

export async function addCommunityPostComment(postId, commentData = {}) {
  return createCommunityComment(postId, commentData);
}

export async function deleteCommunityComment(postId, commentId) {
  return {
    success: true,
    postId,
    commentId,
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

export async function getCommunityProfile() {
  return getInitialCommunityUserProfile();
}

export async function updateCommunityProfile(profileData = {}) {
  return createCommunityUserProfileModel(profileData);
}

export async function getFollowedAuthors() {
  return loadStoredFollowedAuthors();
}

export async function followCommunityAuthor(currentFollowedAuthors = [], authorKey) {
  if (!authorKey) return currentFollowedAuthors;
  if (currentFollowedAuthors.includes(authorKey)) return currentFollowedAuthors;

  return [...currentFollowedAuthors, authorKey];
}

export async function unfollowCommunityAuthor(currentFollowedAuthors = [], authorKeys = []) {
  const keysToRemove = Array.isArray(authorKeys) ? authorKeys : [authorKeys];
  return currentFollowedAuthors.filter((authorKey) => !keysToRemove.includes(authorKey));
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
