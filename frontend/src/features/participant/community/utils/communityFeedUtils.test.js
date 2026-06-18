import { describe, expect, it } from 'vitest';
import { filterPostsByTab } from './communityFeedUtils';

describe('filterPostsByTab', () => {
  it('hides anonymous posts from the following feed even when the author is followed', () => {
    const posts = [
      {
        id: 'visible-followed-post',
        authorId: 'author-1',
        author: 'Followed Member',
        isAnonymous: false,
      },
      {
        id: 'private-anonymous-post',
        authorId: 'author-1',
        author: 'Anonymous User',
        isAnonymous: true,
      },
    ];

    const filteredPosts = filterPostsByTab(posts, 'following', ['author-1']);

    expect(filteredPosts).toEqual([posts[0]]);
  });
});
