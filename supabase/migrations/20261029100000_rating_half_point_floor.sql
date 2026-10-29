-- A dish can be rated down to 0.5 (still in half steps; ratings_score_half_steps keeps that).
alter table public.ratings drop constraint ratings_score_check;
alter table public.ratings add constraint ratings_score_check check (score >= 0.5 and score <= 10);
