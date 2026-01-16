-- Create security definer function to check if user is a member of a channel
CREATE OR REPLACE FUNCTION public.is_channel_member(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_members
    WHERE user_id = _user_id
      AND channel_id = _channel_id
  )
$$;

-- Drop existing problematic policies on chat_members and chat_channels
DROP POLICY IF EXISTS "Users can view members of their channels" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view channels they are members of" ON public.chat_channels;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view members of their channels"
ON public.chat_members
FOR SELECT
USING (
  public.is_channel_member(auth.uid(), channel_id)
);

CREATE POLICY "Users can view channels they are members of"
ON public.chat_channels
FOR SELECT
USING (
  public.is_channel_member(auth.uid(), id)
);