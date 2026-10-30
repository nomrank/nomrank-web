-- The first battles: well-known rivalries between dishes on the starting lists. A battle is skipped if either dish
-- isn't in the database. Safe to re-run (a battle with the same two dishes isn't added twice).
--   pnpm dlx supabase db query --linked -f supabase/seed/launch-battles.sql
insert into public.battles (dish_a, dish_b, tag, city)
select a.id, b.id, v.tag, case when a.city = b.city then a.city end
from (values
  ('Hyderabad', 'Biryani', 'Paradise', 'Hyderabad', 'Biryani', 'Bawarchi', 'The OG biryani war'),
  ('Bengaluru', 'Dosa', 'CTR', 'Bengaluru', 'Dosa', 'Vidyarthi', 'Malleshwaram vs Basavanagudi'),
  ('Bengaluru', 'Biryani', 'Meghana', 'Bengaluru', 'Biryani', 'Nagarjuna', 'The office lunch debate'),
  ('Hyderabad', 'Biryani', 'Hotel Shadab', 'Bengaluru', 'Biryani', 'Shivaji Military', 'City war: Hyderabad vs Bengaluru'),
  ('Hyderabad', 'Biryani', 'Hotel Shadab', 'Hyderabad', 'Biryani', 'Shah Ghouse', 'Old City showdown'),
  ('Bengaluru', 'Dosa', 'The Rameshwaram', 'Bengaluru', 'Dosa', 'CTR', 'The viral queue vs the legend'),
  ('Hyderabad', 'Irani Chai', 'Cafe Niloufer', 'Hyderabad', 'Irani Chai', 'Nimrah', 'Irani chai, settle it'),
  ('Bengaluru', 'Biryani', 'Shivaji Military', 'Bengaluru', 'Biryani', 'Empire', 'Donne or late-night Empire?'),
  ('Hyderabad', 'Mandi', 'Girlfriend', 'Hyderabad', 'Mandi', 'Mandi @ 36', 'Juicy mandi face-off'),
  ('Bengaluru', 'Filter Coffee', 'Brahmin', 'Bengaluru', 'Filter Coffee', 'CTR', 'Filter coffee purists only'),
  ('Hyderabad', 'Kebab', 'Peshawri', 'Hyderabad', 'Kebab', 'Dum Pukht', 'Five-star kebab clash'),
  ('Hyderabad', 'Pizza', 'Ci Gusta', 'Hyderabad', 'Pizza', 'Pompeii', 'Hyderabad pizza, no mercy'),
  ('Bengaluru', 'Burger', 'Smash Guys', 'Bengaluru', 'Burger', 'Truffles', 'New smash vs old favourite'),
  ('Hyderabad', 'Dosa', 'Govind', 'Bengaluru', 'Dosa', 'CTR', 'City war: street dosa vs heritage dosa')
) as v (city_a, food_a, rest_a, city_b, food_b, rest_b, tag)
cross join lateral (
  select d.id, r.city from public.dishes d join public.restaurants r on r.id = d.restaurant_id join public.spaces s on s.id = d.space_id
  where r.city = v.city_a and s.name = v.food_a and r.name ilike v.rest_a || '%' and d.approved_at is not null order by d.name limit 1
) a
cross join lateral (
  select d.id, r.city from public.dishes d join public.restaurants r on r.id = d.restaurant_id join public.spaces s on s.id = d.space_id
  where r.city = v.city_b and s.name = v.food_b and r.name ilike v.rest_b || '%' and d.approved_at is not null order by d.name limit 1
) b
where not exists (select 1 from public.battles x where (x.dish_a, x.dish_b) in ((a.id, b.id), (b.id, a.id)));

select b.tag, coalesce(b.city, 'both cities') as city, da.name || ' vs ' || db.name as matchup
from public.battles b join public.dishes da on da.id = b.dish_a join public.dishes db on db.id = b.dish_b order by b.created_at, b.tag;
