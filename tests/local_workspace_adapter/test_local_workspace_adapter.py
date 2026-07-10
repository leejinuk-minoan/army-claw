import copy
import unittest

from tools.adapters.local_workspace_adapter import (
    ADAPTER_SLOT_ID,
    PLAN_TYPE,
    TARGET_ID,
    build_controlled_dry_run_sample_request,
    build_sample_request,
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
        self.assertEqual(response["output_artifacts"], [])
        self.assertTrue(response["validation_result"]["valid"])
        self.assertTrue(response["evidence"]["proof_mode"])
        self.assertFalse(response["evidence"]["actual_file_system_mutation_performed"])
        self.assertEqual(len(response["evidence"]["operation_proofs"]), 2)

    def test_rejects_path_traversal(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
        request["validated_plan"]["operation_batch"][0]["relative_input_path"] = "../secret.txt"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")
        self.assertFalse(response["evidence"]["actual_adapter_invoked"])
        self.assertFalse(response["evidence"]["actual_file_system_mutation_performed"])

    def test_rejects_absolute_output_path(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
        request["validated_plan"]["operation_batch"][1]["relative_output_path"] = "/tmp/out.md"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "template_reference_error")
        self.assertFalse(response["evidence"]["actual_adapter_invoked"])

    def test_rejects_source_overwrite(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
        request["validated_plan"]["operation_batch"][1]["overwrite_existing"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "source_overwrite_blocked")
        self.assertEqual(response["user_visible_state"], "blocked")

    def test_rejects_public_internet_requirement(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
        request["validated_plan"]["operation_batch"][0]["requires_public_internet"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "public_internet_dependency_blocked")

    def test_rejects_llm_direct_file_edit(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
        request["validated_plan"]["llm_direct_file_edit_requested"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "llm_direct_file_edit_blocked")

    def test_rejects_wrong_target_slot_plan_mapping(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
        request["target_id"] = "hwp_hwpx"

        response = handle_request(request)

        self.assertEqual(response["error_code"], "target_plan_mismatch")

    def test_rejects_actual_adapter_invocation_allowed_in_proof(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
        request["execution_context"]["actual_adapter_invocation_allowed"] = True

        response = handle_request(request)

        self.assertEqual(response["error_code"], "actual_adapter_invocation_forbidden_in_proof")
        self.assertEqual(response["user_visible_state"], "failed")
        self.assertFalse(response["recoverable"])

    def test_rejects_unsupported_operation_class(self):
        request = build_sample_request()
        request = copy.deepcopy(request)
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
        self.assertFalse(response["actual_file_system_mutation_performed"])
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


if __name__ == "__main__":
    unittest.main()
