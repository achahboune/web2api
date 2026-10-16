// Cloudflare Worker: validates waitlist form and adds opted-in contact to Brevo.
// Keep BREVO_API_KEY in Worker Secrets, never in index.html.
const cors = {
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Access-Control-Allow-Headers":"Content-Type"
};
export default {
 async fetch(request, env) {
   const url = new URL(request.url);
   if (url.pathname !== "/api/subscribe") return new Response("Not found",{status:404});
   if (request.method === "OPTIONS") return new Response(null,{headers:cors});
   if (request.method !== "POST") return json({error:"Method not allowed"},405);
   let d; try { d=await request.json(); } catch { return json({error:"Invalid request"},400); }
   const email=String(d.email||"").trim().toLowerCase();
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:"Please enter a valid email."},400);
   if (!d.consent) return json({error:"Please confirm email consent."},400);
   const attrs={
     ROLE:String(d.role||"").slice(0,80),
     WEBSITE:String(d.site||"").slice(0,300),
     DATA_NEED:String(d.need||"").slice(0,500),
     SIGNUP_SOURCE:"Web2API Pro landing page"
   };
   // Brevo list ID is configured as a Worker variable: BREVO_LIST_ID
   const payload={email,attributes:attrs,listIds:[Number(env.BREVO_LIST_ID)],updateEnabled:true};
   const response=await fetch("https://api.brevo.com/v3/contacts",{
     method:"POST",headers:{"api-key":env.BREVO_API_KEY,"content-type":"application/json","accept":"application/json"},
     body:JSON.stringify(payload)
   });
   if (!response.ok) {
     const body=await response.text();
     // A duplicate contact is normally updated by updateEnabled; surface other errors safely.
     return json({error:"Brevo could not add this address. Please try again."},502);
   }
   return json({ok:true},200);
   function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}})}
 }
};