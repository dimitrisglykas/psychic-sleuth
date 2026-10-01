CREATE TABLE public.case_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_code text NOT NULL CHECK (case_code IN ('001', '002')),
  invite_hash text NOT NULL UNIQUE,
  shared_clues jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  outcome jsonb,
  last_event jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.case_rooms TO service_role;
ALTER TABLE public.case_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.case_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.case_rooms(id) ON DELETE CASCADE,
  member_hash text NOT NULL UNIQUE,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 24),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.case_room_members TO service_role;
ALTER TABLE public.case_room_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX case_room_members_room_id_idx ON public.case_room_members(room_id);
CREATE INDEX case_rooms_expires_at_idx ON public.case_rooms(expires_at);

CREATE OR REPLACE FUNCTION public.set_case_room_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_case_rooms_updated_at
BEFORE UPDATE ON public.case_rooms
FOR EACH ROW EXECUTE FUNCTION public.set_case_room_updated_at();

CREATE TRIGGER set_case_room_members_updated_at
BEFORE UPDATE ON public.case_room_members
FOR EACH ROW EXECUTE FUNCTION public.set_case_room_updated_at();