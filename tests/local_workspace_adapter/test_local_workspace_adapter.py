import copy
import tempfile
import unittest
from pathlib import Path

from tools.adapters.local_workspace_adapter import (
    ADAPTER_SLOT_ID,
    PLAN_TYPE,
    TARGET_ID,
    build_controlled_dry_run_sample_request,
    build_read_only_manifest_sample_request,
    build_sample_request,
    build_staged_output_sample_request,
    handle_request,
)


class LocalWorkspaceAdapterProofModeTests(unittest.TestCase):
    def test_positive_request_returns_blocked_in_proof_without_execution(self):
        request = build_sample_request()

        response = handle_request(request)

        self.assertEqual(response["target_id"], TARGET_ID)
        self.assertEqual(response["adapter_slot_id"], ADAPTER_SLOT_ID)
        self.assertEqual(response["status"], "blocked_in_proof")
        self.assertFalse(response["execution_allowed"])
        self.assertFalse(response["actual_adapter_invoked"])
        self.assertFalse(response["actual_file_system_mutation_performed"])
        self.assertFalse(response["dry_run_adapter_boundary_evaluated"])
        self.assertFalse(response["read_only_manifest_boundary_evaluated"])
        self.assertFalse(response["staged_output_boundary_evaluated"])
        self.assertFalse(response["staged_output_sandbox_write_performed"])
        self.assertFalse(response["file_content_read_performed"])
        self.assertEqual(response["output_artifacts"], [])
        self.assertTrue(response["validation_result"]["valid"])
        self.assertTrue(response["evidence"]["proof_mode"])
        self.assertFalse(response["evidence"]["actual_file_system_mutation_performed"])
        self.assertEqual(len(response["evidence"]["operation_proofs"]), 2)

    def test_rejects_path_traversal(self):
        request = copy.deepcopy(build_sample_request())
        request["validated_plan"]["operation_batch"][0]["relative_input_path"] = "../secret.txt"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")
        self.assertFalse(response["evidence"]["actual_adapter_invoked"])
        self.assertFalse(response["evidence"]["actual_file_system_mutation_performed"])

    def test_rejects_absolute_output_path(self):
        request = copy.deepcopy(build_sample_request())
        request["validated_plan"]["operation_batch"][1]["relative_output_path"] = "/tmp/out.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")
        self.assertFalse(response["evidence"]["actual_adapter_invoked"])

    def test_rejects_source_overwrite(self):
        request = copy.deepcopy(build_sample_request())
        request["validated_plan"]["operation_batch"][1]["overwrite_existing"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "source_overwrite_blocked")
        self.assertEqual(response["user_visible_state"], "blocked")

    def test_rejects_public_internet_requirement(self):
        request = copy.deepcopy(build_sample_request())
        request["validated_plan"]["operation_batch"][0]["requires_public_internet"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "public_internet_dependency_blocked")

    def test_rejects_llm_direct_file_edit(self):
        request = copy.deepcopy(build_sample_request())
        request["validated_plan"]["llm_direct_file_edit_requested"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "llm_direct_file_edit_blocked")

    def test_rejects_wrong_target_slot_plan_mapping(self):
        request = copy.deepcopy(build_sample_request())
        request["target_id"] = "hwp_hwpx"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "target_plan_mismatch")

    def test_rejects_actual_adapter_invocation_allowed_in_proof(self):
        request = copy.deepcopy(build_sample_request())
        request["execution_context"]["actual_adapter_invocation_allowed"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "actual_adapter_invocation_forbidden_in_proof")
        self.assertEqual(response["user_visible_state"], "failed")
        self.assertFalse(response["recoverable"])

    def test_rejects_unsupported_operation_class(self):
        request = copy.deepcopy(build_sample_request())
        request["validated_plan"]["operation_batch"][0]["operation_class"] = "delete_workspace"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "unsupported_operation")


