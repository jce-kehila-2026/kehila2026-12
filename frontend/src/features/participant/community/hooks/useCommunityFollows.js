import { useEffect, useState } from 'react';
import {
  loadStoredFollowedAuthors,
  saveStoredFollowedAuthors,
} from '../services/communityStorageService';
import {
  getFollowAuthorKey,
  isAuthorCurrentUser,
  isAuthorFollowed,
} from '../utils/communityModerationUtils';

export default function useCommunityFollows({
  communityDisplayName,
  localUserId,
}) {
  const [followedAuthors, setFollowedAuthors] = useState(loadStoredFollowedAuthors);

  const localUserName = communityDisplayName || 'Current User';

  useEffect(() => {
    saveStoredFollowedAuthors(followedAuthors);
  }, [followedAuthors]);

  const handleToggleFollowAuthor = (post) => {
    if (!post || post.isAnonymous || post.author === 'Anonymous User' || post.author === 'Anonymous Participant') return;
    if (isAuthorCurrentUser(post, localUserId, localUserName)) return;

    const authorKey = getFollowAuthorKey(post);
    if (!authorKey) return;

    setFollowedAuthors((currentAuthors) => (
      isAuthorFollowed(post, currentAuthors)
        ? currentAuthors.filter((currentAuthor) => (
          currentAuthor !== authorKey && currentAuthor !== post.author
        ))
        : [...currentAuthors, authorKey]
    ));
  };

  return {
    followedAuthors,
    setFollowedAuthors,
    handleToggleFollowAuthor,
  };
}
