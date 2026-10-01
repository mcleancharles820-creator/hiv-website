-- Lock browser Supabase access to chat-only, read-only Realtime subscriptions.
-- All writes continue to go through the role-checked Vercel API.
CREATE OR REPLACE FUNCTION public.hivelink_can_access_chat_session(target_session_id INT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_sessions session
    JOIN public.patients patient ON patient.patient_id = session.patient_id
    JOIN public.users patient_user ON patient_user.user_id = patient.user_id
    LEFT JOIN public.health_workers worker
      ON worker.worker_id = patient.assigned_worker_id
    LEFT JOIN public.users worker_user ON worker_user.user_id = worker.user_id
    WHERE session.chat_session_id = target_session_id
      AND (
        (patient_user.supabase_user_id = auth.uid() AND patient_user.is_active AND patient_user.email_verified)
        OR (worker_user.supabase_user_id = auth.uid() AND worker_user.is_active AND worker_user.email_verified)
        OR EXISTS (
          SELECT 1 FROM public.users admin_user
          WHERE admin_user.supabase_user_id = auth.uid()
            AND admin_user.role = 'admin'
            AND admin_user.is_active
            AND admin_user.email_verified
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.hivelink_can_access_chat_session(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hivelink_can_access_chat_session(INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.hivelink_can_access_patient(target_patient_id INT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patients patient
    JOIN public.users patient_user ON patient_user.user_id = patient.user_id
    WHERE patient.patient_id = target_patient_id
      AND (
        (patient_user.supabase_user_id = auth.uid() AND patient_user.is_active AND patient_user.email_verified)
        OR EXISTS (
          SELECT 1 FROM public.health_workers worker
          JOIN public.users worker_user ON worker_user.user_id = worker.user_id
          WHERE worker.worker_id = patient.assigned_worker_id
            AND worker_user.supabase_user_id = auth.uid()
            AND worker_user.is_active AND worker_user.email_verified
        )
        OR EXISTS (
          SELECT 1 FROM public.users admin_user
          WHERE admin_user.supabase_user_id = auth.uid()
            AND admin_user.role = 'admin'
            AND admin_user.is_active AND admin_user.email_verified
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.hivelink_can_access_patient(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hivelink_can_access_patient(INT) TO authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.patients REPLICA IDENTITY FULL;
GRANT SELECT ON public.chat_sessions, public.chat_messages, public.patients TO authenticated;

DROP POLICY IF EXISTS hivelink_patients_select ON public.patients;
CREATE POLICY hivelink_patients_select ON public.patients
  FOR SELECT TO authenticated
  USING (public.hivelink_can_access_patient(patient_id));

DROP POLICY IF EXISTS hivelink_chat_sessions_select ON public.chat_sessions;
CREATE POLICY hivelink_chat_sessions_select ON public.chat_sessions
  FOR SELECT TO authenticated
  USING (public.hivelink_can_access_chat_session(chat_session_id));

DROP POLICY IF EXISTS hivelink_chat_messages_select ON public.chat_messages;
CREATE POLICY hivelink_chat_messages_select ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.hivelink_can_access_chat_session(chat_session_id));

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'patients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
  END IF;
END $$;
