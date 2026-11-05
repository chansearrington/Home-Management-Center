# Fleet panel integration

The `fleet` branch tracks the panel bundled with the deployed Home 1.1.1 generation,
starting at upstream `3813264ca89b1fa46922f863a339c193a5ab33e6`. Keep unrelated upstream
UI upgrades separate from fleet fixes. The backend fork is
`chansearrington/CLIProxyAPIHome`; its current API contract is authoritative.

The credential reconnect flow requires Home's `reconnect_supported` field. It uses a
DB-backed OAuth session bound to the selected existing credential. Never emulate this
by deleting an account, matching records by display name, or adding a replacement record.

Build and test on Ark. The deployed panel is embedded in the Home executable; uploading
frontend source alone does not update the UI. Use the locked dependencies and record the
panel commit and generated asset manifest alongside each Home candidate. Production Home
cutovers follow the backend fork's fleet guard, backup, review, and deployment procedure.
