-- Add RLS policies for deleting conversations and messages

-- Allow users to delete conversations they participate in
CREATE POLICY "Users can delete conversations they participate in" ON public.conversations
  FOR DELETE USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- Allow users to delete messages in conversations they participate in
CREATE POLICY "Users can delete messages in their conversations" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );
