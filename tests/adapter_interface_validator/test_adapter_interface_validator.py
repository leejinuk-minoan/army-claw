import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
VALIDATOR_DIR = REPO_ROOT / "tools" / "validators"
if str(VALIDATOR_DIR) not in sys.path:
    sys.path.insert(0, str(VALIDATOR_DIR))

import adapter_interface_validator as validator


class AdapterInterfaceValidatorTests(unittest.TestCase):
    def setUp(self):
        self.repo_root = REPO_ROOT
        self.contract = validator.load_json_file(self.repo_root / validator.DEFAULT_CONTRACT_PATH)
        self.error_taxonomy = validator.load_json_file(self.repo_root / validator.DEFAULT_ERROR_TAXONOMY_PATH)
        self.validator_contract = validator.load_json_file(self.repo_root / validator.DEFAULT_VALIDATOR_CONTRACT_PATH)
        self.matrix = validator.load_json_file(self.repo_root / validator.DEFAULT_MATRIX_PATH)
        self.samples_dir = self.repo_root / validator.DEFAULT_SAMPLES_DIR

    def assert_no_invalid(self, results):
        invalid = [item for item in results if item["status"] == validator.ResultStatus.INVALID.value]
        self.assertEqual([], invalid)

    def test_common_contract_json_loads(self):
        self.assertEqual("common-office-adapter-interface-contract", self.contract["contract_id"])

    def test_error_taxonomy_json_loads(self):
        codes = {item["error_code"] for item in self.error_taxonomy["errors"]}
        self.assertIn("llm_direct_file_edit_blocked", codes)
        self.assertIn("target_plan_mismatch", codes)
        self.assertIn("authorization_binding_mismatch", codes)
        self.assertIn("destination_exists", codes)
        self.assertIn("cross_volume_promotion_not_allowed", codes)

    def test_validator_contract_json_loads(self):
        self.assertEqual("adapter-interface-validator-contract", self.validator_contract["contract_id"])

    def test_validation_matrix_json_loads(self):
        self.assertGreaterEqual(len(self.matrix["positive_samples"]), 10)
        self.assertGreaterEqual(len(self.matrix["negative_samples"]), 14)
        profiles = self.matrix["matrix_rules"]["controlled_promotion_profiles_supported"]
        self.assertIn("controlled_promotion_request", profiles)
        self.assertIn("controlled_promotion_response", profiles)
        self.assertIn("controlled_promotion_negative", profiles)

    def test_positive_request_samples_valid(self):
        for entry in self.matrix["positive_samples"]:
            if entry["sample_type"] != "request":
                continue
            sample = validator.load_json_file(self.repo_root / entry["sample"])
            results = validator.validate_request_sample(sample, self.contract, self.validator_contract)
            self.assert_no_invalid(results)
            self.assertNotIn(validator.ResultStatus.BLOCKED.value, {item["status"] for item in results})

    def test_controlled_promotion_request_sample_valid(self):
        entry = next(item for item in self.matrix["positive_samples"] if item["sample_type"] == "controlled_promotion_request")
        sample = validator.load_json_file(self.repo_root / entry["sample"])
        results = validator.validate_controlled_promotion_request_sample(sample, self.error_taxonomy)
        self.assert_no_invalid(results)
        self.assertGreaterEqual(len(results), 28)

    def test_controlled_promotion_response_sample_valid_and_safety_mirror_matches(self):
        entry = next(item for item in self.matrix["positive_samples"] if item["sample_type"] == "controlled_promotion_response")
        sample = validator.load_json_file(self.repo_root / entry["sample"])
        results = validator.validate_controlled_promotion_response_sample(sample, self.error_taxonomy)
        self.assert_no_invalid(results)
        self.assertTrue(any(item["check_id"] == "controlled_promotion.response.safety_mirror_matches_receipt" for item in results))
        self.assertGreaterEqual(len(results), 28)

    def test_positive_response_samples_valid(self):
        for entry in self.matrix["positive_samples"]:
            if entry["sample_type"] != "response":
                continue
            sample = validator.load_json_file(self.repo_root / entry["sample"])
            results = validator.validate_response_sample(sample, self.contract, self.validator_contract)
            self.assert_no_invalid(results)
            self.assertNotIn(validator.ResultStatus.BLOCKED.value, {item["status"] for item in results})

    def test_proof_mode_response_actual_adapter_invoked_false(self):
        for entry in self.matrix["positive_samples"]:
            if entry["sample_type"] != "response":
                continue
            sample = validator.load_json_file(self.repo_root / entry["sample"])
            result_statuses = validator.validate_no_actual_adapter_invocation(sample)
            self.assertEqual(validator.ResultStatus.VALID.value, result_statuses[0]["status"])

    def test_proof_mode_response_execution_allowed_false(self):
        for entry in self.matrix["positive_samples"]:
            if entry["sample_type"] != "response":
                continue
            sample = validator.load_json_file(self.repo_root / entry["sample"])
            results = validator.validate_proof_mode_response(sample)
            execution_checks = [item for item in results if item["check_id"] == "execution_allowed_false"]
            self.assertEqual(1, len(execution_checks))
            self.assertEqual(validator.ResultStatus.VALID.value, execution_checks[0]["status"])

    def _negative_result_for(self, sample_name):
        entry = next(item for item in self.matrix["negative_samples"] if item["sample"].endswith(sample_name))
        sample = validator.load_json_file(self.repo_root / entry["sample"])
        return validator.validate_negative_sample(sample, entry, self.error_taxonomy, self.contract)

    def test_negative_direct_file_edit_sample_blocked(self):
        results = self._negative_result_for("negative-llm-direct-file-edit-request.sample.json")
        self.assert_no_invalid(results)
        self.assertTrue(any(item["actual"] == "llm_direct_file_edit_blocked" for item in results))

    def test_negative_source_overwrite_sample_blocked(self):
        results = self._negative_result_for("negative-source-overwrite-request.sample.json")
        self.assert_no_invalid(results)
        self.assertTrue(any(item["actual"] == "source_overwrite_blocked" for item in results))

    def test_negative_public_internet_sample_blocked(self):
        results = self._negative_result_for("negative-public-internet-required.sample.json")
        self.assert_no_invalid(results)
        self.assertTrue(any(item["actual"] == "public_internet_dependency_blocked" for item in results))

    def test_negative_target_plan_mismatch_sample_blocked(self):
        results = self._negative_result_for("negative-target-plan-mismatch.sample.json")
        self.assert_no_invalid(results)
        self.assertTrue(any(item["actual"] == "target_plan_mismatch" for item in results))

    def test_controlled_promotion_negative_samples_blocked_with_exact_codes(self):
        entries = [item for item in self.matrix["negative_samples"] if item.get("sample_profile") == "controlled_promotion_negative"]
        self.assertGreaterEqual(len(entries), 10)
        for entry in entries:
            with self.subTest(sample=entry["sample"]):
                sample = validator.load_json_file(self.repo_root / entry["sample"])
                results = validator.validate_controlled_promotion_negative_sample(sample, entry, self.error_taxonomy)
                self.assert_no_invalid(results)
                self.assertTrue(any(item["check_id"] == "controlled_promotion_negative.matrix_error_code_match" for item in results))

    def test_target_slot_plan_mapping_valid(self):
        for rule in self.validator_contract["mapping_validation_rules"]:
            results = validator.validate_target_slot_plan_mapping(rule["target_id"], rule["adapter_slot_id"], rule["plan_type"], self.contract)
            self.assert_no_invalid(results)

    def test_unknown_target_invalid(self):
        results = validator.validate_supported_target("unknown_target", self.contract)
        self.assertEqual(validator.ResultStatus.INVALID.value, results[0]["status"])

    def test_mismatched_adapter_slot_invalid(self):
        results = validator.validate_adapter_slot("hwp_hwpx", "hancell_adapter_slot", self.contract)
        self.assertEqual(validator.ResultStatus.INVALID.value, results[0]["status"])

    def test_mismatched_plan_type_invalid(self):
        results = validator.validate_plan_type("hwp_hwpx", "hancell_fill_plan", self.contract)
        self.assertEqual(validator.ResultStatus.INVALID.value, results[0]["status"])

    def test_validator_run_total_checks_exceeds_task035_minimum(self):
        payload = validator.run_all_validations(self.repo_root, validator.RunOptions())
        summary = payload["summary"]
        self.assertEqual("valid", summary["status"])
        self.assertEqual(0, summary["failed_checks"])
        self.assertEqual(0, summary["blocked_checks"])
        self.assertGreater(summary["total_checks"], 200)


if __name__ == "__main__":
    unittest.main()
