CREATE TABLE public.case_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.case_rooms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.case_room_members(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 24),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.case_room_messages TO service_role;

ALTER TABLE public.case_room_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX case_room_messages_room_created_idx ON public.case_room_messages(room_id, created_at DESC);

CREATE TRIGGER set_case_room_messages_updated_at
BEFORE UPDATE ON public.case_room_messages
FOR EACH ROW EXECUTE FUNCTION public.set_case_room_updated_at();