class LocalWorkspaceAdapterControlledDryRunTests(unittest.TestCase):
    def test_positive_controlled_dry_run_returns_receipts_without_execution(self):
        request = build_controlled_dry_run_sample_request()

        response = handle_request(request)

        self.assertEqual(response["target_id"], TARGET_ID)
        self.assertEqual(response["adapter_slot_id"], ADAPTER_SLOT_ID)
        self.assertEqual(response["status"], "controlled_dry_run_completed")
        self.assertFalse(response["execution_allowed"])
        self.assertFalse(response["actual_adapter_invoked"])
        self.assertTrue(response["dry_run_adapter_boundary_evaluated"])
        self.assertFalse(response["read_only_manifest_boundary_evaluated"])
        self.assertFalse(response["staged_output_boundary_evaluated"])
        self.assertFalse(response["staged_output_sandbox_write_performed"])
        self.assertFalse(response["actual_file_system_mutation_performed"])
        self.assertFalse(response["user_workspace_file_system_mutation_performed"])
        self.assertFalse(response["file_content_read_performed"])
        self.assertEqual(response["output_artifacts"], [])
        self.assertTrue(response["validation_result"]["valid"])
        self.assertTrue(response["validation_result"]["controlled_dry_run"])
        self.assertEqual(response["validation_result"]["operation_count"], 4)
        self.assertEqual(len(response["planned_output_artifacts"]), 3)
        self.assertEqual(len(response["dry_run_operation_receipts"]), 4)
        self.assertFalse(response["evidence"]["actual_adapter_invoked"])
        self.assertFalse(response["evidence"]["actual_file_system_mutation_performed"])

    def test_controlled_dry_run_rejects_path_traversal(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["validated_plan"]["operation_batch"][0]["relative_input_path"] = "safe/../secret.txt"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")
        self.assertFalse(response["evidence"]["dry_run_adapter_boundary_evaluated"])

    def test_controlled_dry_run_rejects_absolute_path(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["validated_plan"]["operation_batch"][2]["relative_output_path"] = "/tmp/report.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_controlled_dry_run_rejects_backslash_path(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["validated_plan"]["operation_batch"][2]["relative_output_path"] = "outputs\\report.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_controlled_dry_run_rejects_empty_path_segment(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["validated_plan"]["operation_batch"][2]["relative_output_path"] = "outputs//report.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_controlled_dry_run_rejects_source_overwrite(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["validated_plan"]["operation_batch"][2]["overwrite_existing"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "source_overwrite_blocked")
        self.assertFalse(response["evidence"]["actual_file_system_mutation_performed"])

    def test_controlled_dry_run_rejects_public_internet_requirement(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["validated_plan"]["operation_batch"][0]["requires_public_internet"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "public_internet_dependency_blocked")

    def test_controlled_dry_run_rejects_missing_execution_mode_marker(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        del request["execution_context"]["execution_mode"]

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_controlled_dry_run_rejects_missing_controlled_dry_run_marker(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["execution_context"]["controlled_dry_run"] = False

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_controlled_dry_run_rejects_missing_dry_run_flag(self):
        request = copy.deepcopy(build_controlled_dry_run_sample_request())
        request["dry_run"] = False

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_controlled_dry_run_claims_no_output_artifacts(self):
        response = handle_request(build_controlled_dry_run_sample_request())

        self.assertEqual(response["output_artifacts"], [])
        for artifact in response["planned_output_artifacts"]:
            self.assertEqual(artifact["status"], "planned_only")
            self.assertFalse(artifact["actual_file_system_mutation_performed"])

    def test_controlled_dry_run_receipts_are_deterministic(self):
        response = handle_request(build_controlled_dry_run_sample_request())

        expected_planned_output_artifacts = [
            {
                "operation_id": "op-002",
                "artifact_type": "folder",
                "relative_output_path": "outputs/task029",
                "status": "planned_only",
                "actual_file_system_mutation_performed": False,
            },
            {
                "operation_id": "op-003",
                "artifact_type": "md",
                "relative_output_path": "outputs/task029/report.md",
                "status": "planned_only",
                "actual_file_system_mutation_performed": False,
            },
            {
                "operation_id": "op-004",
                "artifact_type": "json",
                "relative_output_path": "outputs/task029/evidence/dry-run-manifest.json",
                "status": "planned_only",
                "actual_file_system_mutation_performed": False,
            },
        ]
        self.assertEqual(response["planned_output_artifacts"], expected_planned_output_artifacts)
        self.assertEqual(
            [item["operation_id"] for item in response["dry_run_operation_receipts"]],
            ["op-001", "op-002", "op-003", "op-004"],
        )
        self.assertEqual(response["created_at"], "2026-07-10T00:00:00Z")


class LocalWorkspaceAdapterReadOnlyManifestTests(unittest.TestCase):
    def test_positive_read_only_manifest_returns_deterministic_manifest(self):
        response = handle_request(build_read_only_manifest_sample_request())

        self.assertEqual(response["status"], "read_only_manifest_completed")
        self.assertFalse(response["execution_allowed"])
        self.assertFalse(response["actual_adapter_invoked"])
        self.assertTrue(response["read_only_manifest_boundary_evaluated"])
        self.assertFalse(response["dry_run_adapter_boundary_evaluated"])
        self.assertFalse(response["staged_output_boundary_evaluated"])
        self.assertFalse(response["staged_output_sandbox_write_performed"])
        self.assertFalse(response["actual_file_system_mutation_performed"])
        self.assertFalse(response["user_workspace_file_system_mutation_performed"])
        self.assertFalse(response["file_content_read_performed"])
        self.assertFalse(response["local_hancom_com_executed"])
        self.assertFalse(response["real_hwp_hwpx_hancell_hanshow_artifact_generated"])
        self.assertEqual(response["output_artifacts"], [])
        self.assertTrue(response["validation_result"]["valid"])
        self.assertTrue(response["validation_result"]["read_only_manifest"])
        self.assertEqual(response["manifest"]["total_entries"], 4)
        self.assertEqual(response["manifest"]["file_count"], 2)
        self.assertEqual(response["manifest"]["directory_count"], 1)
        self.assertEqual(response["manifest"]["denied_count"], 1)

    def test_read_only_manifest_entries_are_sorted_deterministically(self):
        response = handle_request(build_read_only_manifest_sample_request())

        self.assertEqual(
            [item["relative_path"] for item in response["manifest"]["entries"]],
            ["docs", "docs/README.md", "outputs/private", "src/app.py"],
        )
        self.assertEqual(response["created_at"], "2026-07-10T00:00:00Z")

    def test_read_only_manifest_claims_no_output_artifacts(self):
        response = handle_request(build_read_only_manifest_sample_request())

        self.assertEqual(response["output_artifacts"], [])
        self.assertFalse(response["actual_file_system_mutation_performed"])
        self.assertFalse(response["file_content_read_performed"])

    def test_read_only_manifest_receipts_are_deterministic(self):
        response = handle_request(build_read_only_manifest_sample_request())

        self.assertEqual(
            response["manifest_receipts"],
            [
                {
                    "operation_id": "op-001",
                    "operation_class": "inspect_workspace_manifest",
                    "status": "read_only_manifest_validated",
                    "manifest_entry_count": 4,
                    "file_content_read_performed": False,
                    "actual_file_system_mutation_performed": False,
                    "actual_adapter_invoked": False,
                }
            ],
        )

    def test_read_only_manifest_rejects_path_traversal(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["manifest_fixture"]["entries"][0]["relative_path"] = "safe/../secret.txt"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")
        self.assertFalse(response["evidence"]["read_only_manifest_boundary_evaluated"])

    def test_read_only_manifest_rejects_absolute_path(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["manifest_fixture"]["entries"][1]["relative_path"] = "/tmp/secret.txt"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_read_only_manifest_rejects_backslash_path(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["manifest_fixture"]["entries"][1]["relative_path"] = "docs\\README.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_read_only_manifest_rejects_empty_segment(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["manifest_fixture"]["entries"][1]["relative_path"] = "docs//README.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_read_only_manifest_rejects_public_internet_requirement(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["operation_batch"][0]["requires_public_internet"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "public_internet_dependency_blocked")

    def test_read_only_manifest_rejects_file_content_read_request(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["operation_batch"][0]["read_file_contents"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "llm_direct_file_edit_blocked")
        self.assertFalse(response["evidence"]["file_content_read_performed"])

    def test_read_only_manifest_rejects_forbidden_content_metadata(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["manifest_fixture"]["entries"][1]["raw_content"] = "secret"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "llm_direct_file_edit_blocked")
        self.assertFalse(response["evidence"]["file_content_read_performed"])

    def test_read_only_manifest_rejects_symlink_follow_request(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["operation_batch"][0]["follow_symlinks"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_read_only_manifest_rejects_missing_execution_mode_marker(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        del request["execution_context"]["execution_mode"]

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_read_only_manifest_rejects_missing_read_only_manifest_marker(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["execution_context"]["read_only_manifest"] = False

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_read_only_manifest_rejects_missing_read_only_flag(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["read_only"] = False

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_read_only_manifest_rejects_wrong_target_slot_plan_mapping(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["adapter_slot_id"] = "hwp_hwpx_adapter_slot"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "adapter_slot_mismatch")

    def test_read_only_manifest_rejects_wrong_plan_type_mapping(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["plan_type"] = "hwp_hwpx_fill_plan"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "target_plan_mismatch")

    def test_read_only_manifest_rejects_unsupported_operation_class(self):
        request = copy.deepcopy(build_read_only_manifest_sample_request())
        request["validated_plan"]["operation_batch"][0]["operation_class"] = "write_generated_text_artifact"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "unsupported_operation")


class LocalWorkspaceAdapterStagedOutputTests(unittest.TestCase):
    def test_positive_staged_output_writes_only_to_temporary_sandbox(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            request = build_staged_output_sample_request(temp_dir)
            response = handle_request(request)

            self.assertEqual(response["status"], "staged_output_completed")
            self.assertFalse(response["execution_allowed"])
            self.assertFalse(response["actual_adapter_invoked"])
            self.assertTrue(response["staged_output_boundary_evaluated"])
            self.assertTrue(response["staged_output_sandbox_write_performed"])
            self.assertFalse(response["actual_file_system_mutation_performed"])
            self.assertFalse(response["user_workspace_file_system_mutation_performed"])
            self.assertFalse(response["file_content_read_performed"])
            self.assertEqual(response["output_artifacts"], [])
            self.assertTrue((Path(temp_dir) / "staged/task031/report.md").exists())
            self.assertTrue((Path(temp_dir) / "staged/task031/evidence.json").exists())
            self.assertFalse((Path(temp_dir) / "source/analysis-plan.md").exists())

    def test_staged_output_artifacts_and_receipts_are_deterministic(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            response = handle_request(build_staged_output_sample_request(temp_dir))

        self.assertEqual(
            response["staged_output_artifacts"],
            [
                {
                    "operation_id": "op-001",
                    "artifact_type": "md",
                    "staging_root_reference": "approved_staging://task031-staging-fixture",
                    "relative_staging_path": "staged/task031/report.md",
                    "generated_content_source": "request_provided_generated_content",
                    "status": "staged_in_test_sandbox",
                    "actual_file_system_mutation_performed": False,
                    "user_workspace_file_system_mutation_performed": False,
                },
                {
                    "operation_id": "op-002",
                    "artifact_type": "json",
                    "staging_root_reference": "approved_staging://task031-staging-fixture",
                    "relative_staging_path": "staged/task031/evidence.json",
                    "generated_content_source": "request_provided_generated_content",
                    "status": "staged_in_test_sandbox",
                    "actual_file_system_mutation_performed": False,
                    "user_workspace_file_system_mutation_performed": False,
                },
            ],
        )
        self.assertEqual([item["operation_id"] for item in response["staged_output_receipts"]], ["op-001", "op-002"])
        self.assertEqual(response["created_at"], "2026-07-10T00:00:00Z")

    def test_staged_output_never_claims_final_output_artifacts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            response = handle_request(build_staged_output_sample_request(temp_dir))

        self.assertEqual(response["output_artifacts"], [])
        self.assertFalse(response["actual_file_system_mutation_performed"])
        self.assertFalse(response["user_workspace_file_system_mutation_performed"])
        self.assertFalse(response["file_content_read_performed"])

    def test_staged_output_rejects_path_traversal(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["relative_staging_path"] = "safe/../secret.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")
        self.assertFalse(response["evidence"]["staged_output_boundary_evaluated"])

    def test_staged_output_rejects_absolute_output_path(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["relative_staging_path"] = "/tmp/report.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_staged_output_rejects_backslash_path(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["relative_staging_path"] = "staged\\report.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_staged_output_rejects_empty_path_segment(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["relative_staging_path"] = "staged//report.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_staged_output_rejects_source_overwrite_path(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["relative_staging_path"] = "source/analysis-plan.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "source_overwrite_blocked")

    def test_staged_output_rejects_collision_without_safe_policy(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][1]["relative_staging_path"] = "staged/task031/report.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "source_overwrite_blocked")

    def test_staged_output_rejects_existing_sandbox_target(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            existing = Path(temp_dir) / "staged/task031/report.md"
            existing.parent.mkdir(parents=True, exist_ok=True)
            existing.write_text("already exists", encoding="utf-8")
            response = handle_request(build_staged_output_sample_request(temp_dir))

        self.assertEqual(response["error_code"], "source_overwrite_blocked")

    def test_staged_output_rejects_public_internet_requirement(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["requires_public_internet"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "public_internet_dependency_blocked")

    def test_staged_output_rejects_file_content_read_request(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["read_file_contents"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "llm_direct_file_edit_blocked")
        self.assertFalse(response["evidence"]["file_content_read_performed"])

    def test_staged_output_rejects_symlink_follow_request(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["follow_symlinks"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_staged_output_rejects_native_app_state_modification(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["modify_native_app_state"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "llm_direct_native_app_state_modification_blocked")

    def test_staged_output_rejects_missing_staged_output_mode_marker(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        del request["execution_context"]["execution_mode"]

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_staged_output_rejects_missing_staged_output_flag(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["staged_output"] = False

        response = handle_request(request)

        self.assertEqual(response["error_code"], "constraint_violation")

    def test_staged_output_rejects_missing_approved_staging_root_reference(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        del request["validated_plan"]["staging_root_reference"]

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_staged_output_rejects_freeform_staging_root_path(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["staging_root_reference"] = "/tmp/staging"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")

    def test_staged_output_rejects_wrong_target_slot_plan_mapping(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["plan_type"] = "hwp_hwpx_fill_plan"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "target_plan_mismatch")

    def test_staged_output_rejects_unsupported_operation_class(self):
        request = copy.deepcopy(build_staged_output_sample_request())
        request["validated_plan"]["operation_batch"][0]["operation_class"] = "copy_source_to_output"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "unsupported_operation")


if __name__ == "__main__":
    unittest.main()
