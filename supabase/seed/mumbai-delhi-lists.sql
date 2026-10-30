-- Starting lists for Mumbai and Delhi: real dishes at well-known places, from public food guides (see SOURCES.md).
-- They start with no ratings. Safe to re-run (everything is skipped if already there).
--   pnpm dlx supabase db query --linked -f supabase/seed/mumbai-delhi-lists.sql
begin;

insert into public.spaces (name, origin_region)
select v.name, v.region from (values
  ('Misal Pav', 'maharashtra'),
  ('Seafood', null::text),
  ('Paratha', null::text),
  ('Chaat', null::text)
) as v (name, region)
where not exists (select 1 from public.spaces s where lower(s.name) = lower(v.name));

insert into public.restaurants (slug, name, area, city) values
  ('ashok-vada-pav', 'Ashok Vada Pav', 'Dadar', 'Mumbai'),
  ('aaram-vada-pav', 'Aaram Vada Pav', 'Fort', 'Mumbai'),
  ('canon-pav-bhaji', 'Canon Pav Bhaji', 'Fort', 'Mumbai'),
  ('aaswad', 'Aaswad', 'Dadar', 'Mumbai'),
  ('bademiya', 'Bademiya', 'Colaba', 'Mumbai'),
  ('mahesh-lunch-home', 'Mahesh Lunch Home', 'Juhu', 'Mumbai'),
  ('jai-hind-lunch-home', 'Jai Hind Lunch Home', 'Bandra', 'Mumbai'),
  ('lucky-restaurant', 'Lucky Restaurant', 'Bandra', 'Mumbai'),
  ('trishna', 'Trishna', 'Fort', 'Mumbai'),
  ('cafe-madras', 'Cafe Madras', 'Matunga', 'Mumbai'),
  ('ram-ashraya', 'Ram Ashraya', 'Matunga', 'Mumbai'),
  ('sita-ram-diwan-chand', 'Sita Ram Diwan Chand', 'Paharganj', 'Delhi'),
  ('chache-di-hatti', 'Chache Di Hatti', 'Kamla Nagar', 'Delhi'),
  ('moti-mahal', 'Moti Mahal', 'Daryaganj', 'Delhi'),
  ('kake-da-hotel', 'Kake Da Hotel', 'Connaught Place', 'Delhi'),
  ('karims', 'Karim''s', 'Jama Masjid', 'Delhi'),
  ('al-jawahar', 'Al Jawahar', 'Jama Masjid', 'Delhi'),
  ('al-kakapo', 'Al Kakapo', 'Greater Kailash', 'Delhi'),
  ('babu-ram-parantha', 'Babu Ram Parantha', 'Chandni Chowk', 'Delhi'),
  ('dolma-aunty-momos', 'Dolma Aunty Momos', 'Lajpat Nagar', 'Delhi'),
  ('qds', 'QD''s', 'North Campus', 'Delhi'),
  ('natraj-dahi-bhalle', 'Natraj Dahi Bhalle', 'Chandni Chowk', 'Delhi'),
  ('old-famous-jalebi-wala', 'Old Famous Jalebi Wala', 'Chandni Chowk', 'Delhi'),
  ('kuremal-mohan-lal-kulfi', 'Kuremal Mohan Lal Kulfi Wale', 'Chawri Bazar', 'Delhi')
on conflict (slug) do nothing;

