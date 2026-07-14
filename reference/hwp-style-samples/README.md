# HWP 기준 양식 샘플

이 폴더는 Army Claw의 HWPX 업무문서 양식 프로필 개발을 위해 사용자가 제공한 공개·비민감 HWP 기준 문서를 보존한다.

사용자는 두 파일이 GitHub 저장소에 업로드 가능한 공개·비민감 자료임을 확인했다. 두 번째 파일명에 포함된 `대외비` 문구는 실제 보안 분류가 아니라 공개 인터넷 문서의 제목 표현이며, 실제 보안 문서 의미가 아님을 함께 확인했다.

## 파일 매핑

| 저장소 파일명 | 원본 파일명 | SHA256 | 크기 |
| --- | --- | --- | ---: |
| `pk-table-qualification-review.hwp` | `자격심사-1. PK-Table 기반 타격자산-탄종-신관 결정 보조 알고리즘 제작(대대7과  5.7. 수정) (1) (2).hwp` | `631B015F9BA2F53390D756353C76597252C55852407F477ED4E283DB914C979D` | 1,952,256 bytes |
| `official-action-plan-sample.hwp` | `20xx0101_대외비_청계산등산계획.hwp` | `EC06ACCC2A0593D7A07005381C1515DD6C895E9D09434B44A49271D0CE05EB46` | 1,342,976 bytes |

## 사용 목적

- HWP 문서 구조, 양식, 표 스타일, 페이지 구성 분석
- HWP를 한글 2024 Automation으로 HWPX로 변환한 뒤 구조 manifest 생성
- `qualification_review_booklet` 및 `official_action_plan` 프로필 구현 기준 수립

## 제한

- 원본 HWP 바이너리를 직접 수정하지 않는다.
- 원본 본문 전체를 자동 생성 결과로 복제하는 것이 목적이 아니다.
- 변환 HWPX는 `.tmp/hwp-reference-conversion/`에 생성하며 runtime 필수 파일로 취급하지 않는다.
