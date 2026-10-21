import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { findWorkCopy, helpCopy, missionismHubCopy, productCopy, useCopy } from "@/content/99pct";
import { heroMarkColor, heroMarkSrc, heroMarks } from "@/content/heroMarks";
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
  assert.equal(productCopy.headline, "Let's Taylor's Version: Uber, Airbnb, DoorDash, and the rest.");
  const hero = source("src/components/RotatingVersion.tsx");
  assert.equal(hero.includes("underline"), false);
  assert.equal(hero.includes("fill-current"), false);
  assert.match(hero, /whitespace-nowrap/);
  assert.match(hero, /\{name\}/);
  assert.match(hero, /heroMarks/);
  assert.match(hero, /h-\[1\.15em\]/);
  assert.match(hero, /max-w-\[3\.2em\]/);
  assert.match(hero, /w-\[4\.3em\]/);
  assert.match(hero, /w-\[3\.35em\]/);
  assert.match(hero, /w-\[1\.72em\]/);
  assert.match(hero, /w-auto/);
  assert.match(hero, /heroMarkSrc/);
  assert.equal(heroMarkColor.Netflix, "#E50914");
  assert.equal(heroMarkColor.Spotify, "#1DB954");
  for (const name of heroIncumbents) {
    assert.ok(Boolean(heroMarks[name] || heroMarkSrc[name]), name);
  }
  for (const name of ["Dollar Tree", "Kroger", "Comcast", "CVS", "Mastercard", "Instagram", "NFL"] as const) {
    assert.match(heroMarkSrc[name], /\/hero\//, name);
    assert.equal(existsSync(new URL(`../../public${heroMarkSrc[name]}`, import.meta.url)), true, name);
  }
  assert.equal(productCopy.eyebrow, "Built by the 99%, for the 99%.");
  assert.equal(productCopy.quote, "Good artists copy. Great artists steal.");
  assert.match(page, /productCopy\.quote/);
  assert.match(page, /text-\[#767676\]/);
  assert.equal(page.includes("Picasso"), false);
  assert.equal(JSON.stringify(productCopy).includes("Picasso"), false);
  assert.equal("gloss" in productCopy, false);
  assert.equal("stop" in productCopy, false);
  assert.equal(page.includes("productCopy.gloss"), false);
  assert.equal(page.includes("productCopy.stop"), false);
  assert.equal(page.includes("productCopy.rules"), false);
  assert.equal(page.includes("Done when"), false);
  assert.match(page, /productCopy\.helpNow/);
  assert.match(page, /productCopy.use/);
  assert.match(page, /productCopy.build/);
  assert.match(page, /productCopy.explore/);
  assert.equal(page.includes("Start with one piece"), false);
  assert.equal(/equity/i.test(page), false);
  assert.match(page, /productCopy\.mcu/);
  assert.match(page, /id="help"/);
  assert.ok(page.indexOf("productCopy.split") < page.indexOf("productCopy.helpNow"));
  assert.ok(page.indexOf("productCopy.helpNow") < page.indexOf("productCopy.mcu"));
  assert.equal(productCopy.helpNow.title, "Help today");
  assert.equal(productCopy.helpNow.action.label, "Join and help");
  assert.match(productCopy.helpNow.action.href, /rideshare-99/);
  assert.match(productCopy.lede, /Join, pick something, and help/);
  assert.ok(page.indexOf("productCopy.mcu") < page.indexOf("productCopy.faq"));
  assert.match(page, /id="faq"/);
  assert.equal(productCopy.faq.title, "FAQs");
  assert.equal(productCopy.faq.items.at(-1)?.q, "Is this legal?");
  assert.equal(productCopy.faq.items.at(-1)?.a, "Of course, this is how capitalism works.");
  assert.equal(/equity/i.test(JSON.stringify(productCopy.faq)), false);
  assert.equal(productCopy.intro.steps.length, 6);
  assert.match(productCopy.mcu.meaning, /not money and it is not a share/);
  assert.equal(/equity|\$/i.test(productCopy.mcu.meaning), false);
  assert.equal(/equity/i.test(`${productCopy.lede} ${productCopy.argument} ${productCopy.truth}`), false);
  assert.match(page, /productCopy\.split/);
  assert.match(page, /HeroCompare/);
  const compare = source("src/components/HeroCompare.tsx");
  assert.match(compare, /splitFare/);
  assert.match(compare, /Rounded estimates/);
  assert.match(compare, /The people doing the job/);
  assert.match(compare, /This site does not pay it/);
  assert.match(compare, /tabular-nums/);
  assert.deepEqual(productCopy.split.rows.map((row) => `${row.share} ${row.who}`), [
    "~99% The people doing the work, on site",
    "~1% The people who keep the infrastructure running",
    "0% Corporate Greed",
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
  for (const name of ["Amazon", "Walmart", "McDonald's", "Dollar Tree", "Kroger", "Starbucks", "Comcast", "Facebook", "Instagram", "X", "NFL", "CVS", "Netflix", "Microsoft", "Visa", "Mastercard"]) {
    assert.equal((heroIncumbents as readonly string[]).includes(name), true, name);
  }
  for (const name of ["Google", "NVIDIA", "Shein", "Tesla", "Expedia", "United", "UnitedHealth", "Etsy", "Apple", "Upwork", "Wells Fargo", "Chase", "Yelp", "Exxon", "Nike", "Disney", "AT&T"]) {
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
