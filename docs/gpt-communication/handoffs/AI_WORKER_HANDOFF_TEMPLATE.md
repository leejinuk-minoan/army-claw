# AI Worker Handoff Packet Template

```text
handoff_id:
task_id:
from_worker:
to_worker:
handoff_type:
repository:
source_branch:
source_commit_sha:
base_commit_sha:
target_branch:
worktree_path:
task_report_path:
research_note_path:
changed_files:
validation_summary:
commands_run:
commands_not_run:
forbidden_changes_check:
dirty_worktree_status:
known_limitations:
remaining_risks:
next_worker_required_reads:
next_worker_allowed_scope:
next_worker_forbidden_scope:
stop_conditions:
next_recommended_action:
```

## Field guide

- `handoff_id`: unique handoff packet ID.
- `task_id`: Task identifier being transferred.
- `from_worker`: sender worker ID.
- `to_worker`: receiver worker ID.
- `handoff_type`: examples include `cloud_to_local`, `local_to_review`, `review_to_local`, `worker_to_master_review`.
- `repository`: repository in `owner/name` form.
- `source_branch`: branch containing the sender result.
- `source_commit_sha`: exact sender commit SHA.
- `base_commit_sha`: base commit used by the sender.
- `target_branch`: branch the receiver may use.
- `worktree_path`: local path only when known and safe to disclose.
- `task_report_path`: Task report path.
- `research_note_path`: Research Note path or `none`.
- `changed_files`: exact changed file list.
- `validation_summary`: short factual summary of checks performed.
- `commands_run`: commands actually run with result.
- `commands_not_run`: commands explicitly not run.
- `forbidden_changes_check`: whether forbidden paths/actions were checked.
- `dirty_worktree_status`: clean/dirty/unknown plus evidence.
- `known_limitations`: limitations from sender.
- `remaining_risks`: risks receiver must know.
- `next_worker_required_reads`: documents receiver must read before editing.
- `next_worker_allowed_scope`: allowed receiver changes.
- `next_worker_forbidden_scope`: forbidden receiver changes.
- `stop_conditions`: conditions that force receiver to stop.
- `next_recommended_action`: exact next action if accepted.

## Receiver decision block

```text
receiver_validation_status:
accepted | rejected | blocked

receiver_validation_notes:

receiver_start_sha:

receiver_may_write:
true | false
```
