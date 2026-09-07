-- Let agenda_instances exist without a template component.
--
-- `agenda_instances.component_id` is `not null`, but three call sites build
-- rows that never set it — Capture Inbox's "Add to Planner" destination
-- (src/screens/CaptureInbox.js), and the Planner's own "+Add" instance
-- modal (src/screens/PlannerScreen.js, InstanceModal.save()) for any item
-- that isn't seeded from an onboarding habit template. Both currently fail
-- on every save with:
--
--   null value in column "component_id" of relation "agenda_instances"
--   violates not-null constraint
--
-- component_id makes sense as required for the onboarding-template habit
-- rows (they're always instances *of* a component), but a one-off item a
-- user types into the Planner directly was never going to have one — the
-- Planner's own add flow doesn't ask for or generate one. Making the
-- column nullable is the fix; a null value still satisfies the FK to
-- components if one exists, since FK checks don't apply to nulls.
--
-- Run this once in the Supabase SQL editor (or `supabase db push`) — the
-- app code already assumes ad-hoc agenda_instances rows work without a
-- component_id.

alter table public.agenda_instances
  alter column component_id drop not null;
