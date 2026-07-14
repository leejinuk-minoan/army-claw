import copy
import hashlib
import json
import sys
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[6]
sys.path.insert(0, str(REPO_ROOT))

from tools.adapters.local_workspace_adapter import FilesystemProbe, promote_staged_output


IMPLEMENTATION_SHA = "e7c91119771ad9e75262ee946ad648b674157472"
PAYLOAD = b"Army Claw Task 033 evidence manifest sample.\n"
DIGEST = "6cc03375a40e5c9eb2b317686103112c3f2f1d265589f2018e23cb83ddddfd69"
REQUEST_SAMPLE = REPO_ROOT / "docs/gpt-communication/contracts/samples/local-workspace-adapter/staged-output-controlled-promotion-request.sample.json"
MANIFEST_SAMPLE = REPO_ROOT / "docs/gpt-communication/contracts/samples/local-workspace-adapter/staged-output-evidence-manifest-response.sample.json"
OUT_PATH = Path(__file__).with_name("11-task035b-formal-scenarios.json")


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def assert_true(assertions, name, condition, observed=None):
    assertions.append({"name": name, "passed": bool(condition), "observed": observed})
    if not condition:
        raise AssertionError(f"{name}: {observed!r}")


def base_fixture():
    temp = tempfile.TemporaryDirectory()
    root = Path(temp.name)
    staged = root / "staged"
    approved = root / "approved"
    source = staged / "outputs/task033/report.txt"
    source.parent.mkdir(parents=True)
    (approved / "reports").mkdir(parents=True)
    source.write_bytes(PAYLOAD)
    request = load_json(REQUEST_SAMPLE)
    manifest = load_json(MANIFEST_SAMPLE)
    return temp, staged, approved, source, request, manifest


def run_promotion(whole_manifest=True, request_mutator=None, manifest_mutator=None, probe=None, trusted_receipt=None, fixture=None):
    temp, staged, approved, source, request, manifest = fixture if fixture else base_fixture()
    if request_mutator:
        request_mutator(request)
    if manifest_mutator:
        inner = manifest.get("manifest") if isinstance(manifest.get("manifest"), dict) else manifest
        manifest_mutator(inner)
    manifest_document = manifest if whole_manifest else manifest["manifest"]
    response = promote_staged_output(
        request,
        staged_root=staged,
        approved_roots={"approved-output-root": approved},
        manifest_document=manifest_document,
        trusted_receipt=trusted_receipt,
        filesystem_probe=probe,
    )
    return temp, staged, approved, source, request, manifest, response


def scenario_result(scenario_id, fn):
    assertions = []
    try:
        observed = fn(assertions)
        return {"scenario_id": scenario_id, "status": "passed", "expected": {}, "observed": observed, "assertions": assertions}
    except Exception as exc:
        return {"scenario_id": scenario_id, "status": "failed", "expected": {}, "observed": {"error": f"{type(exc).__name__}: {exc}"}, "assertions": assertions}


def positive(assertions, whole_manifest):
    temp, staged, approved, source, request, manifest, response = run_promotion(whole_manifest=whole_manifest)
    try:
        dest = approved / "reports/report.txt"
        safety = response.get("safety_assertions", {})
        receipt = response.get("receipt", {})
        verification = receipt.get("verification", {})
        assert_true(assertions, "status_promoted", response.get("status") == "promoted", response.get("status"))
        assert_true(assertions, "source_exists", source.exists(), str(source))
        assert_true(assertions, "source_unchanged", source.read_bytes() == PAYLOAD)
        assert_true(assertions, "destination_exists", dest.exists(), str(dest))
        assert_true(assertions, "destination_bytes", dest.read_bytes() == PAYLOAD)
        assert_true(assertions, "destination_size", dest.stat().st_size == 45, dest.stat().st_size)
        assert_true(assertions, "destination_digest", hashlib.sha256(dest.read_bytes()).hexdigest() == DIGEST)
        assert_true(assertions, "receipt_binding", receipt["source"]["digest"] == DIGEST and receipt["destination"]["normalized_relative_path"] == "reports/report.txt")
        assert_true(assertions, "safety_mirror", receipt["safety_assertions"] == safety)
        for key in ("controlled_promotion_boundary_invoked", "controlled_test_promotion_performed", "actual_file_system_mutation_performed", "file_content_read_performed"):
            assert_true(assertions, key, safety.get(key) is True, safety.get(key))
        for key in ("user_workspace_file_system_mutation_performed", "production_promotion_performed", "actual_adapter_invoked", "local_hancom_com_executed", "real_hwp_hwpx_hancell_hanshow_artifact_generated", "public_internet_access_performed", "dependency_install_performed"):
            assert_true(assertions, key, safety.get(key) is False, safety.get(key))
        return {"status": response.get("status"), "digest": verification.get("destination_sha256"), "size": verification.get("destination_size")}
    finally:
        temp.cleanup()


