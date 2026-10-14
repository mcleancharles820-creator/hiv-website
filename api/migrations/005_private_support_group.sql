-- Convert support groups into one private, live and supervised group.
-- Patient aliases and messages intentionally contain no patient/user identifiers.
BEGIN;

ALTER TABLE public.support_group_members
  ADD COLUMN IF NOT EXISTS display_alias VARCHAR(24);

ALTER TABLE public.support_group_members
  DROP CONSTRAINT IF EXISTS support_group_members_display_alias_check;
ALTER TABLE public.support_group_members
  ADD CONSTRAINT support_group_members_display_alias_check
  CHECK (display_alias IS NULL OR (char_length(display_alias) BETWEEN 3 AND 24 AND display_alias = btrim(display_alias) AND display_alias ~ '^[A-Za-z0-9_. -]+$'));

-- Keep historical group records, but expose only one active group.
UPDATE public.support_groups SET is_active = FALSE WHERE group_id <> 1;
INSERT INTO public.support_groups
  (group_id, name, detail, schedule, target_audience, facilitator_worker_id, member_count, is_active)
VALUES
  (1, 'Living Positive', 'A private, peer-led space for support and conversation.', 'Live moderated group chat', 'Patients', NULL, 0, TRUE)
ON CONFLICT (group_id) DO UPDATE SET
  name = EXCLUDED.name,
  detail = EXCLUDED.detail,
  schedule = EXCLUDED.schedule,
  target_audience = EXCLUDED.target_audience,
  is_active = TRUE;

-- Remove an invalid/unavailable supervisor so group access fails closed.
UPDATE public.support_groups g
SET facilitator_worker_id = NULL
WHERE g.group_id = 1
  AND g.facilitator_worker_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.health_workers w
    JOIN public.users u ON u.user_id = w.user_id
    WHERE w.worker_id = g.facilitator_worker_id
      AND w.is_verified = TRUE
      AND w.is_available = TRUE
      AND u.is_active = TRUE
      AND u.email_verified = TRUE
  );

CREATE UNIQUE INDEX IF NOT EXISTS support_groups_one_active_group
  ON public.support_groups (is_active)
  WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS support_group_members_alias_unique
  ON public.support_group_members (group_id, LOWER(display_alias))
  WHERE display_alias IS NOT NULL;


CREATE TABLE IF NOT EXISTS public.support_group_messages (
  message_id BIGSERIAL PRIMARY KEY,
  group_id INT NOT NULL REFERENCES public.support_groups(group_id) ON DELETE CASCADE,
  sender_alias VARCHAR(24) NOT NULL,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('member', 'supervisor')),
  message_text VARCHAR(2000) NOT NULL CHECK (char_length(btrim(message_text)) BETWEEN 1 AND 2000),
  is_redacted BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT support_group_message_alias_check CHECK (sender_alias ~ '^[A-Za-z0-9_. -]{3,24}$')
);
CREATE INDEX IF NOT EXISTS support_group_messages_timeline
  ON public.support_group_messages (group_id, sent_at DESC, message_id DESC);

-- Private server-side rate-limit records; never returned in bootstrap or realtime.
CREATE TABLE IF NOT EXISTS public.support_group_message_rate_limit_events (
  event_id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS support_group_message_rate_limit_window
  ON public.support_group_message_rate_limit_events (user_id, sent_at DESC);
REVOKE ALL ON public.support_group_message_rate_limit_events FROM anon, authenticated;
ALTER TABLE public.support_group_message_rate_limit_events ENABLE ROW LEVEL SECURITY;

-- Realtime is read-only in the browser. All writes are performed by the
-- authenticated application API, which enforces the same membership rules.
REVOKE ALL ON public.support_group_members, public.support_group_messages FROM anon, authenticated;
ALTER TABLE public.support_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_group_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.support_group_messages TO authenticated;

CREATE OR REPLACE FUNCTION public.hivelink_can_access_support_group_message(
  target_group_id INT,
  target_sent_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.support_groups g
    JOIN public.health_workers supervisor ON supervisor.worker_id = g.facilitator_worker_id
    JOIN public.users supervisor_user ON supervisor_user.user_id = supervisor.user_id
    WHERE g.group_id = target_group_id
      AND g.is_active = TRUE
      AND supervisor.is_verified = TRUE
      AND supervisor.is_available = TRUE
      AND supervisor_user.role = 'health-worker'
      AND supervisor_user.is_active = TRUE
      AND supervisor_user.email_verified = TRUE
      AND (
        supervisor_user.supabase_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.support_group_members membership
          JOIN public.patients patient ON patient.patient_id = membership.patient_id
          JOIN public.users member_user ON member_user.user_id = patient.user_id
          WHERE membership.group_id = g.group_id
            AND membership.joined_at < target_sent_at
            AND member_user.supabase_user_id = auth.uid()
            AND member_user.role = 'patient'
            AND member_user.is_active = TRUE
            AND member_user.email_verified = TRUE
            AND membership.display_alias IS NOT NULL
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.hivelink_can_access_support_group_message(INT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hivelink_can_access_support_group_message(INT, TIMESTAMPTZ) TO authenticated;


DROP POLICY IF EXISTS hivelink_support_group_messages_select ON public.support_group_messages;
CREATE POLICY hivelink_support_group_messages_select ON public.support_group_messages
  FOR SELECT TO authenticated
  USING (public.hivelink_can_access_support_group_message(group_id, sent_at));

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'support_group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_group_messages;
  END IF;
END $$;

COMMIT;
