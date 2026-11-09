-- The legacy policy allows DELETE anywhere in post-images without checking
-- ownership. Removing it leaves the owner-scoped policy from migration 0004.
drop policy if exists "Auth delete posts" on storage.objects;