def scenario_idempotency(assertions):
    fixture = base_fixture()
    temp, staged, approved, source, request, manifest, first = run_promotion(fixture=fixture)
    second = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest, trusted_receipt=first["receipt"])
    try:
        assert_true(assertions, "already_promoted", second.get("status") == "already_promoted", second.get("status"))
        assert_true(assertions, "bytes_unchanged", (approved / "reports/report.txt").read_bytes() == PAYLOAD)
        assert_true(assertions, "source_unchanged", source.read_bytes() == PAYLOAD)
        return {"status": second.get("status")}
    finally:
        temp.cleanup()


def scenario_conflicting_receipt(assertions):
    fixture = base_fixture()
    temp, staged, approved, source, request, manifest, first = run_promotion(fixture=fixture)
    first["receipt"]["source"]["digest"] = "0" * 64
    second = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest, trusted_receipt=first["receipt"])
    try:
        assert_true(assertions, "destination_exists", second.get("error_code") == "destination_exists", second)
        assert_true(assertions, "destination_unchanged", (approved / "reports/report.txt").read_bytes() == PAYLOAD)
        return {"error_code": second.get("error_code")}
    finally:
        temp.cleanup()


def scenario_preexisting(assertions):
    temp, staged, approved, source, request, manifest = base_fixture()
    try:
        dest = approved / "reports/report.txt"
        dest.write_bytes(b"sentinel")
        response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest)
        assert_true(assertions, "destination_exists", response.get("error_code") == "destination_exists", response)
        assert_true(assertions, "sentinel_unchanged", dest.read_bytes() == b"sentinel")
        assert_true(assertions, "cleanup_not_attempted", response["safety_assertions"]["cleanup_attempted"] is False)
        return {"error_code": response.get("error_code")}
    finally:
        temp.cleanup()


def scenario_auth_mismatch(assertions):
    def mutate(request):
        request["authorization"]["bindings"][0]["artifact_id"] = "other"
    temp, staged, approved, source, request, manifest, response = run_promotion(request_mutator=mutate)
    try:
        safety = response["safety_assertions"]
        assert_true(assertions, "authorization_binding_mismatch", response.get("error_code") == "authorization_binding_mismatch", response)
        assert_true(assertions, "no_read", safety["file_content_read_performed"] is False)
        assert_true(assertions, "no_mutation", safety["actual_file_system_mutation_performed"] is False)
        return {"error_code": response.get("error_code")}
    finally:
        temp.cleanup()


def scenario_source_digest_mismatch(assertions):
    temp, staged, approved, source, request, manifest = base_fixture()
    try:
        bad = hashlib.sha256(b"bad").hexdigest()
        request["source"]["digest"]["value"] = bad
        manifest["manifest"]["artifacts"][0]["digest_value"] = bad
        response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest)
        safety = response["safety_assertions"]
        assert_true(assertions, "source_digest_mismatch", response.get("error_code") == "source_digest_mismatch", response)
        assert_true(assertions, "read_true", safety["file_content_read_performed"] is True)
        assert_true(assertions, "mutation_false", safety["actual_file_system_mutation_performed"] is False)
        assert_true(assertions, "source_unchanged", source.read_bytes() == PAYLOAD)
        return {"error_code": response.get("error_code")}
    finally:
        temp.cleanup()


