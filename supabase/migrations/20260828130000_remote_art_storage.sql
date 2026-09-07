-- Lets you add brand-new pets and Player-screen backgrounds by uploading a
-- picture to Supabase Storage and adding one row of data — no app build.
--
-- IMPORTANT — this does NOT make the existing bundled pets/backgrounds
-- remote. React Native's bundler (Metro) requires every image used today
-- to be `require('../assets/...')` with a literal path baked in at build
-- time, so the art you already have is staying exactly as it is. What
-- this adds is a second, additive pool: a plain single picture (no
-- animation, no sprite-atlas cropping) rendered via a normal image URL,
-- which React Native's <Image> component supports identically to a local
-- asset. See src/data/petOptions.js (loadRemotePets) and
-- src/data/backgroundOptions.js (loadRemoteBackgrounds) for the code that
-- reads these.
--
-- Workflow to add a new pet or background:
--   1. Supabase dashboard -> Storage -> "character-art" bucket -> upload
--      the image (transparent PNG recommended for pets).
--   2. Click the uploaded file -> copy its public URL.
--   3. Table Editor -> app_content -> insert a row:
--        type = 'pet_option' (or 'background_option')
--        title = display name, e.g. "Golden Retriever"
--        meta  = {"imageUrl": "<the public URL>", "requiredLevel": 5}
--                (background_option uses "maxRank" instead of
--                "requiredLevel" — lower rank number = harder to reach,
--                see backgroundOptions.js's comment for why)
--        active = true
--   4. Done — it shows up next time the app is opened, no build.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push`.

insert into storage.buckets (id, name, public)
values ('character-art', 'character-art', true)
on conflict (id) do nothing;

-- One disabled sample row per type, showing the shape to fill in — same
-- convention as the sample announcement in 20260828_remote_content_config.sql.
insert into public.app_content (type, key, title, body, meta, sort_order, active) values
  ('pet_option', NULL, 'Sample Pet', 'Upload art to the character-art bucket, set meta.imageUrl to its public URL, then set active=true.', jsonb_build_object('imageUrl', '', 'requiredLevel', 1), 0, false),
  ('background_option', NULL, 'Sample Background', 'Upload art to the character-art bucket, set meta.imageUrl to its public URL, then set active=true.', jsonb_build_object('imageUrl', '', 'maxRank', 20), 0, false)
on conflict do nothing;
