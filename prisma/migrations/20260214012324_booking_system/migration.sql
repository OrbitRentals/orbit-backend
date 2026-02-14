-- CreateIndex
CREATE INDEX "Booking_vehicleId_startDate_endDate_idx" ON "Booking"("vehicleId", "startDate", "endDate");
