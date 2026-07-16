# Vendored JSZip 3.10.1

이 디렉터리는 Task 036의 오프라인 Node 런타임 검증을 위해 고정된 JSZip 번들을 보관한다.

- Package: JSZip
- Version: 3.10.1
- Upstream: Stuk/jszip
- Ref: v3.10.1
- Source path: dist/jszip.min.js
- Git blob SHA: ff4cfd5e8fdc49176c2d1d409afa897f40be01f4
- SHA-256: acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e
- License: MIT
- Bundled notice: pako 1.0.11 MIT license retained in PAKO-LICENSE

`node_modules` 전체를 tracked하지 않고 standalone UMD/CommonJS bundle만 보관한다. 실행 시 `tools/hancom/prepare-offline-jszip-runtime.ps1`이 `.tmp` 아래에 임시 runtime `node_modules/jszip` 구조를 materialize한다.

npm registry, package manager install, runtime network access는 사용하지 않는다. 업그레이드는 별도 Task에서 새 version directory를 만들어 수행한다.
