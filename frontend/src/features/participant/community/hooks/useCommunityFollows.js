import { useEffect, useState } from 'react';
import {
  followCommunityAuthor,
  getFollowedAuthors,
  unfollowCommunityAuthor,
} from '../services/communityService';
import {
  getFollowAuthorKey,
  isAuthorCurrentUser,
  isAuthorFollowed,
} from '../utils/communityModerationUtils';

const isRealUserId = (uid) => Boolean(uid) && uid !== 'current-user';

export default function useCommunityFollows({
  communityDisplayName,
  localUserId,
}) {
  const [followedAuthors, setFollowedAuthors] = useState([]);

  const localUserName = communityDisplayName || 'Current User';

  useEffect(() => {
    if (!isRealUserId(localUserId)) return;
    let cancelled = false;

    getFollowedAuthors(localUserId).then((authors) => {
      if (!cancelled && Array.isArray(authors)) {
        setFollowedAuthors(authors);
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [localUserId]);

  const handleToggleFollowAuthor = (post) => {
    if (!post || post.isAnonymous || post.author === 'Anonymous User' || post.author === 'Anonymous Participant') return;
    if (isAuthorCurrentUser(post, localUserId, localUserName)) return;

    const authorKey = getFollowAuthorKey(post);
    if (!authorKey) return;

    const isFollowed = isAuthorFollowed(post, followedAuthors);

    setFollowedAuthors((currentAuthors) => (
      isFollowed
        ? currentAuthors.filter((key) => key !== authorKey && key !== post.author)
        : [...currentAuthors, authorKey]
    ));

    if (isRealUserId(localUserId)) {
      const authorUid = post.authorId || authorKey;
      if (isFollowed) {
        unfollowCommunityAuthor(localUserId, authorUid).catch(() => {});
      } else {
        followCommunityAuthor(localUserId, authorUid, { actorName: localUserName }).catch(() => {});
      }
    }
  };

  return {
    followedAuthors,
    setFollowedAuthors,
    handleToggleFollowAuthor,
  };
}
