-- Enable Realtime on matches so status changes (accept/decline/mark-delivered/mark-received)
-- push live to both parties' open chat screens, the same way messages already do.
do $$ begin
  alter publication supabase_realtime add table matches;
exception when others then null; end $$;
