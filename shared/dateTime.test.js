import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';

import {
    formatBusinessDate,
    formatBusinessTime,
    getBusinessDayBounds,
    toBusinessDateTimeIso
} from './dateTime.js';

test('converts a Sao Paulo appointment time to the same UTC instant on any server timezone', () => {
    const originalTimezone = process.env.TZ;

    try {
        for (const timezone of ['UTC', 'America/Sao_Paulo']) {
            process.env.TZ = timezone;
            assert.equal(
                toBusinessDateTimeIso('2026-09-30', '10:00'),
                '2026-09-30T13:00:00.000Z'
            );
        }
    } finally {
        if (originalTimezone === undefined) {
            delete process.env.TZ;
        } else {
            process.env.TZ = originalTimezone;
        }
    }
});

test('returns the UTC interval matching a Sao Paulo calendar day', () => {
    const bounds = getBusinessDayBounds('2026-09-30');

    assert.equal(bounds.start.toISOString(), '2026-09-30T03:00:00.000Z');
    assert.equal(bounds.endExclusive.toISOString(), '2026-10-01T03:00:00.000Z');
});

test('formats appointment dates and times in Sao Paulo regardless of browser timezone', () => {
    const appointment = '2026-09-30T13:00:00.000Z';

    assert.equal(formatBusinessTime(appointment), '10:00');
    assert.equal(formatBusinessDate(appointment), '30/09/2026');
});