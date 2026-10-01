revoke truncate, references, trigger on public.profiles,public.entries,public.transactions,public.plans,public.goals,public.maintenance_items,public.debts,public.my_bike,public.vehicle_goals from anon,authenticated;
revoke insert,update,delete on public.profiles from anon;
revoke all on function public.handle_new_user() from public,anon,authenticated;
notify pgrst,'reload schema';
