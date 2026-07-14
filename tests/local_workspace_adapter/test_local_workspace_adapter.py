import copy
import hashlib
import json
import os
import tempfile
import unittest
from pathlib import Path

from tools.adapters.local_workspace_adapter import (
    ADAPTER_SLOT_ID,
    CONTROLLED_PROMOTION_EXECUTION_MODE,
    CONTROLLED_PROMOTION_OPERATION,
    FilesystemProbe,
    PLAN_TYPE,
    TARGET_ID,
    build_controlled_dry_run_sample_request,
    build_read_only_manifest_sample_request,
    build_sample_request,
    build_staged_output_sample_request,
    handle_request,
    promote_staged_output,
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


class LocalWorkspaceAdapterControlledPromotionTests(unittest.TestCase):
    TASK033_PAYLOAD = b"Army Claw Task 033 evidence manifest sample.\n"
    TASK033_DIGEST = "6cc03375a40e5c9eb2b317686103112c3f2f1d265589f2018e23cb83ddddfd69"
    TASK033_MANIFEST_SAMPLE = Path(__file__).resolve().parents[2] / "docs/gpt-communication/contracts/samples/local-workspace-adapter/staged-output-evidence-manifest-response.sample.json"

    def _fixture(self):
        temp = tempfile.TemporaryDirectory()
        root = Path(temp.name)
        staged_root = root / "staged"
        approved_root = root / "approved"
        source_path = staged_root / "artifacts/report.md"
        source_path.parent.mkdir(parents=True)
        source_path.write_bytes(b"# promoted artifact\n")
        (approved_root / "reports").mkdir(parents=True)
        digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
        request = {
            "request_id": "req-task035-positive",
            "operation": CONTROLLED_PROMOTION_OPERATION,
            "execution_mode": CONTROLLED_PROMOTION_EXECUTION_MODE,
            "source": {
                "artifact_id": "artifact-001",
                "manifest_id": "manifest-001",
                "normalized_relative_path": "artifacts/report.md",
                "byte_size": source_path.stat().st_size,
                "digest": {"algorithm": "sha256", "value": digest},
            },
            "destination": {
                "approved_root_id": "approved-output",
                "normalized_relative_path": "reports/report.md",
                "overwrite_allowed": False,
            },
            "authorization": {
                "authorization_id": "auth-001",
                "single_use": True,
                "bindings": [
                    {
                        "request_id": "req-task035-positive",
                        "artifact_id": "artifact-001",
                        "manifest_id": "manifest-001",
                        "destination_root_id": "approved-output",
                        "destination_relative_path": "reports/report.md",
                    }
                ],
            },
            "constraints": {
                "retain_staged_source": True,
                "require_digest_match": True,
                "require_exclusive_create": True,
                "allow_cross_volume_copy": False,
                "allow_symlink": False,
                "allow_hardlink": False,
                "allow_reparse_point": False,
                "allow_public_internet": False,
            },
        }
        manifest = {
            "manifest_id": "manifest-001",
            "validation": {"valid": True, "single_artifact": True, "relationships_valid": True},
            "artifacts": [
                {
                    "artifact_id": "artifact-001",
                    "normalized_relative_path": "artifacts/report.md",
                    "byte_size": source_path.stat().st_size,
                    "digest": {"algorithm": "sha256", "value": digest},
                    "status": "staged",
                    "sandbox": "task035-temp-root",
                }
            ],
            "relationships": [{"artifact_id": "artifact-001", "relationship": "generated_by_staged_output"}],
            "receipts": [{"artifact_id": "artifact-001", "receipt_id": "receipt-001"}],
        }
        return temp, staged_root, approved_root, request, manifest, source_path, digest

    def _task033_fixture(self, whole_response: bool = True):
        temp = tempfile.TemporaryDirectory()
        root = Path(temp.name)
        staged_root = root / "staged"
        approved_root = root / "approved"
        destination_parent = approved_root / "reports"
        source_path = staged_root / "outputs/task033/report.txt"
        source_path.parent.mkdir(parents=True)
        destination_parent.mkdir(parents=True)
        source_path.write_bytes(self.TASK033_PAYLOAD)
        sample = json.loads(self.TASK033_MANIFEST_SAMPLE.read_text(encoding="utf-8"))
        manifest = sample if whole_response else sample["manifest"]
        manifest_id = sample["manifest"]["manifest_id"]
        request = {
            "request_id": "req-task035-task033",
            "operation": CONTROLLED_PROMOTION_OPERATION,
            "execution_mode": CONTROLLED_PROMOTION_EXECUTION_MODE,
            "source": {
                "artifact_id": "artifact-001",
                "manifest_id": manifest_id,
                "normalized_relative_path": "outputs/task033/report.txt",
                "byte_size": len(self.TASK033_PAYLOAD),
                "digest": {"algorithm": "sha256", "value": self.TASK033_DIGEST},
            },
            "destination": {
                "approved_root_id": "approved-output",
                "normalized_relative_path": "reports/report.txt",
                "overwrite_allowed": False,
            },
            "authorization": {
                "authorization_id": "auth-task033",
                "single_use": True,
                "bindings": [
                    {
                        "request_id": "req-task035-task033",
                        "artifact_id": "artifact-001",
                        "manifest_id": manifest_id,
                        "destination_root_id": "approved-output",
                        "destination_relative_path": "reports/report.txt",
                    }
                ],
            },
            "constraints": {
                "retain_staged_source": True,
                "require_digest_match": True,
                "require_exclusive_create": True,
                "allow_cross_volume_copy": False,
                "allow_symlink": False,
                "allow_hardlink": False,
                "allow_reparse_point": False,
                "allow_public_internet": False,
            },
        }
        return temp, staged_root, approved_root, request, manifest, source_path

    def _promote_task033(self, whole_response: bool = True, request_mutator=None, manifest_mutator=None, probe=None):
        temp, staged_root, approved_root, request, manifest, source_path = self._task033_fixture(whole_response)
        self.addCleanup(temp.cleanup)
        if request_mutator:
            request_mutator(request)
        if manifest_mutator:
            inner = manifest.get("manifest") if isinstance(manifest.get("manifest"), dict) else manifest
            manifest_mutator(inner)
        response = promote_staged_output(
            request,
            staged_root=staged_root,
            approved_roots={"approved-output": approved_root},
            manifest_document=manifest,
            filesystem_probe=probe,
        )
        return response, staged_root, approved_root, source_path

    def _promote(self, request_mutator=None, manifest_mutator=None, probe=None, trusted_receipt=None):
        temp, staged_root, approved_root, request, manifest, source_path, digest = self._fixture()
        self.addCleanup(temp.cleanup)
        if request_mutator:
            request_mutator(request)
        if manifest_mutator:
            manifest_mutator(manifest)
        response = promote_staged_output(
            request,
            staged_root=staged_root,
            approved_roots={"approved-output": approved_root},
            manifest_document=manifest,
            trusted_receipt=trusted_receipt,
            filesystem_probe=probe,
        )
        return response, staged_root, approved_root, source_path, digest

    def test_positive_promotes_single_artifact_with_receipt_and_source_retained(self):
        response, _staged_root, approved_root, source_path, digest = self._promote()

        destination = approved_root / "reports/report.md"
        self.assertEqual("promoted", response["status"])
        self.assertTrue(destination.exists())
        self.assertEqual(source_path.read_bytes(), destination.read_bytes())
        self.assertEqual(digest, response["receipt"]["verification"]["destination_sha256"])
        self.assertTrue(response["receipt"]["safety_assertions"]["promotion_authorization_verified"])
        self.assertTrue(response["receipt"]["safety_assertions"]["manifest_link_verified"])
        self.assertTrue(response["receipt"]["safety_assertions"]["file_content_read_performed"])
        self.assertTrue(response["receipt"]["safety_assertions"]["actual_file_system_mutation_performed"])
        self.assertFalse(response["receipt"]["safety_assertions"]["actual_adapter_invoked"])
        self.assertFalse(response["receipt"]["safety_assertions"]["user_workspace_file_system_mutation_performed"])
        self.assertFalse(response["receipt"]["safety_assertions"]["local_hancom_com_executed"])
        self.assertFalse(response["receipt"]["safety_assertions"]["real_hwp_hwpx_hancell_hanshow_artifact_generated"])
        self.assertFalse(response["receipt"]["safety_assertions"]["public_internet_access_performed"])
        self.assertFalse(response["receipt"]["safety_assertions"]["dependency_install_performed"])
        self.assertEqual(response["safety_assertions"], response["receipt"]["safety_assertions"])
        self.assertEqual(1, getattr(destination.stat(), "st_nlink", 1))

    def test_accepts_real_task033_whole_response_manifest_sample(self):
        response, _staged_root, approved_root, source_path = self._promote_task033(whole_response=True)

        destination = approved_root / "reports/report.txt"
        self.assertEqual("promoted", response["status"])
        self.assertEqual(self.TASK033_PAYLOAD, destination.read_bytes())
        self.assertEqual(self.TASK033_PAYLOAD, source_path.read_bytes())
        self.assertEqual(self.TASK033_DIGEST, response["receipt"]["verification"]["destination_sha256"])

    def test_accepts_real_task033_inner_manifest_sample(self):
        response, _staged_root, approved_root, _source_path = self._promote_task033(whole_response=False)

        self.assertEqual("promoted", response["status"])
        self.assertEqual(self.TASK033_PAYLOAD, (approved_root / "reports/report.txt").read_bytes())

    def test_task033_canonical_manifest_linkage_is_validated(self):
        mutations = [
            (lambda manifest: manifest["artifacts"].append(copy.deepcopy(manifest["artifacts"][0])), "manifest_artifact_missing"),
            (lambda manifest: manifest["receipts"].clear(), "manifest_reference_mismatch"),
            (lambda manifest: manifest["relationships"].clear(), "manifest_reference_mismatch"),
            (lambda manifest: manifest["artifacts"][0].__setitem__("sandbox_only", False), "manifest_reference_mismatch"),
            (lambda manifest: manifest["artifacts"][0].__setitem__("promotion_status", "promoted"), "manifest_reference_mismatch"),
            (lambda manifest: manifest["artifacts"][0].__setitem__("digest_algorithm", "sha1"), "digest_algorithm_not_allowed"),
        ]
        for mutation, code in mutations:
            with self.subTest(code=code):
                response, *_ = self._promote_task033(manifest_mutator=mutation)
                self.assertEqual(code, response["error_code"])

    def test_trusted_receipt_exact_match_returns_already_promoted(self):
        first, staged_root, approved_root, _source_path, _digest = self._promote()
        temp, _staged_root_2, _approved_root_2, request, manifest, _source_path_2, _digest_2 = self._fixture()
        self.addCleanup(temp.cleanup)
        response = promote_staged_output(
            request,
            staged_root=staged_root,
            approved_roots={"approved-output": approved_root},
            manifest_document=manifest,
            trusted_receipt=first["receipt"],
        )

        self.assertEqual("already_promoted", response["status"])

    def test_conflicting_trusted_receipt_does_not_infer_success(self):
        first, staged_root, approved_root, _source_path, _digest = self._promote()
        first["receipt"]["source"]["digest"] = "0" * 64
        temp, _staged_root_2, _approved_root_2, request, manifest, _source_path_2, _digest_2 = self._fixture()
        self.addCleanup(temp.cleanup)
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, trusted_receipt=first["receipt"])

        self.assertEqual("destination_exists", response["error_code"])

    def test_blocks_missing_authorization(self):
        response, *_ = self._promote(lambda request: request.pop("authorization"))
        self.assertEqual("promotion_authorization_missing", response["error_code"])

    def test_blocks_authorization_mismatch(self):
        response, *_ = self._promote(lambda request: request["authorization"]["bindings"][0].__setitem__("artifact_id", "other"))
        self.assertEqual("authorization_binding_mismatch", response["error_code"])
        self.assertFalse(response["safety_assertions"]["file_content_read_performed"])
        self.assertFalse(response["safety_assertions"]["actual_file_system_mutation_performed"])

    def test_blocks_authorization_reuse(self):
        response, *_ = self._promote(lambda request: request["authorization"].__setitem__("used", True))
        self.assertEqual("authorization_reuse_conflict", response["error_code"])

    def test_blocks_destination_exists_without_overwrite(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        existing = approved_root / "reports/report.md"
        existing.parent.mkdir(parents=True, exist_ok=True)
        existing.write_text("existing", encoding="utf-8")
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest)
        self.assertEqual("destination_exists", response["error_code"])
        self.assertEqual("existing", existing.read_text(encoding="utf-8"))
        self.assertFalse(response["safety_assertions"]["actual_file_system_mutation_performed"])

    def test_blocks_destination_traversal_absolute_drive_reserved_and_case_collision(self):
        cases = [
            ("../x.md", "destination_path_traversal"),
            ("/tmp/x.md", "destination_absolute_path_not_allowed"),
            ("C:/tmp/x.md", "destination_absolute_path_not_allowed"),
            ("CON/report.md", "destination_reserved_name"),
        ]
        for path, code in cases:
            with self.subTest(path=path):
                response, *_ = self._promote(lambda request, p=path: request["destination"].__setitem__("normalized_relative_path", p))
                self.assertEqual(code, response["error_code"])

    def test_repeated_path_segment_is_not_false_case_collision(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        (approved_root / "AA/aa").mkdir(parents=True)
        request["destination"]["normalized_relative_path"] = "AA/aa/report.md"
        request["authorization"]["bindings"][0]["destination_relative_path"] = "AA/aa/report.md"

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest)

        self.assertEqual("promoted", response["status"])

    def test_existing_sibling_casefold_collision_is_blocked(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        parent = approved_root / "CaseDir"
        parent.mkdir(parents=True, exist_ok=True)
        (parent / "Report.md").write_text("existing sibling", encoding="utf-8")
        request["destination"]["normalized_relative_path"] = "CaseDir/report.md"
        request["authorization"]["bindings"][0]["destination_relative_path"] = "CaseDir/report.md"

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest)

        self.assertEqual("destination_case_collision", response["error_code"])

    def test_blocks_source_digest_mismatch(self):
        response, *_ = self._promote(lambda request: request["source"]["digest"].__setitem__("value", "0" * 64))
        self.assertEqual("manifest_reference_mismatch", response["error_code"])

    def test_actual_source_digest_mismatch_reports_read_without_mutation(self):
        temp, staged_root, approved_root, request, manifest, source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        bad_digest = hashlib.sha256(b"different request and manifest digest").hexdigest()
        request["source"]["byte_size"] = source_path.stat().st_size
        request["source"]["digest"]["value"] = bad_digest
        manifest["artifacts"][0]["digest"]["value"] = bad_digest

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest)

        self.assertEqual("source_digest_mismatch", response["error_code"])
        self.assertTrue(response["safety_assertions"]["file_content_read_performed"])
        self.assertFalse(response["safety_assertions"]["actual_file_system_mutation_performed"])

    def test_blocks_manifest_id_artifact_path_size_and_digest_mismatch(self):
        mutations = [
            (lambda manifest: manifest.__setitem__("manifest_id", "other"), "manifest_missing"),
            (lambda manifest: manifest["artifacts"][0].__setitem__("artifact_id", "other"), "manifest_artifact_missing"),
            (lambda manifest: manifest["artifacts"][0].__setitem__("normalized_relative_path", "other.md"), "manifest_reference_mismatch"),
            (lambda manifest: manifest["artifacts"][0].__setitem__("byte_size", 999), "manifest_reference_mismatch"),
            (lambda manifest: manifest["artifacts"][0]["digest"].__setitem__("value", "0" * 64), "manifest_reference_mismatch"),
        ]
        for mutation, code in mutations:
            with self.subTest(code=code):
                response, *_ = self._promote(manifest_mutator=mutation)
                self.assertEqual(code, response["error_code"])

    def test_blocks_symlink_source_when_supported(self):
        if not hasattr(os, "symlink"):
            self.skipTest("symlink unavailable")
        temp, staged_root, approved_root, request, manifest, source_path, digest = self._fixture()
        self.addCleanup(temp.cleanup)
        source_path.unlink()
        real = staged_root / "artifacts/real.md"
        real.write_bytes(b"# promoted artifact\n")
        try:
            os.symlink(real, source_path)
        except OSError as exc:
            if getattr(exc, "winerror", None) == 1314:
                self.skipTest("symlink creation requires elevated Windows privilege")
            raise
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest)
        self.assertEqual("symlink_not_allowed", response["error_code"])
        self.assertEqual(digest, hashlib.sha256(real.read_bytes()).hexdigest())

    def test_blocks_destination_parent_symlink_when_supported(self):
        if not hasattr(os, "symlink"):
            self.skipTest("symlink unavailable")
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        outside = Path(temp.name) / "outside"
        outside.mkdir()
        (approved_root / "reports").rmdir()
        try:
            os.symlink(outside, approved_root / "reports", target_is_directory=True)
        except OSError as exc:
            if getattr(exc, "winerror", None) == 1314:
                self.skipTest("symlink creation requires elevated Windows privilege")
            raise
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest)
        self.assertEqual("symlink_not_allowed", response["error_code"])

    def test_blocks_hardlinked_source(self):
        temp, staged_root, approved_root, request, manifest, source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        os.link(source_path, staged_root / "artifacts/linked.md")
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest)
        self.assertEqual("hardlink_not_allowed", response["error_code"])

    def test_blocks_reparse_point_probe(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        probe = FilesystemProbe(reparse_paths={str(staged_root.resolve())})
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)
        self.assertEqual("reparse_point_not_allowed", response["error_code"])

    def test_blocks_lexical_source_component_symlink_probe_without_skip(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        probe = FilesystemProbe(symlink_paths={str((staged_root / "artifacts").resolve(strict=False))})
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)
        self.assertEqual("symlink_not_allowed", response["error_code"])

    def test_blocks_lexical_destination_parent_symlink_probe_without_skip(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        (approved_root / "reports").mkdir(parents=True, exist_ok=True)
        probe = FilesystemProbe(symlink_paths={str((approved_root / "reports").resolve(strict=False))})
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)
        self.assertEqual("symlink_not_allowed", response["error_code"])

    def test_reparse_inspection_failure_fails_closed(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        probe = FilesystemProbe(reparse_inspection_error_paths={str(staged_root.resolve(strict=False))})
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)
        self.assertEqual("unsupported_safety_check", response["error_code"])

    def test_blocks_raw_staged_root_symlink_probe_without_skip(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        raw_staged_root = Path(temp.name) / "raw-staged-root-link"
        probe = FilesystemProbe(root_symlink_paths={str(raw_staged_root)})

        response = promote_staged_output(request, staged_root=raw_staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)

        self.assertEqual("symlink_not_allowed", response["error_code"])
        self.assertFalse(response["safety_assertions"]["file_content_read_performed"])

    def test_blocks_raw_approved_root_symlink_probe_without_skip(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        raw_approved_root = Path(temp.name) / "raw-approved-root-link"
        probe = FilesystemProbe(root_symlink_paths={str(raw_approved_root)})

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": raw_approved_root}, manifest_document=manifest, filesystem_probe=probe)

        self.assertEqual("symlink_not_allowed", response["error_code"])
        self.assertFalse(response["safety_assertions"]["file_content_read_performed"])

    def test_blocks_raw_root_reparse_probe_without_skip(self):
        for role in ("staged", "approved"):
            with self.subTest(role=role):
                temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
                self.addCleanup(temp.cleanup)
                raw_root = Path(temp.name) / f"raw-{role}-root-reparse"
                probe = FilesystemProbe(root_reparse_paths={str(raw_root)})
                roots = {"approved-output": approved_root}
                if role == "staged":
                    staged_root = raw_root
                else:
                    roots = {"approved-output": raw_root}

                response = promote_staged_output(request, staged_root=staged_root, approved_roots=roots, manifest_document=manifest, filesystem_probe=probe)

                self.assertEqual("reparse_point_not_allowed", response["error_code"])
                self.assertFalse(response["safety_assertions"]["file_content_read_performed"])

    def test_blocks_raw_root_inspection_failure_without_skip(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        probe = FilesystemProbe(root_inspection_failure_paths={str(staged_root)})

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)

        self.assertEqual("unsupported_safety_check", response["error_code"])
        self.assertFalse(response["safety_assertions"]["file_content_read_performed"])

    def test_blocks_cross_volume_probe(self):
        temp, staged_root, approved_root, request, manifest, source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        destination_parent = (approved_root / "reports").resolve(strict=False)
        destination_parent.mkdir(parents=True, exist_ok=True)
        probe = FilesystemProbe(device_identity_overrides={str(source_path.resolve()): "dev-a", str(destination_parent): "dev-b"})
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)
        self.assertEqual("cross_volume_promotion_not_allowed", response["error_code"])

    def test_blocks_source_changed_after_validation(self):
        temp, staged_root, approved_root, request, manifest, source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        before = source_path.read_bytes()
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=FilesystemProbe(source_changed_after_validation=True))
        self.assertEqual("source_changed_after_validation", response["error_code"])
        self.assertEqual(before, source_path.read_bytes())
        self.assertFalse(response["safety_assertions"]["source_mutated"])

    def test_blocks_unsupported_link_and_exclusive_commit_failure(self):
        response, *_ = self._promote(probe=FilesystemProbe(unsupported_link=True))
        self.assertEqual("unsupported_safety_check", response["error_code"])
        response, *_ = self._promote(probe=FilesystemProbe(fail_exclusive_commit=True))
        self.assertEqual("destination_exists", response["error_code"])
        self.assertTrue(response["safety_assertions"]["file_content_read_performed"])
        self.assertTrue(response["safety_assertions"]["actual_file_system_mutation_performed"])

    def test_blocks_temporary_cleanup_failure(self):
        response, *_ = self._promote(probe=FilesystemProbe(unsupported_link=True, cleanup_failure=True))
        self.assertEqual("temporary_cleanup_failed", response["error_code"])
        self.assertTrue(response["safety_assertions"]["file_content_read_performed"])
        self.assertTrue(response["safety_assertions"]["actual_file_system_mutation_performed"])

    def test_post_link_temp_cleanup_failure_removes_operation_created_final(self):
        temp, staged_root, approved_root, request, manifest, source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        destination = approved_root / "reports/report.md"
        probe = FilesystemProbe(temp_cleanup_failure_count=2)

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)

        self.assertEqual("temporary_cleanup_failed", response["error_code"])
        self.assertFalse(destination.exists())
        self.assertEqual(b"# promoted artifact\n", source_path.read_bytes())
        safety = response["safety_assertions"]
        self.assertTrue(safety["actual_file_system_mutation_performed"])
        self.assertTrue(safety["file_content_read_performed"])
        self.assertTrue(safety["final_path_cleaned"])
        self.assertFalse(safety["temporary_path_cleaned"])
        self.assertFalse(safety["cleanup_complete"])
        self.assertEqual("temporary_cleanup_failed", safety["original_error_code"])

    def test_final_cleanup_failure_still_cleans_temp(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        destination = approved_root / "reports/report.md"
        probe = FilesystemProbe(source_changed_after_validation=True, final_cleanup_failure=True)

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)

        self.assertEqual("temporary_cleanup_failed", response["error_code"])
        self.assertTrue(destination.exists())
        self.assertFalse(any(path.name.startswith(".army-claw-promotion-") for path in destination.parent.iterdir()))
        safety = response["safety_assertions"]
        self.assertTrue(safety["cleanup_attempted"])
        self.assertFalse(safety["final_path_cleaned"])
        self.assertTrue(safety["temporary_path_cleaned"])
        self.assertFalse(safety["cleanup_complete"])
        self.assertIn("final_cleanup_failed", safety["cleanup_error_codes"])

    def test_temp_and_final_cleanup_failures_are_both_attempted(self):
        response, _staged_root, approved_root, _source_path, _digest = self._promote(probe=FilesystemProbe(temp_cleanup_failure_count=2, final_cleanup_failure=True))

        self.assertEqual("temporary_cleanup_failed", response["error_code"])
        safety = response["safety_assertions"]
        self.assertTrue(safety["cleanup_attempted"])
        self.assertFalse(safety["temporary_path_cleaned"])
        self.assertFalse(safety["final_path_cleaned"])
        self.assertIn("temp_cleanup_failed", safety["cleanup_error_codes"])
        self.assertIn("final_cleanup_failed", safety["cleanup_error_codes"])

    def test_pre_existing_destination_is_never_cleanup_target(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        destination = approved_root / "reports/report.md"
        destination.write_bytes(b"existing")
        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=FilesystemProbe(final_cleanup_failure=True))

        self.assertEqual("destination_exists", response["error_code"])
        self.assertEqual(b"existing", destination.read_bytes())
        self.assertFalse(response["safety_assertions"]["cleanup_attempted"])

    def test_directory_listing_oserror_returns_structured_response(self):
        temp, staged_root, approved_root, request, manifest, _source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        probe = FilesystemProbe(directory_listing_failure_paths={str(approved_root)})

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)

        self.assertEqual("unsupported_safety_check", response["error_code"])

    def test_source_read_oserror_returns_structured_response(self):
        temp, staged_root, approved_root, request, manifest, source_path, _digest = self._fixture()
        self.addCleanup(temp.cleanup)
        probe = FilesystemProbe(read_failure_paths={str(source_path)})

        response = promote_staged_output(request, staged_root=staged_root, approved_roots={"approved-output": approved_root}, manifest_document=manifest, filesystem_probe=probe)

        self.assertEqual("final_verification_failed", response["error_code"])
        self.assertFalse(response["safety_assertions"]["actual_file_system_mutation_performed"])

    def test_temp_creation_oserror_returns_structured_response(self):
        response, *_ = self._promote(probe=FilesystemProbe(temp_creation_failure=True))

        self.assertEqual("exclusive_create_failed", response["error_code"])
        self.assertFalse(response["safety_assertions"]["actual_file_system_mutation_performed"])


if __name__ == "__main__":
    unittest.main()
