import { describe, expect, test } from 'bun:test'

import {
  isCredentialOAuthFailure,
  isCredentialOAuthSuccess,
  normalizeCredentialOAuthStatus,
  resolveCredentialOAuthCallbackState,
  settleCredentialOAuthStart,
} from '../src/features/credentials/credential-oauth-flow'

test('closing or superseding a pending reconnect cancels its late session instead of publishing it', async () => {
  let resolveStart!: (value: { state: string; url: string }) => void
  const start = new Promise<{ state: string; url: string }>((resolve) => {
    resolveStart = resolve
  })
  let current = true
  const cancelled: string[] = []
  const pending = settleCredentialOAuthStart(
    start,
    () => current,
    async (state) => {
      cancelled.push(state)
    },
  )
  current = false
  resolveStart({ state: 'late-reconnect', url: 'https://provider.test/authorize' })
  expect(await pending).toBeNull()
  expect(cancelled).toEqual(['late-reconnect'])
})

test('a current reconnect is published without cancelling it', async () => {
  const started = { state: 'current-reconnect', url: 'https://provider.test/authorize' }
  let cancelled = false
  const result = await settleCredentialOAuthStart(
    Promise.resolve(started),
    () => true,
    async () => {
      cancelled = true
    },
  )
  expect(result).toEqual(started)
  expect(cancelled).toBe(false)
})

describe('credential OAuth flow helpers', () => {
  test('normalizes backend status values', () => {
    expect(normalizeCredentialOAuthStatus(' ok ')).toBe('ok')
    expect(normalizeCredentialOAuthStatus('WAIT')).toBe('wait')
    expect(normalizeCredentialOAuthStatus('Error')).toBe('error')
    expect(normalizeCredentialOAuthStatus('')).toBe('unknown')
    expect(normalizeCredentialOAuthStatus(null)).toBe('unknown')
    expect(normalizeCredentialOAuthStatus(undefined)).toBe('unknown')
  })

  test('classifies terminal statuses', () => {
    expect(isCredentialOAuthSuccess('ok')).toBe(true)
    expect(isCredentialOAuthSuccess('wait')).toBe(false)
    expect(isCredentialOAuthSuccess(null)).toBe(false)
    expect(isCredentialOAuthFailure('error')).toBe(true)
    expect(isCredentialOAuthFailure('ERROR')).toBe(true)
    expect(isCredentialOAuthFailure('wait')).toBe(false)
  })

  test('prefers the explicit state field for polling', () => {
    expect(
      resolveCredentialOAuthCallbackState({
        state: '  state-from-field  ',
        redirectUrl: 'http://localhost/callback?code=abc&state=state-from-url',
      }),
    ).toBe('state-from-field')
  })

  test('extracts the state from a pasted redirect URL', () => {
    expect(
      resolveCredentialOAuthCallbackState({
        state: '',
        redirectUrl: 'http://localhost/callback?code=abc&state=url-state',
      }),
    ).toBe('url-state')
    expect(
      resolveCredentialOAuthCallbackState({
        state: '   ',
        redirectUrl: 'http://localhost/callback#state=fragment-state&code=abc',
      }),
    ).toBe('fragment-state')
    expect(
      resolveCredentialOAuthCallbackState({
        state: '',
        redirectUrl: 'http://localhost/callback?state=encoded%20state',
      }),
    ).toBe('encoded state')
  })

  test('returns an empty state when the redirect URL carries none', () => {
    expect(
      resolveCredentialOAuthCallbackState({
        state: '',
        redirectUrl: 'http://localhost/callback?code=abc',
      }),
    ).toBe('')
    expect(resolveCredentialOAuthCallbackState({ state: '', redirectUrl: '' })).toBe('')
  })

  test('keeps malformed encoded state instead of throwing', () => {
    expect(
      resolveCredentialOAuthCallbackState({
        state: '',
        redirectUrl: 'http://localhost/callback?state=%E0%A4%A',
      }),
    ).toBe('%E0%A4%A')
  })
})
