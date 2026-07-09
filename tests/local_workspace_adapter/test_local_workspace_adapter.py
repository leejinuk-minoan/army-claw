import copy
import unittest

from tools.adapters.local_workspace_adapter import (
    ADAPTER_SLOT_ID,
    PLAN_TYPE,
    TARGET_ID,
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


if __name__ == "__main__":
    unittest.main()
