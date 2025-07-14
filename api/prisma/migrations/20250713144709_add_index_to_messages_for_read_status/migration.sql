-- CreateIndex
CREATE INDEX "messages_receiver_id_is_read_idx" ON "messages"("receiver_id", "is_read");
