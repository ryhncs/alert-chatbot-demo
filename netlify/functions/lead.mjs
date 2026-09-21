import { getStore } from "@netlify/blobs";

// POST /api/lead
// body: { name, phone, suburb, projectType, budget, notes }
// Stores the lead in Netlify Blobs so the demo works with zero extra setup.
// Swap this for an email/CRM call once this goes live on the real site.
export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { name, phone, suburb, projectType, budget, notes } = body || {};
  if (!name || !phone) {
    return json({ error: "name and phone are required" }, 400);
  }

  const lead = {
    name: String(name).slice(0, 120),
    phone: String(phone).slice(0, 40),
    suburb: suburb ? String(suburb).slice(0, 80) : null,
    projectType: projectType ? String(projectType).slice(0, 80) : null,
    budget: budget ? String(budget).slice(0, 80) : null,
    notes: notes ? String(notes).slice(0, 500) : null,
    receivedAt: new Date().toISOString(),
    source: "chatbot-demo",
  };

  try {
    const store = getStore("alert-leads");
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.setJSON(key, lead);
  } catch (err) {
    console.error("Failed to store lead", err);
    return json({ error: "Could not save lead" }, 500);
  }

  return json({ ok: true });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = {
  path: "/api/lead",
};
