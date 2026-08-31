import { describe, expect, it } from 'vitest';

import { printableNotice } from './notices.service.js';

describe('printable notice policy', () => {
  it('uses only approved-zone aggregate community information', () => {
    const notice = printableNotice({ name: 'Central' });

    expect(notice).toEqual({
      title: 'Central community outage notice',
      zone: 'Central',
      instructions: 'Report water, electricity, or internet outages on the community map.',
      mapUrl: '/',
      notice: 'Community-generated, unofficial outage information.',
    });
  });

  it('does not include resident or report-level fields', () => {
    expect(JSON.stringify(printableNotice({ name: 'North' }))).not.toMatch(/device|name|latitude|longitude|timestamp|reportId/i);
  });
});
