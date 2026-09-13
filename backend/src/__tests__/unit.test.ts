import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NoShowScorer } from '../services/NoShowScorer.js';
import { ChurnScorer } from '../services/ChurnScorer.js';
import { WhatsAppService } from '../services/WhatsAppService.js';
import { encryptText, decryptText } from '../lib/crypto.js';

describe('Crypto Utilities Unit Tests', () => {
  it('should correctly encrypt and decrypt plain text', () => {
    const plainText = 'my-secret-waba-token-12345';
    const encrypted = encryptText(plainText);
    assert.notStrictEqual(encrypted, plainText);

    const decrypted = decryptText(encrypted);
    assert.strictEqual(decrypted, plainText);
  });

  it('should return empty string as-is', () => {
    assert.strictEqual(encryptText(''), '');
  });

  it('should throw error when decrypting invalid payload', () => {
    assert.throws(() => {
      decryptText('invalid-base64');
    });
  });
});

describe('WhatsAppService Phone Formatter Unit Tests', () => {
  const service = new WhatsAppService({
    provider: '360dialog',
    phoneNumberId: '12345',
    accessToken: 'test-token'
  });

  it('should convert local SA 0-prefixed numbers to international format', () => {
    assert.strictEqual(service.formatPhoneNumber('0831234567'), '+27831234567');
  });

  it('should leave already formatted numbers starting with + intact', () => {
    assert.strictEqual(service.formatPhoneNumber('+27831234567'), '+27831234567');
  });
});

describe('NoShowScorer Pure Logic Unit Tests', () => {
  const scorer = new NoShowScorer();

  it('should score high risk for last-minute booking with high no-show history', () => {
    const result = scorer.calculateRisk({
      bookingLeadTime: 1, // <2h -> +25
      memberNoShowHistory: 0.8, // 80% -> +24
      memberBookingCount: 2, // <5 -> +15
      dayOfWeek: 1,
      timeOfDay: 6, // morning -> +8
      membershipType: 'drop-in', // -> +20
      classType: 'yoga',
      daysSinceLastAttendance: 30, // >21d -> +12
      hasCompletedPayment: false // -> +10
    });

    assert.ok(result.score >= 60, `Expected score >= 60, got ${result.score}`);
    assert.strictEqual(result.atRisk, true);
  });

  it('should score low risk for regular active annual member', () => {
    const result = scorer.calculateRisk({
      bookingLeadTime: 48,
      memberNoShowHistory: 0,
      memberBookingCount: 50,
      dayOfWeek: 3,
      timeOfDay: 10,
      membershipType: 'annual',
      classType: 'pilates',
      daysSinceLastAttendance: 2,
      hasCompletedPayment: true
    });

    assert.ok(result.score < 60, `Expected score < 60, got ${result.score}`);
    assert.strictEqual(result.atRisk, false);
  });
});

describe('ChurnScorer Pure Logic Unit Tests', () => {
  const churn = new ChurnScorer('test-studio');

  it('should classify critical risk when member has been absent for >21 days and dropped attendance rate', () => {
    const result = churn.calculateChurnRisk({
      daysSinceLastAttendance: 25, // +35
      attendanceRateLast30Days: 0.1,
      attendanceRateLast90Days: 0.8, // drop > 0.4 -> +20
      membershipDaysRemaining: 10,
      lifetimeClassCount: 5, // <10 -> +10
      avgWeeklyAttendance: 0.2,
      missedClassesInRow: 3, // -> +15
      hasOpenedAppLast14Days: false, // -> +10
      paymentFailures: 1 // -> +8
    });

    assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`);
    assert.strictEqual(result.riskLevel, 'critical');
  });

  it('should classify low risk when member is regularly attending', () => {
    const result = churn.calculateChurnRisk({
      daysSinceLastAttendance: 2,
      attendanceRateLast30Days: 0.9,
      attendanceRateLast90Days: 0.9,
      membershipDaysRemaining: 180,
      lifetimeClassCount: 40,
      avgWeeklyAttendance: 3,
      missedClassesInRow: 0,
      hasOpenedAppLast14Days: true,
      paymentFailures: 0
    });

    assert.ok(result.score < 50, `Expected score < 50, got ${result.score}`);
    assert.strictEqual(result.riskLevel, 'low');
  });
});