insert into public.dishes (restaurant_id, name, diet, space_id, approved_at)
select r.id, v.dish, v.diet, s.id, now() from (values
  ('ashok-vada-pav', 'Vada Pav', 'veg', 'Vada Pav'),
  ('aaram-vada-pav', 'Vada Pav', 'veg', 'Vada Pav'),
  ('aaram-vada-pav', 'Misal Pav', 'veg', 'Misal Pav'),
  ('sardar-pav-bhaji', 'Butter Pav Bhaji', 'veg', 'Pav Bhaji'),
  ('canon-pav-bhaji', 'Pav Bhaji', 'veg', 'Pav Bhaji'),
  ('aaswad', 'Misal Pav', 'veg', 'Misal Pav'),
  ('bademiya', 'Mutton Seekh Kebab', 'non_veg', 'Kebab'),
  ('mahesh-lunch-home', 'Prawns Mahesh Special Biryani', 'non_veg', 'Biryani'),
  ('mahesh-lunch-home', 'Fish Biryani', 'non_veg', 'Biryani'),
  ('jai-hind-lunch-home', 'Prawns Biryani', 'non_veg', 'Biryani'),
  ('lucky-restaurant', 'Arabi Mutton Biryani', 'non_veg', 'Biryani'),
  ('trishna', 'Prawns Koliwada', 'non_veg', 'Seafood'),
  ('trishna', 'King Crab', 'non_veg', 'Seafood'),
  ('cafe-madras', 'Mysore Masala Dosa', 'veg', 'Dosa'),
  ('cafe-madras', 'Idli', 'veg', 'Idli'),
  ('cafe-madras', 'Filter Coffee', 'veg', 'Filter Coffee'),
  ('ram-ashraya', 'Neer Dosa', 'veg', 'Dosa'),
  ('ram-ashraya', 'Filter Coffee', 'veg', 'Filter Coffee'),
  ('sita-ram-diwan-chand', 'Chole Bhature', 'veg', 'Chole Bhature'),
  ('chache-di-hatti', 'Chole Bhature', 'veg', 'Chole Bhature'),
  ('moti-mahal', 'Butter Chicken', 'non_veg', 'Butter Chicken'),
  ('kake-da-hotel', 'Butter Chicken', 'non_veg', 'Butter Chicken'),
  ('karims', 'Nihari', 'non_veg', 'Nihari'),
  ('karims', 'Mutton Seekh Kebab', 'non_veg', 'Kebab'),
  ('al-jawahar', 'Nihari', 'non_veg', 'Nihari'),
  ('al-jawahar', 'Seekh Kebab', 'non_veg', 'Kebab'),
  ('al-jawahar', 'Biryani', 'non_veg', 'Biryani'),
  ('al-kakapo', 'Afghani Chicken', 'non_veg', 'Kebab'),
  ('babu-ram-parantha', 'Stuffed Parantha', 'veg', 'Paratha'),
  ('dolma-aunty-momos', 'Veg Momos', 'veg', 'Momos'),
  ('qds', 'Tandoori Momos', 'non_veg', 'Momos'),
  ('natraj-dahi-bhalle', 'Dahi Bhalla', 'veg', 'Chaat'),
  ('natraj-dahi-bhalle', 'Aloo Tikki', 'veg', 'Chaat'),
  ('old-famous-jalebi-wala', 'Jalebi', 'veg', 'Desserts'),
  ('kuremal-mohan-lal-kulfi', 'Stuffed Mango Kulfi', 'veg', 'Desserts')
) as v (slug, dish, diet, space)
join public.restaurants r on r.slug = v.slug
join public.spaces s on lower(s.name) = lower(v.space)
on conflict (restaurant_id, name_key) do nothing;

insert into public.battles (dish_a, dish_b, tag, city)
select a.id, b.id, v.tag, v.city
from (values
  ('ashok-vada-pav', 'Vada Pav', 'aaram-vada-pav', 'Vada Pav', 'Dadar vs CST: the vada pav question', 'Mumbai'),
  ('sardar-pav-bhaji', 'Butter Pav Bhaji', 'canon-pav-bhaji', 'Pav Bhaji', 'Pav bhaji, extra butter', 'Mumbai'),
  ('aaswad', 'Misal Pav', 'aaram-vada-pav', 'Misal Pav', 'Who has the better misal?', 'Mumbai'),
  ('mahesh-lunch-home', 'Prawns Mahesh Special Biryani', 'jai-hind-lunch-home', 'Prawns Biryani', 'Prawn biryani face-off', 'Mumbai'),
  ('moti-mahal', 'Butter Chicken', 'kake-da-hotel', 'Butter Chicken', 'The butter chicken debate', 'Delhi'),
  ('karims', 'Nihari', 'al-jawahar', 'Nihari', 'Jama Masjid nihari, settle it', 'Delhi'),
  ('sita-ram-diwan-chand', 'Chole Bhature', 'chache-di-hatti', 'Chole Bhature', 'Paharganj vs Kamla Nagar', 'Delhi'),
  ('dolma-aunty-momos', 'Veg Momos', 'qds', 'Tandoori Momos', 'Steamed or tandoori?', 'Delhi')
) as v (slug_a, dish_a, slug_b, dish_b, tag, city)
join public.dishes a on a.name = v.dish_a and a.restaurant_id = (select id from public.restaurants where slug = v.slug_a)
join public.dishes b on b.name = v.dish_b and b.restaurant_id = (select id from public.restaurants where slug = v.slug_b)
where not exists (select 1 from public.battles x where (x.dish_a, x.dish_b) in ((a.id, b.id), (b.id, a.id)));

select city, count(*) from public.restaurants group by city order by city;
commit;
