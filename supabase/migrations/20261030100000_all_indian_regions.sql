-- Every Indian state and union territory is a home region (28 + 8), so anyone can pick where their food roots are.
-- `kind` groups them in the pickers. Existing rows keep their slugs, so nobody's home region changes.
alter table public.regions add column kind text not null default 'state' check (kind in ('state', 'ut'));
update public.regions set kind = 'ut' where slug = 'delhi'; -- shown as "Delhi NCR"

insert into public.regions (slug, name, demonym, kind) values
  ('arunachal-pradesh', 'Arunachal Pradesh', 'Arunachalis', 'state'),
  ('assam', 'Assam', 'Assamese', 'state'),
  ('bihar', 'Bihar', 'Biharis', 'state'),
  ('chhattisgarh', 'Chhattisgarh', 'Chhattisgarhis', 'state'),
  ('goa', 'Goa', 'Goans', 'state'),
  ('haryana', 'Haryana', 'Haryanvis', 'state'),
  ('himachal-pradesh', 'Himachal Pradesh', 'Himachalis', 'state'),
  ('jharkhand', 'Jharkhand', 'Jharkhandis', 'state'),
  ('madhya-pradesh', 'Madhya Pradesh', 'Madhya Pradeshis', 'state'),
  ('manipur', 'Manipur', 'Manipuris', 'state'),
  ('meghalaya', 'Meghalaya', 'Meghalayans', 'state'),
  ('mizoram', 'Mizoram', 'Mizos', 'state'),
  ('nagaland', 'Nagaland', 'Nagas', 'state'),
  ('odisha', 'Odisha', 'Odias', 'state'),
  ('rajasthan', 'Rajasthan', 'Rajasthanis', 'state'),
  ('sikkim', 'Sikkim', 'Sikkimese', 'state'),
  ('tripura', 'Tripura', 'Tripuris', 'state'),
  ('uttar-pradesh', 'Uttar Pradesh', 'Uttar Pradeshis', 'state'),
  ('uttarakhand', 'Uttarakhand', 'Uttarakhandis', 'state'),
  ('andaman-and-nicobar-islands', 'Andaman and Nicobar Islands', 'people from the Andaman and Nicobar Islands', 'ut'),
  ('chandigarh', 'Chandigarh', 'Chandigarhians', 'ut'),
  ('dadra-and-nagar-haveli-and-daman-and-diu', 'Dadra and Nagar Haveli and Daman and Diu', 'people from Daman and Diu and Dadra and Nagar Haveli', 'ut'),
  ('jammu-and-kashmir', 'Jammu and Kashmir', 'people from Jammu and Kashmir', 'ut'),
  ('ladakh', 'Ladakh', 'Ladakhis', 'ut'),
  ('lakshadweep', 'Lakshadweep', 'Lakshadweep islanders', 'ut'),
  ('puducherry', 'Puducherry', 'Puducherrians', 'ut')
on conflict (slug) do nothing;
