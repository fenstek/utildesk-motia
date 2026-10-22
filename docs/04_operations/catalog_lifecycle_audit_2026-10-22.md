# Catalog lifecycle audit — 2026-10-22

This source-side audit records the 14 approved withdrawals and URL corrections
from the final decision set. The primary decision record is
`/home/jgdus/.local/state/utildesk-audits/gemini_4_argon_high_catalog_20261022/final-audit-decisions.json`;
the independent AGY review is in
`/home/jgdus/.local/state/utildesk-audits/gemini_4_argon_high_catalog_20261022/gemini_4_argon_high_final_review.json`.
External source checks and local source assertions are retained in the same
private audit folder; this note omits raw probe logs.

## Approved withdrawals

The active source catalog moves from 1,125 to 1,111 cards: 14 DE/EN pairs are
withdrawn. Dates below are the confirmed end-of-support/archive dates where
published. “Unsupported” means the original project is officially no longer
maintained or archived; `lumiere` is an invalid entity and has no EOL date.

| Slug | Lifecycle finding | Primary evidence |
| --- | --- | --- |
| `adobe-premiere-rush` | Support ended 2026-09-30 | [Adobe discontinuation notice](https://helpx.adobe.com/premiere-rush/premiere-rush-discontinuation.html) |
| `glitch` | Hosting/editor shut down 2025-07-08 | [Glitch service changes](https://blog.glitch.com/post/changes-are-coming-to-glitch) |
| `sora` | Sora web/app and API/models discontinued; final API/model date 2026-09-24 | [OpenAI Sora discontinuation](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) |
| `dall-e` | DALL·E 2/3 API models removed 2026-05-12; the official DALL·E GPT in ChatGPT retired 2026-08-30 | [OpenAI API deprecations](https://developers.openai.com/api/docs/deprecations); [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes) |
| `flowise` | Official sunset; EOL 2026-08-31 | [Flowise sunset](https://flowiseai.com/sunset) |
| `allennlp` | Unsupported; repository archived 2022-12-16 | [AllenNLP repository](https://github.com/allenai/allennlp) |
| `microsoft-bot-framework` | SDK support ended 2025-12-31; repository archived 2026-01-05 | [Microsoft Bot Framework SDK](https://github.com/microsoft/botframework-sdk) |
| `mycroft` | Unsupported; original repository archived 2024-09-08 | [Mycroft Core repository](https://github.com/MycroftAI/mycroft-core) |
| `ibm-watson-visual-recognition` | Service instances discontinued/deleted 2021-12-01 | [IBM Visual Recognition SDK lifecycle](https://watson-developer-cloud.github.io/node-sdk/master/classes/visualrecognitionv3.html) |
| `google-palm` | PaLM API/models decommissioned; final model date 2025-04-21 | [Google model versions](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions) |
| `continue` | Unsupported; official project says it is no longer actively maintained and is read-only; no exact EOL date | [Continue repository](https://github.com/continuedev/continue) |
| `fairseq` | Unsupported; original repository archived 2026-03-20 | [Fairseq repository](https://github.com/facebookresearch/fairseq) |
| `deepfacelab` | Unsupported; original repository archived 2024-11-13 | [DeepFaceLab repository](https://github.com/iperov/DeepFaceLab) |
| `lumiere` | Invalid entity: card describes a product not identified by its source URL; no EOL date | [Google Lumiere research page](https://lumiere-video.github.io/); [intake entity cross-check](https://www.wikidata.org/wiki/Q47085761) |

The Lumiere research page identifies a research demonstration, not the generic
available product described by the card. Its disposition is identity-based, not
a claim that the research project reached end of life.

## Approved URL corrections

These 14 URL cases were independently checked against provider sources. Thirteen
source pairs received URL changes; FaceSwap already had its correct URL.

| Slug | Correct URL / identity |
| --- | --- |
| `botpress` | https://botpress.com/ |
| `pydantic-ai` | https://pydantic.dev/docs/ai/overview/ |
| `krita` | https://krita.org/en/download/ |
| `faceswap` | https://faceswap.dev/ (already correct) |
| `mallet` | https://mimno.github.io/Mallet/ |
| `deepbrain` | https://www.aistudios.com/ |
| `transistor` | https://transistor.fm/ |
| `chorus-ai` | https://www.zoominfo.com/products/chorus |
| `graphcore-ipu` | https://www.graphcore.ai/ |
| `detox` | https://wix.github.io/Detox/ |
| `phrasee` | https://www.jacquard.com/ (Phrasee is now Jacquard) |
| `gladia` | https://www.gladia.io/ |
| `storyboarder` | https://wonderunit.com/storyboarder/ |
| `runai` | https://www.nvidia.com/en-us/software/run-ai/ |

For Run:ai, the correction points to NVIDIA’s official product page. The source
copy describes AI workload/GPU orchestration for Kubernetes; it makes no claim
about an office assistant or free/paid plans.

## Review-only and runtime alignment

The final review leaves 24 remaining doubtful candidates in review-only status;
none were automatically retired by this source update. The AGY review and final
decision record preserve cases such as temporary availability errors, announced
future sunsets, URL/entity mismatches and unverified shutdown inferences for
separate review.

The DE source popularity values for `capcut` (64), `firebase-studio` (53) and
`intellicode` (0) now match the independently confirmed runtime values. EN values
and other metrics were not changed in this correction.

Production runtime publication and Google Sheet updates were completed and
independently live-verified. The 1,125-tool inventory is not a claim that support
for all 1,125 cards was manually verified.

## Production release results

Fourteen DE/EN tool pairs were retired reversibly; the public catalog now has
1,111 tools per locale. Thirty-five active DE/EN pairs and one Ratgeber pair
were updated. All 245 active-route checks and 84 retirement checks passed, and
all 72 source hashes matched. No source, D1 or R2 content was physically deleted.

The Sheet readback exactly matched all 60 updated rows: 13 `DISABLED`, one
`BLACKLIST`, 19 official URL repairs, one invalid-entity URL cleared, three
availability notices, and 46 `DONE` rows retained. Existing notes were
preserved.

Pages deployment `de397d60-bcc4-4035-9fee-a12bd762f2dc` serves merge/source
commit `3ab6fc047f1377149481de067394cae145bd4685`. The source change is commit
`61ebc529ef538fb006fa1919c6d5b2d93881ea44`, merged through
[PR #221](https://github.com/fenstek/utildesk-motia/pull/221). The cumulative
live-request ledger is `7509/10000`, with `2491` remaining. Runtime metrics are
2,086 requests and zero errors; the 34 D1 write queries were exactly 18 bounded
active-pair statements, 14 tombstone statements and two Ratgeber statements.

Cloudflare plan, bill, payment method and spend controls were unavailable with
the current token; no plan, budget or resource-tier changes were made.

Private release evidence is in
`/home/jgdus/.local/state/utildesk-audits/gemini_4_argon_high_catalog_20261022/catalog-audit-final.json`,
with active-pair reports in `active-release/release.json` and
`active-release/live-delta/result.json`, and retirement reports in
`tombstone-release/release.json` and `tombstone-release/live-delta/result.json`
under the same audit directory. The pre-release D1 backup is
`before-catalog-retirement.sql`, SHA-256
`cf9622f5ced6a93348431f1283b3ec17f9b3cc9a026ada214488a70820f9b0ef`.
