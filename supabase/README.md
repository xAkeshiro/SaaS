# Database

Migrations for the Supabase project behind the web app (and later the mobile app). See `docs/plan/12-roadmap.md` section 6 for the full data model; tables arrive phase by phase.

Apply to a project with the Supabase CLI from the repo root:

```sh
supabase link --project-ref <project-ref>
supabase db push
```

Every table has row-level security on. Phase 0 tables (`waitlist`, `pilot_requests`) have no policies: only the server writes them, with the secret key.
