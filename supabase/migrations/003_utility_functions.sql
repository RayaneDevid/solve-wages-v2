-- Migration 003: SQL utility functions

create or replace function get_pole_for_role(r user_role)
returns pole_type as $$
begin
  return case
    when r in ('gerant_rp', 'gerant_dev', 'gerant_staff', 'gerant_discord', 'gerant_equilibrage', 'gerant_serveur') then 'gerance'::pole_type
    when r = 'administrateur' then 'administration'::pole_type
    when r in ('resp_moderation', 'moderateur_senior', 'moderateur') then 'moderation'::pole_type
    when r in ('resp_animation', 'animateur_senior', 'animateur') then 'animation'::pole_type
    when r in ('resp_mj', 'mj_senior', 'mj') then 'mj'::pole_type
    when r in ('resp_douane', 'douanier_senior', 'douanier') then 'douane'::pole_type
    else null
  end;
end;
$$ language plpgsql immutable;

create or replace function is_pole_responsible(r user_role)
returns boolean as $$
begin
  return r in ('resp_moderation', 'resp_animation', 'resp_mj', 'resp_douane');
end;
$$ language plpgsql immutable;

create or replace function get_current_week()
returns table(week_start date, week_end date) as $$
begin
  return query select
    date_trunc('week', current_date)::date as week_start,
    (date_trunc('week', current_date) + interval '6 days')::date as week_end;
end;
$$ language plpgsql stable;
