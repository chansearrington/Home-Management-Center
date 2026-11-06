import axios from 'axios'
import { afterEach, expect, test } from 'bun:test'

import { cancelCredentialOAuth, startCredentialOAuth } from '../src/lib/api/management/credentials'

const originalAdapter = axios.defaults.adapter
afterEach(() => {
  axios.defaults.adapter = originalAdapter
})

test('reconnect pins the target through the v8 API and cancellation uses the same API', async () => {
  const requests: Array<{ path: string; params: unknown; method: string | undefined }> = []
  axios.defaults.adapter = async (config) => {
    requests.push({
      path: new URL((config.url ?? '').replace(/^\//, ''), config.baseURL + '/').pathname,
      params: config.params,
      method: config.method,
    })
    return {
      data: { url: 'https://provider.test/authorize', state: 'fake-state' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  const session = { baseUrl: 'http://management.test', managementKey: 'fake-key' }
  await startCredentialOAuth(session, { provider: 'claude', credentialId: 'original-id' })
  expect(requests[0].path).toBe('/v8/management/oauth/auth-url')
  expect(requests[0].params).toMatchObject({ provider: 'claude', credential_id: 'original-id' })
  await cancelCredentialOAuth(session, 'fake-state')
  expect(requests[1]).toMatchObject({
    path: '/v8/management/oauth/session',
    params: { state: 'fake-state' },
    method: 'delete',
  })
  await startCredentialOAuth(session, { provider: 'claude' })
  expect(requests[2].path).toBe('/v8/management/oauth/auth-url')
  expect(requests[2].params).toMatchObject({ provider: 'claude' })
})
