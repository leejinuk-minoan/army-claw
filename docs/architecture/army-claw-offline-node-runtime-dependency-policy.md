# Army Claw Offline Node Runtime Dependency Policy

Task 036 uses a repository-pinned JSZip runtime bundle so HWPX template-fidelity tests can run offline without `npm install` or a tracked `node_modules` tree.

## JSZip pin

- Package: JSZip
- Version: 3.10.1
- Upstream repository: Stuk/jszip
- Upstream ref: v3.10.1
- Upstream path: dist/jszip.min.js
- Git blob SHA: ff4cfd5e8fdc49176c2d1d409afa897f40be01f4
- SHA-256: acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e
- Selected license: MIT

## Third-party notice

JSZip's distributed bundle includes pako 1.0.11. The pako MIT license text is retained in `vendor/node/jszip/3.10.1/PAKO-LICENSE`.

## Runtime policy

- npm registry is not used.
- package managers are not used for this pinned runtime.
- runtime network access is not required.
- `node_modules` is not tracked because it is a generated runtime shape.
- Runtime materialization is limited to ignored `.tmp` output.
- Upgrade requires a separate task, a new version directory, and fresh blob/SHA/license verification.
