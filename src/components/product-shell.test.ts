import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { findWorkCopy, missionismHubCopy, productCopy, useCopy } from "@/content/99pct";
import { shortDefinition } from "@/content/voice";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("the root application is 99pct, with Missionism as supporting protocol", () => {
  const page = source("src/app/page.tsx");
  const layout = source("src/app/layout.tsx");
  const nav = source("src/components/SiteNav.tsx");
  const footer = source("src/components/SiteFooter.tsx");
  const hub = source("src/app/missionism/page.tsx");
  const use = source("src/app/use/page.tsx");
  assert.equal(page.includes("<h1>Missionism</h1>"), false);
  assert.equal(productCopy.headline, "Build what should exist.");
  assert.match(page, /productCopy.use/);
  assert.match(page, /productCopy.build/);
  assert.match(page, /productCopy.start/);
  assert.match(page, /productCopy.explore/);
  assert.equal(productCopy.use.href, "/use");
  assert.equal(productCopy.build.href, "/work");
  assert.equal(productCopy.start.href, "/missions/new");
  assert.equal(productCopy.explore.href, "/missions");
  assert.match(page, /productCopy.protocolLink/);
  assert.equal(productCopy.protocolLink.href, "/missionism");
  assert.equal(nav.includes("missionism_icon_vector.svg"), false);
  assert.equal(nav.includes("missionism_wordmark_vector.svg"), false);
  assert.match(nav, /99pct home/);
  assert.match(layout, /default: "99pct"/);
  assert.match(layout, /template: "%s · 99pct"/);
  assert.equal(layout.includes("missionism_icon_vector.svg"), false);
  assert.match(footer, /Source \(AGPL-3\.0\)/);
  for (const demo of ["Spark prototype", "MU simulator", "Mishys Launch", "Toolshare demo", "Team-Up demo", "Experiment demo"]) {
    assert.equal(footer.includes(demo), false, demo);
    assert.equal(nav.includes(demo), false, demo);
  }
  assert.match(hub, /shortDefinition/);
  assert.equal(missionismHubCopy.relationship.includes("99pct is the product"), true);
  assert.equal(useCopy.empty, "No 99pct utilities are live yet. We are building the shared infrastructure first.");
  assert.match(use, /useCopy.empty/);
  assert.equal(use.includes("$"), false);
  assert.equal(/rating|inventory|drivers|bookings/i.test(use), false);
  assert.equal(shortDefinition.startsWith("Missionism is a better way to organize work."), true);
  assert.equal(findWorkCopy.title, "Find Work");
});
