import assert from "node:assert/strict";
import test from "node:test";
import { collectInstalls, evaluateAudit } from "./check-npm-audit.mjs";
import { firestoreImportLines } from "./check-no-firestore.mjs";

const today = "2026-10-04";

function exception(overrides = {}) {
  return {
    advisoryId: "GHSA-M9GG-HP2V-232J",
    package: "@grpc/grpc-js",
    installedVersion: "1.9.16",
    dependencyPath: "firebase@12.19.0 > @firebase/firestore@4.17.2 > @grpc/grpc-js@1.9.16",
    carriedBy: ["@firebase/firestore", "firebase"],
    classification: "unreachable",
    evidence: "test",
    upstream: "https://github.com/advisories/GHSA-m9gg-hp2v-232j",
    acceptedDate: "2026-10-04",
    reviewDate: "2026-11-03",
    ...overrides,
  };
}

function audit() {
  return {
    vulnerabilities: {
      "@grpc/grpc-js": {
        severity: "high",
        via: [
          { severity: "high", url: "https://github.com/advisories/GHSA-m9gg-hp2v-232j" },
          { severity: "low", url: "https://github.com/advisories/GHSA-f596-whhp-79r4" },
        ],
      },
      "@firebase/firestore": { severity: "high", via: ["@grpc/grpc-js"] },
      firebase: { severity: "high", via: ["@firebase/firestore"] },
    },
  };
}

const installs = {
  "@grpc/grpc-js": [{ path: "firebase@12.19.0 > @firebase/firestore@4.17.2 > @grpc/grpc-js@1.9.16", version: "1.9.16" }],
};
const versions = { "@grpc/grpc-js": "1.9.16" };

test("accepts the bounded grpc chain and ignores the low advisory", () => {
  assert.deepEqual(evaluateAudit({ audit: audit(), exceptions: [exception()], versions, installs, today }), []);
});

test("rejects a new moderate advisory", () => {
  const body = audit();
  body.vulnerabilities.braces = {
    severity: "high",
    via: [{ severity: "high", url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm" }],
  };
  const errors = evaluateAudit({ audit: body, exceptions: [exception()], versions, installs, today });
  assert.ok(errors.some((error) => error.includes("GHSA-VFJ7-8CJW-P6XM")));
});

test("rejects a version outside the exception", () => {
  const errors = evaluateAudit({
    audit: audit(),
    exceptions: [exception()],
    versions: { "@grpc/grpc-js": "1.9.15" },
    installs,
    today,
  });
  assert.ok(errors.some((error) => error.includes("1.9.15")));
});

test("rejects an expired exception", () => {
  const errors = evaluateAudit({
    audit: audit(),
    exceptions: [exception({ reviewDate: "2026-10-03" })],
    versions,
    installs,
    today,
  });
  assert.ok(errors.some((error) => error.includes("expired")));
});

test("rejects a review window longer than 30 days", () => {
  const errors = evaluateAudit({
    audit: audit(),
    exceptions: [exception({ reviewDate: "2026-12-01" })],
    versions,
    installs,
    today,
  });
  assert.ok(errors.some((error) => error.includes("30 days")));
});

test("rejects a second install of the excepted version", () => {
  const errors = evaluateAudit({
    audit: audit(),
    exceptions: [exception()],
    versions,
    installs: {
      "@grpc/grpc-js": [
        installs["@grpc/grpc-js"][0],
        { path: "other@1.0.0 > @grpc/grpc-js@1.9.16", version: "1.9.16" },
      ],
    },
    today,
  });
  assert.ok(errors.some((error) => error.includes("path")));
});

test("collects nested install paths without the repository root", () => {
  const tree = {
    dependencies: {
      firebase: {
        version: "12.19.0",
        dependencies: {
          "@firebase/firestore": {
            version: "4.17.2",
            dependencies: { "@grpc/grpc-js": { version: "1.9.16" } },
          },
        },
      },
    },
  };
  assert.deepEqual(collectInstalls(tree, "@grpc/grpc-js"), installs["@grpc/grpc-js"]);
});

test("flags a Firestore import and ignores ordinary auth imports", () => {
  const forbidden = `import { getFirestore } from "firebase/${["fire", "store"].join("")}";`;
  assert.deepEqual(firestoreImportLines(forbidden), [1]);
  assert.deepEqual(firestoreImportLines(`import { getAuth } from "firebase/auth";`), []);
});
