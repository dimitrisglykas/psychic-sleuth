CREATE POLICY "Service role manages case room messages"
ON public.case_room_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);