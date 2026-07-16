# Task 036-B0RL Local Offline JSZip Vendor Creation Report

## 요약

Task 036-B0RL은 기존 local packaging output에서 승인된 `jszip@3.10.1` 후보를 찾아 repository-pinned offline vendor package로 고정했다. 공식 GitHub fallback은 사용하지 않았다.

## 시작 조건

- Branch: `agent/task036-hwp-hwpx-template-fidelity-selector-execution-bridge`
- Start HEAD: `2b7c163d63c2328f405a6127be969c59fa8f7271`
- Worktree: `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\task036-hwp-hwpx-template-fidelity-selector-execution-bridge`
- Node executable: `C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- Node version: `v24.14.0`

## Local candidate search

확인한 root:

- `C:\Users\USER\Desktop\로컬 open claw 만들기\release\army-claw-openclaw-beta\app\node_modules`
- `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp`
- `C:\Users\USER\Desktop\로컬 open claw 만들기\release`
- `C:\Users\USER\AppData\Local\npm-cache`

승인 후보:

- `release\army-claw-openclaw-beta\app\node_modules\jszip`
- package: `jszip`
- version: `3.10.1`
- source acquisition: `existing_local_packaging_or_cache`
- build-time public internet acquisition: `false`

## Exact verification

- JSZip bundle Git blob: `ff4cfd5e8fdc49176c2d1d409afa897f40be01f4`
- JSZip bundle SHA-256: `acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e`
- package.json Git blob: `3fa81de96b758c0ee9f783e2b6e696bf6b976860`
- JSZip license Git blob: `f8250b37a61862ea61ea9a93d5d423cad395a364`
- pako license Git blob: `a934ef8db478453e38b2f29af67610916fa9fc99`
- index blob after `git add`: `ff4cfd5e8fdc49176c2d1d409afa897f40be01f4`

## Created files

- `.gitattributes`
- `vendor/node/jszip/3.10.1/jszip.min.cjs`
- `vendor/node/jszip/3.10.1/JSZIP-LICENSE.markdown`
- `vendor/node/jszip/3.10.1/PAKO-LICENSE`
- `vendor/node/jszip/3.10.1/UPSTREAM-PACKAGE.json`
- `vendor/node/jszip/3.10.1/PROVENANCE.json`
- `vendor/node/jszip/3.10.1/README.md`
- `tools/hancom/prepare-offline-jszip-runtime.ps1`
- `docs/architecture/army-claw-offline-node-runtime-dependency-policy.md`

## Safety

- npm registry access: `false`
- npm install/ci/pack: `false`
- runtime public internet dependency: `false`
- upstream bundle modified: `false`
- engine/test/validator modified: `false`
- Hancom COM/native app executed: `false`
- Task 036-B1/B2 implementation started: `false`

## Status

B0RL vendor package creation is complete. B0V offline runtime validation is required before Task 036-B1/B2 may start.
