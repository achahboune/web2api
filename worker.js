
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/subscribe") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ error: "Invalid request" }, 400);
    }

    const email = String(data.email || "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Please enter a valid email." }, 400);
    }

    if (!data.consent) {
      return json({ error: "Please confirm email consent." }, 400);
    }

    if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
      console.error("Missing Brevo Worker configuration");
      return json({ error: "Brevo configuration is missing." }, 500);
    }

    const listId = Number(env.BREVO_LIST_ID);

    if (!Number.isInteger(listId) || listId <= 0) {
      console.error("Invalid BREVO_LIST_ID");
      return json({ error: "Brevo list configuration is invalid." }, 500);
    }

    const payload = {
      email,
      attributes: {
        ROLE: String(data.role || "").slice(0, 80),
        WEBSITE: String(data.site || "").slice(0, 300),
        DATA_NEED: String(data.need || "").slice(0, 500),
        SIGNUP_SOURCE: "Web2API Pro landing page"
      },
      listIds: [listId],
      updateEnabled: true
    };

    try {
      const response = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error("Brevo API error:", response.status);
        return json({
          error: "Brevo error HTTP " + response.status +
            ". Check the API key, list ID, and contact attributes."
        }, 502);
      }

      return json({ ok: true }, 200);
    } catch (error) {
      console.error("Brevo connection error:", error.name || "NetworkError");
      return json({ error: "Could not connect to Brevo. Please retry." }, 502);
    }
  }
};
