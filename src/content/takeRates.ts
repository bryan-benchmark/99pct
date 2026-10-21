/**
 * Rounded estimates of a typical payment, in whole percents.
 * Work is the people doing the job. Infrastructure is the goods, the buildings, and the systems.
 * Corporate is the published profit where the company reports one, and a rough cut where it does not.
 * Work + infrastructure + corporate = 100. These are not a bill and not a payment.
 *
 * Anchors, rounded: Uber mobility 2024, about 70% to drivers and about 8% adjusted profit.
 * Airbnb 2024, about 14% of bookings, about 4% profit. DoorDash 2024, about 14% of order value and a thin profit.
 * Netflix 2024, content about 39% of revenue and a 27% operating margin.
 * Meta's apps in 2024, people who post are unpaid and the apps' operating profit is about 54%.
 * YouTube's published creator share of watch-page ads is 55%. Spotify pays about 70% to rightsholders.
 * Visa's own profit on a purchase rounds to under 1%; the merchant fee is mostly the banks.
 * NFL players' bargained share of football revenue is 48%. An average 2024 ticket was about $136.
 * Walmart's 2025 operating margin was about 4%. Retail labor is not separately disclosed, so the worker share is a round estimate and the goods sit in infrastructure.
 */

export type TakeEstimate = {
  purchase: string;
  cents: number;
  work: number;
  infrastructure: number;
  corporate: number;
};

export const takeEstimates: Record<string, TakeEstimate> = {
  "Uber": { purchase: "A ride, about $25", cents: 2500, work: 70, infrastructure: 22, corporate: 8 },
  "Netflix": { purchase: "A month, about $15", cents: 1500, work: 39, infrastructure: 34, corporate: 27 },
  "Walmart": { purchase: "A trip, about $60", cents: 6000, work: 12, infrastructure: 84, corporate: 4 },
  "Microsoft": { purchase: "A month, about $10", cents: 1000, work: 20, infrastructure: 35, corporate: 45 },
  "Airbnb": { purchase: "A night, about $160", cents: 16000, work: 86, infrastructure: 10, corporate: 4 },
  "McDonald's": { purchase: "A meal, about $10", cents: 1000, work: 25, infrastructure: 60, corporate: 15 },
  "DoorDash": { purchase: "An order, about $35", cents: 3500, work: 83, infrastructure: 14, corporate: 3 },
  "Dollar Tree": { purchase: "A visit, about $15", cents: 1500, work: 15, infrastructure: 77, corporate: 8 },
  "Spotify": { purchase: "A month, about $12", cents: 1200, work: 70, infrastructure: 25, corporate: 5 },
  "Kroger": { purchase: "A trip, about $70", cents: 7000, work: 15, infrastructure: 82, corporate: 3 },
  "Amazon": { purchase: "A purchase, about $50", cents: 5000, work: 80, infrastructure: 15, corporate: 5 },
  "Starbucks": { purchase: "A visit, about $7", cents: 700, work: 30, infrastructure: 55, corporate: 15 },
  "Visa": { purchase: "A purchase, about $50", cents: 5000, work: 97, infrastructure: 3, corporate: 0 },
  "Mastercard": { purchase: "A purchase, about $50", cents: 5000, work: 97, infrastructure: 3, corporate: 0 },
  "Ticketmaster": { purchase: "A ticket, about $80", cents: 8000, work: 65, infrastructure: 15, corporate: 20 },
  "NFL": { purchase: "A ticket, about $140", cents: 14000, work: 48, infrastructure: 32, corporate: 20 },
  "Comcast": { purchase: "A month, about $90", cents: 9000, work: 40, infrastructure: 30, corporate: 30 },
  "Instacart": { purchase: "An order, about $100", cents: 10000, work: 82, infrastructure: 13, corporate: 5 },
  "YouTube": { purchase: "Of $100 in ads", cents: 10000, work: 55, infrastructure: 30, corporate: 15 },
  "Facebook": { purchase: "Of $100 in ads", cents: 10000, work: 0, infrastructure: 46, corporate: 54 },
  "Instagram": { purchase: "Of $100 in ads", cents: 10000, work: 0, infrastructure: 46, corporate: 54 },
  "TikTok": { purchase: "Of $100 in ads", cents: 10000, work: 5, infrastructure: 60, corporate: 35 },
  "X": { purchase: "Of $100 in ads", cents: 10000, work: 0, infrastructure: 80, corporate: 20 },
  "CVS": { purchase: "A visit, about $30", cents: 3000, work: 20, infrastructure: 75, corporate: 5 },
};

export function estimateShare(cents: number, work: number, infrastructure: number) {
  const workCents = Math.round(cents * work / 100);
  const infrastructureCents = Math.round(cents * infrastructure / 100);
  return { workCents, infrastructureCents, corporateCents: cents - workCents - infrastructureCents };
}
