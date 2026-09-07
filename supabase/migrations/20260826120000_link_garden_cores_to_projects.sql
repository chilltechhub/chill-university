-- Link Idea Garden cores to real Workshop projects.
--
-- Today an idea's "is this a project?" toggle in the Garden is just a local
-- flag with its own hand-set progress number — completely disconnected from
-- the real `projects` table the Workshop screens read and write. This
-- migration adds the column that lets one idea and one project point at the
-- same record, so turning an idea into a build (or planting a build back as
-- an idea) shares one title/objective/progress instead of two.
--
-- Run this once in the Supabase SQL editor (or `supabase db push` if you
-- have the CLI linked to this project) before using the new "Make it a
-- Project" / "Plant in Garden" actions — the app code already expects this
-- column to exist.

alter table public.garden_cores
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists garden_cores_project_id_idx on public.garden_cores (project_id);

-- A project should only ever be represented by one idea in the garden.
create unique index if not exists garden_cores_project_id_unique
  on public.garden_cores (project_id)
  where project_id is not null;
