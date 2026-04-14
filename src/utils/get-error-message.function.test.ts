import { getErrorMessage } from './get-error-message.function';

describe('getErrorMessage', () => {
  it('returns the message from an Error instance', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns the string when the error is a string', () => {
    expect(getErrorMessage('failure')).toBe('failure');
  });

  it('stringifies objects and arrays', () => {
    expect(getErrorMessage({ code: 'E_FAIL' })).toBe('{"code":"E_FAIL"}');
    expect(getErrorMessage(['a', 'b'])).toBe('["a","b"]');
  });

  it('returns a fallback message for unsupported primitive types', () => {
    expect(getErrorMessage(42)).toBe('Unknown error');
    expect(getErrorMessage(undefined)).toBe('Unknown error');
  });
});
