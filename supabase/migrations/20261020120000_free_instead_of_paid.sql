-- Free instead of paid (docs/north-star.md, 2026-10-20).
--
-- "Non-engineer people can finally witness what awesome things software can
-- do for them if they don't have to pay extensive money and license costs
-- for it." These Finds are free, mostly open-source software that does what
-- people usually pay license fees for. meta.instead_of is shown on the card
-- ("Free instead of a paid photo editor"). Bundled copies live in
-- src/data/knowledgeCatalogs.js (ids fs1..fs12) for when this can't load.
--
-- Safe to run twice: each row is skipped if its url is already there.

insert into public.app_content (type, key, title, body, meta, sort_order)
select v.type, v.key, v.title, v.body, v.meta, v.sort_order
from (values
  ('featured_resource', 'creative', 'GIMP', 'Free photo editing', jsonb_build_object('url', 'https://www.gimp.org', 'emoji', '🖌️', 'legacy_id', 'fs1', 'tags', jsonb_build_array('free', 'open source', 'photos'), 'summary', 'Crop, retouch, layer and fix photos. Free and open source, made by volunteers since the 90s. Takes an afternoon to learn the basics.', 'instead_of', 'a paid photo editor'), 300),
  ('featured_resource', 'creative', 'Krita', 'Free digital painting', jsonb_build_object('url', 'https://krita.org', 'emoji', '🎨', 'legacy_id', 'fs2', 'tags', jsonb_build_array('free', 'open source', 'drawing'), 'summary', 'Brushes, layers and animation for drawing on a computer or tablet. Free and open source, built by artists.', 'instead_of', 'a paid drawing app'), 301),
  ('featured_resource', 'creative', 'Inkscape', 'Free logos & illustrations', jsonb_build_object('url', 'https://inkscape.org', 'emoji', '✒️', 'legacy_id', 'fs3', 'tags', jsonb_build_array('free', 'open source', 'design'), 'summary', 'Vector drawing: logos, icons and posters that stay sharp at any size. Free and open source.', 'instead_of', 'a paid vector design app'), 302),
  ('featured_resource', 'creative', 'Blender', 'Free 3D & animation', jsonb_build_object('url', 'https://www.blender.org', 'emoji', '🧊', 'legacy_id', 'fs4', 'tags', jsonb_build_array('free', 'open source', '3D'), 'summary', 'Modelling, animation and video effects. Free and open source, and used on real films. Big to learn, so start with one beginner tutorial.', 'instead_of', 'paid 3D software'), 303),
  ('featured_resource', 'creative', 'Audacity', 'Free audio editing', jsonb_build_object('url', 'https://www.audacityteam.org', 'emoji', '🎙️', 'legacy_id', 'fs5', 'tags', jsonb_build_array('free', 'open source', 'audio'), 'summary', 'Record your voice or an instrument, then cut, clean and export it. Free and open source.', 'instead_of', 'a paid audio editor'), 304),
  ('featured_resource', 'creative', 'LMMS', 'Free music making', jsonb_build_object('url', 'https://lmms.io', 'emoji', '🎹', 'legacy_id', 'fs6', 'tags', jsonb_build_array('free', 'open source', 'music'), 'summary', 'Make beats and songs with patterns, synths and a mixer. Free and open source.', 'instead_of', 'a paid music studio app'), 305),
  ('featured_resource', 'creative', 'OBS Studio', 'Free screen recording & streaming', jsonb_build_object('url', 'https://obsproject.com', 'emoji', '🎥', 'legacy_id', 'fs7', 'tags', jsonb_build_array('free', 'open source', 'video'), 'summary', 'Record your screen or stream live, with scenes and overlays. Free and open source, and what many streamers use.', 'instead_of', 'paid recording software'), 306),
  ('featured_resource', 'creative', 'Godot', 'Free game engine', jsonb_build_object('url', 'https://godotengine.org', 'emoji', '🎮', 'legacy_id', 'fs8', 'tags', jsonb_build_array('free', 'open source', 'games'), 'summary', 'Make 2D and 3D games. Free and open source under the MIT licence: no fees and no royalties on what you sell.', 'instead_of', 'a game engine with license fees'), 307),
  ('featured_resource', 'professional', 'LibreOffice', 'Free office suite', jsonb_build_object('url', 'https://www.libreoffice.org', 'emoji', '📄', 'legacy_id', 'fs9', 'tags', jsonb_build_array('free', 'open source', 'documents'), 'summary', 'Documents, spreadsheets and slides that open Word, Excel and PowerPoint files. Free and open source.', 'instead_of', 'a paid office suite'), 308),
  ('featured_resource', 'professional', 'VS Code', 'Free code editor', jsonb_build_object('url', 'https://code.visualstudio.com', 'emoji', '💻', 'legacy_id', 'fs10', 'tags', jsonb_build_array('free', 'code', 'editor'), 'summary', 'A free code editor from Microsoft, used by a huge share of developers. Good for opening and changing a web page you made.', 'instead_of', 'a paid code editor'), 309),
  ('featured_resource', 'digital', 'Bitwarden', 'Open-source password manager', jsonb_build_object('url', 'https://bitwarden.com', 'emoji', '🔐', 'legacy_id', 'fs11', 'tags', jsonb_build_array('free tier', 'open source', 'passwords'), 'summary', 'A different strong password for every account, synced across devices. Open source, with a free plan that covers most people.', 'instead_of', 'a paid password manager'), 310),
  ('featured_resource', 'digital', 'Ollama', 'Run AI on your own computer', jsonb_build_object('url', 'https://ollama.com', 'emoji', '🧠', 'legacy_id', 'fs12', 'tags', jsonb_build_array('free', 'open source', 'AI'), 'summary', 'Download open AI models and run them on your own computer: no account and no subscription. Needs a reasonably recent computer.', 'instead_of', 'an AI subscription'), 311)
) as v(type, key, title, body, meta, sort_order)
where not exists (
  select 1 from public.app_content c
   where c.type = 'featured_resource' and c.meta->>'url' = v.meta->>'url'
);
