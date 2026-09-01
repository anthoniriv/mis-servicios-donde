import { describe, expect, it } from 'vitest';

import { siteNotice } from './content.js';

describe('site content', () => {
  it('identifies the community data as unofficial', () => {
    expect(siteNotice).toContain('no oficial');
  });
});
