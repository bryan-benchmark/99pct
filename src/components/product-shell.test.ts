import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { findWorkCopy, helpCopy, missionismHubCopy, productCopy, useCopy } from "@/content/99pct";
import { heroMarkColor, heroMarks } from "@/content/heroMarks";
import { heroIncumbents, startUtilityPath, utilities, utilityBeneficiaries, utilityPurpose } from "@/content/utilities";
import { missionLimits } from "@/missions/model";
import { beginUtilityPath, firstWeek, piecePagePath } from "@/missions/starter";
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
  assert.equal(productCopy.headline, "The Taylor's version of Uber, Airbnb, DoorDash, and the rest.");
  const hero = source("src/components/RotatingVersion.tsx");
  assert.equal(hero.includes("underline"), false);
  assert.equal(hero.includes("fill-current"), false);
  assert.match(hero, /whitespace-nowrap/);
  assert.match(hero, /\{name\}/);
  assert.match(hero, /heroMarks/);
  assert.match(hero, /h-\[1\.15em\]/);
  assert.equal(heroMarkColor.Netflix, "#E50914");
  assert.equal(heroMarkColor.Spotify, "#1DB954");
  for (const name of ["Netflix", "Spotify", "Amazon", "Microsoft", "Visa", "Walmart"]) {
    assert.equal(typeof heroMarks[name], "string", name);
  }
  assert.equal(productCopy.eyebrow, "Built by the 99%, for the 99%.");
  assert.equal(productCopy.quote, "Good artists copy. Great artists steal.");
  assert.match(page, /productCopy\.quote/);
  assert.match(page, /text-\[#767676\]/);
  assert.equal(page.includes("Picasso"), false);
  assert.equal(JSON.stringify(productCopy).includes("Picasso"), false);
  assert.equal(productCopy.gloss, "A version where the people who do the work keep all of the profits.");
  assert.equal(productCopy.stop, "Let's just stop giving our money to them.");
  assert.equal(page.includes("productCopy.rules"), false);
  assert.equal(page.includes("Done when"), false);
  assert.match(page, /productCopy.join/);
  assert.match(page, /productCopy.use/);
  assert.match(page, /productCopy.build/);
  assert.match(page, /productCopy.start/);
  assert.match(page, /productCopy.explore/);
  assert.equal(/equity/i.test(page), false);
  assert.match(page, /productCopy\.mcu/);
  assert.match(page, /id="pieces"/);
  assert.ok(page.indexOf("productCopy.split") < page.indexOf("Start with one piece"));
  assert.ok(page.indexOf("Start with one piece") < page.indexOf("productCopy.mcu"));
  assert.equal(productCopy.intro.steps.length, 6);
  assert.match(productCopy.mcu.meaning, /not money and it is not a share/);
  assert.equal(/equity|\$/i.test(productCopy.mcu.meaning), false);
  assert.equal(/equity/i.test(`${productCopy.lede} ${productCopy.argument} ${productCopy.truth}`), false);
  assert.match(page, /productCopy\.split/);
  assert.deepEqual(productCopy.split.rows.map((row) => `${row.share} ${row.who}`), [
    "~99% The people doing the work, on site",
    "~1% The people who keep the infrastructure running",
    "0% Outside owners",
  ]);
  assert.match(productCopy.argument, /does not pay anyone/);
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
  const help = source("src/app/help/page.tsx");
  assert.match(help, /helpCopy/);
  assert.match(help, /not a job, a paycheck, or ownership/);
  assert.equal(helpCopy.lede, "You do not need to know how open source works.");
  const social = utilities.find((item) => item.name === "Social Media 99");
  assert.ok(social);
  assert.equal(social.incumbent, "TikTok");
  assert.match(social.line, /right format/);
  assert.equal(firstWeek(social).work.map((item) => item.title).join("|"), "Write the one-page description|Name the formats|Name the first community|Sketch the upload|Look after the list");
  assert.equal(utilities.length >= 50, true);
  assert.equal(new Set(utilities.map((item) => item.name)).size, utilities.length);
  for (const incumbent of heroIncumbents) {
    assert.equal(utilities.some((item) => item.incumbent === incumbent), true, incumbent);
  }
  for (const name of ["Amazon", "Walmart", "McDonald's", "Dollar Tree", "Kroger", "Starbucks", "Comcast", "Google", "Facebook", "CVS", "Netflix", "Microsoft", "Visa"]) {
    assert.equal((heroIncumbents as readonly string[]).includes(name), true, name);
  }
  for (const name of ["NVIDIA", "Shein", "Tesla", "Expedia", "United", "UnitedHealth", "Etsy", "Apple", "Upwork", "Wells Fargo", "Chase", "Yelp", "Exxon", "Nike", "Disney", "AT&T"]) {
    assert.equal((heroIncumbents as readonly string[]).includes(name), false, name);
  }
  for (const utility of utilities) {
    const purpose = utilityPurpose(utility);
    assert.equal(purpose.length >= missionLimits.purpose.min && purpose.length <= missionLimits.purpose.max, true, utility.name);
    assert.equal(utility.name.length >= missionLimits.name.min && utility.name.length <= missionLimits.name.max, true, utility.name);
    const path = startUtilityPath(utility);
    const draft = new URL(path, "https://99pct.example");
    assert.equal(draft.pathname, "/missions/new", utility.name);
    assert.equal(draft.searchParams.get("name"), utility.name, utility.name);
    assert.equal(draft.searchParams.get("purpose"), purpose, utility.name);
    assert.equal(draft.searchParams.get("beneficiaries"), utilityBeneficiaries, utility.name);
  }
  const rideshare = utilities.find((item) => item.name === "Rideshare 99");
  const delivery = utilities.find((item) => item.name === "Delivery 99");
  assert.match(beginUtilityPath(rideshare!), /piece=Look%20after%20the%20list/);
  assert.equal(piecePagePath("Rideshare 99", "Name the first city"), "/use/rideshare-99?piece=Name%20the%20first%20city#help");
  assert.equal(piecePagePath("Rideshare 99", "Not a piece"), "");
  assert.match(beginUtilityPath(delivery!), /^\/missions\/new/);
  assert.match(page, /beginUtilityPath\(rideshare\)/);
  assert.equal(utilityBeneficiaries.length >= missionLimits.beneficiaries.min && utilityBeneficiaries.length <= missionLimits.beneficiaries.max, true);
  assert.equal(/\$|equity|profits|rating|inventory|drivers|bookings/i.test(JSON.stringify(utilities)), false);
});