def scenario_raw_root(assertions):
    observed = []
    for sid, probe, staged_override, approved_override, code in [
        ("staged_symlink", lambda p: FilesystemProbe(root_symlink_paths={str(p)}), "raw-staged", None, "symlink_not_allowed"),
        ("approved_symlink", lambda p: FilesystemProbe(root_symlink_paths={str(p)}), None, "raw-approved", "symlink_not_allowed"),
        ("staged_reparse", lambda p: FilesystemProbe(root_reparse_paths={str(p)}), "raw-staged", None, "reparse_point_not_allowed"),
        ("approved_reparse", lambda p: FilesystemProbe(root_reparse_paths={str(p)}), None, "raw-approved", "reparse_point_not_allowed"),
    ]:
        temp, staged, approved, source, request, manifest = base_fixture()
        try:
            root = Path(temp.name) / (staged_override or approved_override)
            response = promote_staged_output(request, staged_root=root if staged_override else staged, approved_roots={"approved-output-root": root if approved_override else approved}, manifest_document=manifest, filesystem_probe=probe(root))
            assert_true(assertions, sid, response.get("error_code") == code, response)
            assert_true(assertions, sid + "_no_read", response["safety_assertions"]["file_content_read_performed"] is False)
            observed.append({sid: response.get("error_code")})
        finally:
            temp.cleanup()
    temp, staged, approved, source, request, manifest = base_fixture()
    try:
        response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest, filesystem_probe=FilesystemProbe(root_inspection_failure_paths={str(staged)}))
        assert_true(assertions, "root_inspection_failure", response.get("error_code") == "unsupported_safety_check", response)
        observed.append({"root_inspection_failure": response.get("error_code")})
        return observed
    finally:
        temp.cleanup()


def scenario_lexical(assertions):
    observed = []
    for sid, probe, code in [
        ("source_component_symlink", lambda staged, approved: FilesystemProbe(symlink_paths={str(staged / "outputs")}), "symlink_not_allowed"),
        ("destination_parent_symlink", lambda staged, approved: FilesystemProbe(symlink_paths={str(approved / "reports")}), "symlink_not_allowed"),
        ("reparse_inspection_failure", lambda staged, approved: FilesystemProbe(reparse_inspection_error_paths={str(staged)}), "unsupported_safety_check"),
    ]:
        temp, staged, approved, source, request, manifest = base_fixture()
        try:
            response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest, filesystem_probe=probe(staged, approved))
            assert_true(assertions, sid, response.get("error_code") == code, response)
            observed.append({sid: response.get("error_code")})
        finally:
            temp.cleanup()
    return observed


def scenario_casefold(assertions):
    temp, staged, approved, source, request, manifest = base_fixture()
    try:
        parent = approved / "CaseDir"
        parent.mkdir()
        (parent / "Report.md").write_bytes(b"existing")
        request["destination"]["normalized_relative_path"] = "CaseDir/report.md"
        request["authorization"]["bindings"][0]["destination_relative_path"] = "CaseDir/report.md"
        response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest)
        assert_true(assertions, "case_collision", response.get("error_code") == "destination_case_collision", response)
        assert_true(assertions, "existing_unchanged", (parent / "Report.md").read_bytes() == b"existing")
    finally:
        temp.cleanup()
    temp, staged, approved, source, request, manifest = base_fixture()
    try:
        (approved / "AA/aa").mkdir(parents=True)
        request["destination"]["normalized_relative_path"] = "AA/aa/report.txt"
        request["authorization"]["bindings"][0]["destination_relative_path"] = "AA/aa/report.txt"
        response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest)
        assert_true(assertions, "repeated_segment_promoted", response.get("status") == "promoted", response)
        return {"case_collision": "destination_case_collision", "repeated_segment": response.get("status")}
    finally:
        temp.cleanup()


def scenario_cross_volume(assertions):
    temp, staged, approved, source, request, manifest = base_fixture()
    try:
        probe = FilesystemProbe(device_identity_overrides={str(source): "a", str(approved / "reports"): "b"})
        response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest, filesystem_probe=probe)
        assert_true(assertions, "cross_volume", response.get("error_code") == "cross_volume_promotion_not_allowed", response)
        assert_true(assertions, "no_final", not (approved / "reports/report.txt").exists())
        assert_true(assertions, "source_unchanged", source.read_bytes() == PAYLOAD)
        return {"error_code": response.get("error_code")}
    finally:
        temp.cleanup()


