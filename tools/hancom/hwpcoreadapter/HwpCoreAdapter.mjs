import { copyFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";

export const BACKEND_ROLES = ["editor", "surgical_patcher", "validator", "layout_authority"];
export const FAILURE_TYPES = ["input_error", "backend_error", "validation_error", "native_layout_error", "preservation_error", "policy_error"];

export const TASK_004_BOUNDARY_MODEL = Object.freeze({
  backend_roles: BACKEND_ROLES,
  routing: Object.freeze({
    create_document: "editor",
    edit_paragraph: "editor",
    edit_table: "editor",
    apply_style: "editor",
    patch_xml_preserve: "surgical_patcher",
    replace_token_preserve: "surgical_patcher",
    preserve_relationships: "surgical_patcher",
    validate_structure: "validator",
    validate_schema: "validator",
    validate_evidence: "validator",
    native_open_save: "layout_authority",
    native_layout_check: "layout_authority",
    native_render_check: "layout_authority",
  }),
});

export const TASK_003_READ_ONLY_REFERENCE_PATHS = Object.freeze([
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/post-d2-scenario-gates-v6.result.txt",
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/gate-d2-final-mapped-json-validation-v6.result.txt",
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/cross-artifact-consistency-v6.result.txt",
]);

export function routeIntentToBackendRole(intent) {
  const role = TASK_004_BOUNDARY_MODEL.routing[intent];
  if (!role) {
    throw makeFailure("policy_error", `unsupported_intent:${intent}`, "route_intent", null);
  }
  return role;
}

export async function createFileProbe(path) {
  const target = resolve(path);
  try {
    const info = await stat(target);
    if (!info.isFile()) {
      return { path: target, exists: false, size: null, sha256: null, hash_algorithm: "sha256" };
    }
    const data = await readFile(target);
    return {
      path: target,
      exists: true,
      size: info.size,
      sha256: createHash("sha256").update(data).digest("hex"),
      hash_algorithm: "sha256",
    };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    return { path: target, exists: false, size: null, sha256: null, hash_algorithm: "sha256" };
  }
}

function makeFailure(type, message, lastSuccessfulStep, quarantinePath = null) {
  if (!FAILURE_TYPES.includes(type)) {
    throw new Error(`unsupported_failure_type:${type}`);
  }
  return {
    type,
    message,
    last_successful_step: lastSuccessfulStep,
    quarantine_path: quarantinePath,
  };
}

function validValidation(override = {}) {
  return {
    valid: override.valid ?? true,
    validator: override.validator ?? "HwpCoreAdapterStubValidator",
    failure_count: override.failure_count ?? 0,
    failures: override.failures ?? [],
  };
}

function isoNow() {
  return new Date().toISOString();
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

class BackendStubBase {
  constructor({ mode = "success", backendId } = {}) {
    this.mode = mode;
    this.backendId = backendId ?? this.constructor.name;
    this.calls = [];
  }

  async execute(operation, context) {
    this.calls.push({ operation, context });
    const startedAt = isoNow();
    const inputProbe = await createFileProbe(operation.input_path);
    let failure = null;
    let validation = validValidation();
    let success = true;
    let exitCode = 0;

    if (this.mode === "backend_failure") {
      success = false;
      exitCode = 1;
      failure = makeFailure("backend_error", `${this.backendId} forced backend failure`, "backend_started", context.quarantine_path);
    } else {
      await mkdir(dirname(context.temp_output_path), { recursive: true });
      await writeFile(context.temp_output_path, `${this.backendId}:${operation.operation_id}:${operation.intent}\n`, "utf8");
      if (this.mode === "validation_failure") {
        success = true;
        validation = validValidation({ valid: false, failure_count: 1, failures: ["forced_validation_failure"] });
      }
    }

    const outputProbe = await createFileProbe(context.temp_output_path);
    return {
      backend_role: operation.backend_role,
      backend_id: this.backendId,
      started_at: startedAt,
      ended_at: isoNow(),
      success,
      exit_code: exitCode,
      input_probe: inputProbe,
      output_probe: outputProbe,
      validation,
      evidence_path: null,
      failure,
    };
  }
}

export class EditorBackendStub extends BackendStubBase {}
export class SurgicalPatcherBackendStub extends BackendStubBase {}
export class ValidatorBackendStub extends BackendStubBase {}
export class LayoutAuthorityBackendStub extends BackendStubBase {
  constructor(options = {}) {
    super(options);
    this.realComExecuted = false;
  }
}

export class HwpCoreAdapter {
  constructor({ backends, evidenceDir }) {
    this.backends = backends ?? {};
    this.evidenceDir = evidenceDir ? resolve(evidenceDir) : resolve(".tmp", "hwpcoreadapter-evidence");
  }

  async executeOperation(operation) {
    const startedAt = isoNow();
    const prepared = { ...operation };
    let role;

    try {
      role = routeIntentToBackendRole(prepared.intent);
      prepared.backend_role = prepared.backend_role ?? role;
      if (prepared.backend_role !== role) {
        throw makeFailure("policy_error", `backend_role_mismatch:${prepared.backend_role}:${role}`, "route_intent", null);
      }
      if (resolve(prepared.input_path) === resolve(prepared.output_path)) {
        throw makeFailure("policy_error", "input_path_equals_output_path", "policy_check", null);
      }
      const inputProbe = await createFileProbe(prepared.input_path);
      if (!inputProbe.exists) {
        return this.#finalizeFailure(prepared, role, startedAt, makeFailure("input_error", "input_path_missing", "input_probe", null), inputProbe);
      }
    } catch (failure) {
      const normalized = failure?.type ? failure : makeFailure("policy_error", failure.message, "policy_check", null);
      return this.#finalizeFailure(prepared, role ?? "unknown", startedAt, normalized);
    }

    const backend = this.backends[role];
    if (!backend) {
      return this.#finalizeFailure(prepared, role, startedAt, makeFailure("policy_error", `backend_missing:${role}`, "backend_lookup", null));
    }

    const tempOutputPath = `${resolve(prepared.output_path)}.tmp-${prepared.operation_id}`;
    const quarantinePath = `${resolve(prepared.output_path)}.quarantine-${prepared.operation_id}`;
    const backendResult = await backend.execute(prepared, {
      temp_output_path: tempOutputPath,
      quarantine_path: quarantinePath,
    });

    let promoted = false;
    let finalProbe = backendResult.output_probe;
    let failure = backendResult.failure;

    if (backendResult.success !== true) {
      failure = failure ?? makeFailure("backend_error", "backend_success_false", "backend_execute", quarantinePath);
    } else if (backendResult.validation?.valid !== true) {
      failure = makeFailure("validation_error", "validation_valid_false", "validation", quarantinePath);
    } else {
      await mkdir(dirname(resolve(prepared.output_path)), { recursive: true });
      try {
        await rename(tempOutputPath, resolve(prepared.output_path));
      } catch (error) {
        if (error?.code !== "EXDEV") {
          throw error;
        }
        await copyFile(tempOutputPath, resolve(prepared.output_path));
      }
      promoted = true;
      finalProbe = await createFileProbe(prepared.output_path);
    }

    const result = {
      ...backendResult,
      success: promoted,
      promoted,
      output_probe: finalProbe,
      failure,
    };
    result.evidence_path = await this.#writeEvidence(prepared, result, startedAt);
    return result;
  }

  async #finalizeFailure(operation, role, startedAt, failure, inputProbe = null) {
    const result = {
      backend_role: role,
      backend_id: null,
      started_at: startedAt,
      ended_at: isoNow(),
      success: false,
      promoted: false,
      exit_code: 1,
      input_probe: inputProbe ?? (operation.input_path ? await createFileProbe(operation.input_path) : null),
      output_probe: operation.output_path ? await createFileProbe(operation.output_path) : null,
      validation: validValidation({ valid: false, failure_count: 1, failures: [failure.message] }),
      evidence_path: null,
      failure,
    };
    result.evidence_path = await this.#writeEvidence(operation, result, startedAt);
    return result;
  }

  async #writeEvidence(operation, result, startedAt) {
    const operationId = operation.operation_id ?? "operation-unknown";
    const role = result.backend_role ?? operation.backend_role ?? "unknown";
    const evidencePath = join(this.evidenceDir, `${operationId}-${role}.json`);
    const evidence = {
      task_id: operation.task_id,
      operation_id: operationId,
      backend_role: role,
      backend_id: result.backend_id,
      started_at: result.started_at ?? startedAt,
      ended_at: result.ended_at ?? isoNow(),
      exit_code: result.exit_code,
      promoted: result.promoted,
      input_probe: result.input_probe,
      output_probe: result.output_probe,
      validation: result.validation,
      failure: result.failure,
    };
    await writeJson(evidencePath, evidence);
    return evidencePath;
  }
}
