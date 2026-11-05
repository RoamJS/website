insert into private.website_plugins (slug)
values ('find-in-page')
on conflict (slug) do nothing;