def scenario_cleanup(assertions, mode):
    temp, staged, approved, source, request, manifest = base_fixture()
    try:
        if mode == "temp":
            probe = FilesystemProbe(temp_cleanup_failure_count=2)
        elif mode == "final":
            probe = FilesystemProbe(source_changed_after_validation=True, final_cleanup_failure=True)
        else:
            probe = FilesystemProbe(temp_cleanup_failure_count=2, final_cleanup_failure=True)
        response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest, filesystem_probe=probe)
        safety = response["safety_assertions"]
        assert_true(assertions, mode + "_temporary_cleanup_failed", response.get("error_code") == "temporary_cleanup_failed", response)
        assert_true(assertions, mode + "_source_unchanged", source.read_bytes() == PAYLOAD)
        if mode == "temp":
            assert_true(assertions, "final_removed", not (approved / "reports/report.txt").exists())
            assert_true(assertions, "final_cleaned_true", safety["final_path_cleaned"] is True)
            assert_true(assertions, "temp_cleaned_false", safety["temporary_path_cleaned"] is False)
        elif mode == "final":
            assert_true(assertions, "final_cleanup_failed", safety["final_path_cleaned"] is False)
            assert_true(assertions, "temp_cleaned_true", safety["temporary_path_cleaned"] is True)
            assert_true(assertions, "final_error_code", "final_cleanup_failed" in safety["cleanup_error_codes"])
        else:
            assert_true(assertions, "temp_error_code", "temp_cleanup_failed" in safety["cleanup_error_codes"])
            assert_true(assertions, "final_error_code", "final_cleanup_failed" in safety["cleanup_error_codes"])
        assert_true(assertions, "cleanup_complete_false", safety["cleanup_complete"] is False)
        return {"error_code": response.get("error_code"), "safety": safety}
    finally:
        temp.cleanup()


def scenario_structured(assertions):
    observed = []
    for sid, probe_factory, code in [
        ("directory_listing", lambda staged, approved, source: FilesystemProbe(directory_listing_failure_paths={str(approved)}), "unsupported_safety_check"),
        ("source_read", lambda staged, approved, source: FilesystemProbe(read_failure_paths={str(source)}), "final_verification_failed"),
        ("temp_creation", lambda staged, approved, source: FilesystemProbe(temp_creation_failure=True), "exclusive_create_failed"),
    ]:
        temp, staged, approved, source, request, manifest = base_fixture()
        try:
            response = promote_staged_output(request, staged_root=staged, approved_roots={"approved-output-root": approved}, manifest_document=manifest, filesystem_probe=probe_factory(staged, approved, source))
            assert_true(assertions, sid, response.get("error_code") == code, response)
            observed.append({sid: response.get("error_code")})
        finally:
            temp.cleanup()
    return observed


def main():
    scenarios = [
        scenario_result("task033_whole_response_positive", lambda a: positive(a, True)),
        scenario_result("task033_inner_manifest_positive", lambda a: positive(a, False)),
        scenario_result("trusted_receipt_idempotency", scenario_idempotency),
        scenario_result("conflicting_trusted_receipt", scenario_conflicting_receipt),
        scenario_result("pre_existing_destination_preservation", scenario_preexisting),
        scenario_result("authorization_mismatch_before_io", scenario_auth_mismatch),
        scenario_result("actual_source_digest_mismatch", scenario_source_digest_mismatch),
        scenario_result("raw_root_safety", scenario_raw_root),
        scenario_result("lexical_component_safety", scenario_lexical),
        scenario_result("sibling_casefold_collision", scenario_casefold),
        scenario_result("cross_volume_fail_closed", scenario_cross_volume),
        scenario_result("post_link_temp_cleanup_failure", lambda a: scenario_cleanup(a, "temp")),
        scenario_result("final_cleanup_failure_with_temp_cleanup", lambda a: scenario_cleanup(a, "final")),
        scenario_result("dual_cleanup_failure", lambda a: scenario_cleanup(a, "dual")),
        scenario_result("structured_filesystem_failures", scenario_structured),
    ]
    payload = {
        "verified_implementation_commit_sha": IMPLEMENTATION_SHA,
        "all_passed": all(item["status"] == "passed" for item in scenarios),
        "scenarios": scenarios,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0 if payload["all_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
