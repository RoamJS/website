insert into private.website_plugins (slug)
values ('media-gallery')
on conflict (slug) do nothing;
