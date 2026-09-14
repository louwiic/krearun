# Lettre personnalisee

Provisioning: `node --env-file=.env scripts/setup-letter-stats.mjs`.
Creates `letter_events` and the aggregate view `letter_stats` in PocketBase.
Both collections are private; only the server can write or read them.

`POST /api/letter-events`: UUID eventId, UUID visitorId, kind, format.
No name, email, IP or personalization options are included.

- `click`: each click on the public menu entry (desktop or mobile).
- `view`: once per browser tab session, including direct page access.
- `interact`: once per browser tab session, on changes, views, 3D interaction or export.
- `download`: after generation succeeds and the browser download is triggered; format stl or 3mf.

An eventId unique index prevents duplicate counting on retries/concurrent requests.
Unique visitors are estimated using a random localStorage ID, not authenticated people.
Clearing browser storage or using a different browser produces a new visitor.
Downloads count triggers, not confirmed file saves (the browser does not report saves).
The admin dashboard shows cumulative counts since activation, not historical usage.

The physical letter price is fixed at 2500 cents on the server. Stripe collects delivery details and adds the configured standard delivery fee (or free delivery threshold).
The client can pay or enlarge the 3D preview. Exports are admin-only and checked server-side at `/api/custom-letter/export`.
The webhook stores the configuration in the order item's `letterConfiguration` JSON field.
Manufacturing is locked to 10 mm base, 2 mm pocket, 0.25 mm clearance per side.
