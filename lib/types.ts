export const branches = ["Central", "Riverside", "North Point", "Market Street", "Lakeside"];
export const categories = ["Personal", "Auto", "Mortgage", "Business", "Education"];
export const tiers = ["Low", "Medium", "High"] as const;

export type Tier = (typeof tiers)[number];
