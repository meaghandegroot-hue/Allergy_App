-- Let a signed-in user delete their own account (required by the App Store
-- for apps that let people sign up). Their family profiles are deleted with it;
-- their reports stay but are no longer linked to them.

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
