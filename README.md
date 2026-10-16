# Web2API Pro MVP — Cloudflare + Brevo

## What is included
- Responsive waitlist landing page (`index.html`)
- Cloudflare Worker endpoint (`worker.js`) that validates form input and creates/updates a Brevo contact
- Email sequence is configured in Brevo Automation (not sent by the Worker)

## Free-tier deployment (recommended)
### 1) Publish the landing page
1. Create a GitHub repository and upload `index.html`.
2. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Select the repo. Build command: leave empty. Build output directory: `/` (or use Direct Upload and upload `index.html`).
4. Deploy. You get a `*.pages.dev` URL.

### 2) Create Brevo list and contact attributes
1. Brevo → Contacts → Lists → create `Web2API Early Access`.
2. Create contact attributes (text): `ROLE`, `WEBSITE`, `DATA_NEED`, `SIGNUP_SOURCE`.
3. In Brevo → Automation, create a workflow:
   - Trigger: Contact added to list `Web2API Early Access`.
   - Email 1: immediately — welcome / explain early access.
   - Delay: 2 days.
   - Email 2: ask which website/data they need.
   - Delay: 3 days.
   - Email 3: invite them to reply / book a demo when a prototype exists.
4. Use double opt-in if available/appropriate; add unsubscribe footer to marketing emails. Test with your own address.

### 3) Connect the form to Brevo securely
1. Deploy `worker.js` as a Cloudflare Worker.
2. Worker Settings → Variables and Secrets:
   - Secret `BREVO_API_KEY` = your Brevo API key (secret)
   - Variable `BREVO_LIST_ID` = numeric ID of the list you created
3. Configure a route or custom domain so `/api/subscribe` reaches this Worker. For the simplest setup, use Cloudflare Pages Functions: move `worker.js` to `functions/api/subscribe.js` and adapt it to Pages Functions format (`onRequestPost({request,env})`). Or set up a Worker route on your domain.
4. Ensure the landing page's `/api/subscribe` URL points to the Worker endpoint. If using a separate Worker subdomain, replace `fetch('/api/subscribe'...)` in `index.html` with its full URL and set the Worker CORS allowed origin to your Pages URL (not `*`).

## Test
Submit the form using an address you control. Verify contact appears in Brevo list and automation starts. Check email delivery/spam.

## Important
- Hosting can be free within Cloudflare free limits; Brevo's free plan has sending/contact limits that may change.
- This is a waitlist/validation MVP, not a functioning website-to-API extractor.
- Before public launch, add rate limiting/Cloudflare Turnstile, a privacy policy, and restrict CORS to your actual site origin.
