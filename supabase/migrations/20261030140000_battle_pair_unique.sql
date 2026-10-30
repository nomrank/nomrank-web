-- A pair of dishes fights once, whichever side each is on.
create unique index battles_pair_idx on public.battles (least(dish_a, dish_b), greatest(dish_a, dish_b));
