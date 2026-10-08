-- WhatsApp-only appointment booking: the professional configures their
-- available days/hours here; no appointment is ever stored anywhere (see
-- the feature's design conversation) -- the client picks a free slot and
-- it just opens WhatsApp with a prefilled message, the professional
-- confirms (or not) over that same chat. This column is therefore pure
-- configuration, same RLS story as form_data/sections_config: the owner
-- can read/write their own row via the existing landings_update_own
-- policy, no new policy needed.
alter table public.landings
  add column turnos_config jsonb not null default jsonb_build_object(
    'enabled', false,
    'slotDurationMinutes', 30,
    'daysAhead', 30,
    'worksHolidays', false,
    'weeklySchedule', jsonb_build_object(
      '0', jsonb_build_object('enabled', false, 'ranges', '[]'::jsonb),
      '1', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00'))),
      '2', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00'))),
      '3', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00'))),
      '4', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00'))),
      '5', jsonb_build_object('enabled', true, 'ranges', jsonb_build_array(jsonb_build_object('start', '09:00', 'end', '13:00'))),
      '6', jsonb_build_object('enabled', false, 'ranges', '[]'::jsonb)
    ),
    'blockedDates', '[]'::jsonb
  );
