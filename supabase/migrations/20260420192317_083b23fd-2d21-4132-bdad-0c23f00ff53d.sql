
ALTER FUNCTION public.set_updated_at() SET search_path = public;
-- handle_new_user já tem search_path definido, mas garante:
ALTER FUNCTION public.handle_new_user() SET search_path = public;
