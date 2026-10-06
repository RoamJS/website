# RoamJS website conventions

## Supabase

- Always use organization [`jevettuehuhgoesqqhxc`](https://supabase.com/dashboard/org/jevettuehuhgoesqqhxc) for RoamJS and Cybrarian work.
- RoamJS uses existing project [`uxihswugvmdwbbtgxtfl`](https://supabase.com/dashboard/project/uxihswugvmdwbbtgxtfl). Confirm both identifiers before hosted mutations. Cybrarian has its own project; do not infer it from RoamJS.
- Use Supabase Auth. Do not create replacement projects or introduce Clerk/Neon unless the user explicitly changes that decision.
- Keep credentials in local/deployment environment settings. Never put secret or service-role keys in browser code.
- Keep sign-in, suggestion persistence, and newsletter consent separate. Public browsing needs no account.
