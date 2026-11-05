import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { beforeAll, expect, test } from 'bun:test'
import { createInstance } from 'i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'

import { Sheet } from '@/components/ui/sheet'
import { CredentialDetailDrawer } from '@/features/credentials/credential-detail-drawer'
import type { CredentialResource } from '@/lib/api/management/credentials'
import { en } from '@/lib/i18n/locales/en'

const testI18n = createInstance()
beforeAll(async () => {
  await testI18n
    .use(initReactI18next)
    .init({ resources: { en }, lng: 'en', defaultNS: 'common', react: { useSuspense: false } })
})

function renderDrawer(supported: boolean) {
  const resource = {
    id: 'original-id',
    identifier: 'original-id',
    provider: 'claude',
    type: 'claude',
    label: 'Original account',
    disabled: true,
    unavailable: true,
    status: 'disabled',
    statusMessage: 'unauthorized',
    reconnectSupported: supported,
    reauthRequired: true,
    metadataAvailability: { prefix: false, proxyUrl: false, websockets: false },
    maxInFlightByModel: {},
    priority: 10,
    raw: {},
    selector: {},
  } as CredentialResource
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={testI18n}>
        <Sheet open>
          <CredentialDetailDrawer
            resource={resource}
            open
            tab="overview"
            mutating={false}
            models={null}
            quotaEntry={null}
            showConcurrency={false}
            observationAvailable={false}
            canEditConcurrency={false}
            inFlightSummary={null}
            inFlightObservation={null}
            concurrencyPending={false}
            concurrencyStale={false}
            concurrencyErrorMessage={null}
            onTabChange={() => undefined}
            onUpdateMetadata={async () => undefined}
            onToggleStatus={async () => undefined}
            onFetchModels={async () => undefined}
            onDownload={async () => undefined}
            onDelete={() => undefined}
            onReconnect={() => undefined}
          />
        </Sheet>
      </I18nextProvider>
    </QueryClientProvider>,
  )
}

test('account drawer explains the sign-in failure and offers reconnect when supported', () => {
  const markup = renderDrawer(true)
  expect(markup).toContain('This account needs a new sign-in')
  expect(markup).toContain('Reconnect</button>')
})

test('older backends cannot expose a reconnect action that would create a duplicate', () => {
  expect(renderDrawer(false)).not.toContain('Reconnect</button>')
})
