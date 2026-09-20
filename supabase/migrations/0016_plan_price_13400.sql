-- Price update: the 'basic' plan seeded in 0003_seed.sql at $25.000/mes is
-- now $13.400/mes. An UPDATE (not editing the historical seed file), same
-- pattern as 0009/0010/0012's after-the-fact fixes to seeded catalog data.
update public.plans
set amount = 13400
where name = 'basic';
