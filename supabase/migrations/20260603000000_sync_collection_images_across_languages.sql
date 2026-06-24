begin;

update collections target
set
  img_path = source.img_path,
  img_position = coalesce(target.img_position, source.img_position)
from collections source
where target.ref = source.ref
  and target.lang <> source.lang
  and nullif(trim(target.img_path), '') is null
  and nullif(trim(source.img_path), '') is not null;

commit;
