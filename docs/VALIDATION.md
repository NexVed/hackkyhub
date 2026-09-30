# Local deployment validation

Checked on 30 September 2026 against the current working tree.

| Check | Result |
| --- | --- |
| Frontend lint | Passed; 0 errors, 14 existing warnings |
| Frontend TypeScript | Passed |
| Frontend tests | 19 passed across 5 files |
| Next.js production/standalone build | Passed, including `/api/health` |
| Standalone server smoke checks | Local `/api/health` and `/api/dashboard/stats` both returned 200 |
| Backend tests | 34 passed, including authentication, destination guards, Kafka retry/commit/DLQ behavior and optional monitoring |
| Python compile checks | Passed |
| Terraform formatting | Passed |
| Terraform bootstrap validation | Passed using Terraform 1.13.5 and AWS provider 6.66.0 |
| Terraform application stack validation | Passed with EKS module 21.26.0, including IAM/runner configuration |
| Kubernetes staging/production rendering | Passed using local Kustomize via kubectl |
| Compose rendering | Passed without resolving local secret files |
| Workflow, monitoring and optional worker YAML | Parsed successfully |

Terraform dependencies were downloaded and checksum-verified; validation used
`init -backend=false`. No Terraform plan against an AWS account or cloud apply
was performed. Rendering checks do not validate live controllers or IAM access.

The Docker Linux engine is not running on this computer, so container builds,
image scans and runtime checks remain unverified. The CI/CD workflows have not
been executed on GitHub. Live Sentry, Kafka, Redis, cloud provisioning, production
authentication, backups, load tests and rollback drills require the operator's
accounts/configuration and the staging launch checklist.

Python tests emit an installed Starlette test-client deprecation warning; this
does not fail the tests. Python dependencies currently use ranges: generate a
Linux/Python 3.12 lock file and pass the configured audits before deployment.

The optional Kafka tests use mocked clients to verify offset handling; they do
not prove delivery to a real broker. The Next.js Sentry files are activation
templates and are not yet installed in the application.
