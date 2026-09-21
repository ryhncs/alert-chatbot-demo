// Shared business knowledge for Alert Construction ("Your Building Clinic").
// Keep this file in sync with the live site — it is the assistant's only source of truth.
// NOTE: the site's header says "Monday – Friday 8 AM – 5 PM" but the footer says
// "Mon - Sat: 8 AM - 5 PM". Using the footer value below until confirmed — flag to Mo.

export const BUSINESS = {
  name: "Alert Construction",
  tagline: "Your Building Clinic",
  phone_landline: "(03) 8820 6567",
  phone_mobile: "0460 006 004",
  email: "info@alertconstruction.com.au",
  address: "Suite 40/541 Blackburn Road, Mount Waverley VIC 3149",
  hours: "Monday to Saturday, 8 AM – 5 PM (please confirm — site currently shows conflicting hours)",
  website: "https://alertconstruction.com.au",
  whatsapp: "https://alertconstruction.com.au/0460006004",
  serviceAreas: "Melbourne metro, including Mount Waverley, Glen Waverley, Clayton, Point Cook, Sanctuary Lakes, Northcote and surrounding suburbs",
};

export const SERVICES = [
  {
    id: "kitchen",
    label: "Kitchen Renovation",
    url: "https://alertconstruction.com.au/kitchen-renovations/",
    typicalCostRange: "$25,000 – $60,000",
    notes: "Purpose-built kitchens designed around how the client lives; scope drives cost (benchtop material, layout changes, appliances).",
  },
  {
    id: "bathroom",
    label: "Bathroom Renovation",
    url: "https://alertconstruction.com.au/bathroom-renovation/",
    typicalCostRange: "$20,000 – $45,000 (budget/mid/premium — see cost guide article)",
    notes: "Waterproofing and compliance are a major cost driver; always mention the free site visit for an exact number.",
  },
  {
    id: "renovation",
    label: "Home Renovation",
    url: "https://alertconstruction.com.au/home-renovation/",
    typicalCostRange: "Varies widely by scope — full vs partial renovation",
    notes: "Full or partial renovations that lift comfort and value.",
  },
  {
    id: "new-homes",
    label: "New Homes",
    url: "https://alertconstruction.com.au/new-homes/",
    typicalCostRange: "Quote only after site visit and design brief",
    notes: "New home builds, licensed unlimited builder.",
  },
  {
    id: "extension",
    label: "Home Extension",
    url: "https://alertconstruction.com.au/house-extension/",
    typicalCostRange: "See 'home extension cost' article for 2026 figures",
    notes: "Add space and value with a seamless extension; compare against moving costs (stamp duty, agent fees).",
  },
  {
    id: "inspection",
    label: "Building Inspection",
    url: "https://alertconstruction.com.au/building-inspection/",
    typicalCostRange: "Ask for current inspection pricing",
    notes: "Structural/pre-purchase inspections.",
  },
  {
    id: "engineering",
    label: "Engineering Services",
    url: "https://alertengineers.com.au/",
    typicalCostRange: "Quote only",
    notes: "Delivered under sister brand Alert Engineers — structural assessments, certified design, permits.",
  },
];

export const ARTICLES = [
  {
    title: "How Much Does a Bathroom Renovation Cost in Melbourne? (2026 Price Guide)",
    url: "https://alertconstruction.com.au/bathroom-renovation-cost-melbourne/",
    topics: ["bathroom", "cost", "price", "budget"],
  },
  {
    title: "7 Signs Your Bathroom Needs Waterproofing Repairs (Before It's Too Late)",
    url: "https://alertconstruction.com.au/bathroom-waterproofing-warning-signs-melbourne/",
    topics: ["bathroom", "waterproofing", "leak", "mould", "damage"],
  },
  {
    title: "Renovate or Move? A Melbourne Homeowner's Guide (2026)",
    url: "https://alertconstruction.com.au/renovate-or-move-melbourne/",
    topics: ["renovation", "extension", "moving", "stamp duty", "decision"],
  },
];

export function articlesFor(text) {
  const t = (text || "").toLowerCase();
  return ARTICLES.filter((a) => a.topics.some((topic) => t.includes(topic)));
}

export function buildSystemPrompt() {
  const serviceLines = SERVICES.map(
    (s) => `- ${s.label} (${s.url}): typical range ${s.typicalCostRange}. ${s.notes}`
  ).join("\n");
  const articleLines = ARTICLES.map((a) => `- "${a.title}" — ${a.url}`).join("\n");

  return `You are the virtual assistant for Alert Construction ("Your Building Clinic"), a licensed Melbourne building company. You are NOT an AI model brand — never mention Claude, Gemini, GPT, or any AI vendor. If asked who/what you are, say you're Alert Construction's project assistant.

BUSINESS FACTS (only source of truth — never invent details beyond this):
- Phone: ${BUSINESS.phone_landline} / ${BUSINESS.phone_mobile}
- Email: ${BUSINESS.email}
- Address: ${BUSINESS.address}
- Hours: ${BUSINESS.hours}
- Service area: ${BUSINESS.serviceAreas}

SERVICES:
${serviceLines}

ARTICLES (link one of these when directly relevant to the user's question — never fabricate a URL):
${articleLines}

RULES:
1. Never give a binding/exact price. Only give the typical ranges above, always followed by an offer to book a free site visit for an accurate fixed-price quote.
2. If the user shares a photo of a room, describe what you can see (layout, finishes, apparent condition, natural light) and suggest 2-4 concrete, realistic renovation ideas. Still never give an exact quote from a photo — tie any figure back to the typical range for that service and recommend the free site visit.
3. Stay strictly on topic: Alert Construction's services, renovations, building, pricing guidance, and booking a consultation. Politely redirect anything unrelated.
4. When a relevant article exists for the topic, mention it naturally with its link.
5. Keep replies short and conversational (2-5 sentences), like a helpful staff member texting back — not a formal report.
6. Your goal is to help the visitor, and where it fits naturally, move toward booking a free site visit or leaving contact details for a callback.
7. Never ask for payment details, and never claim to book an exact appointment time yourself — offer to arrange a callback instead.`;
}
