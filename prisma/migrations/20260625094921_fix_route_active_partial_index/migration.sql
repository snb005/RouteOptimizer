-- DropIndex
DROP INDEX "Route_driverId_isActive_key";

-- CreateIndex
CREATE INDEX "Route_driverId_isActive_idx" ON "Route"("driverId", "isActive");

-- Create partial unique index: at most one isActive=true per driver
CREATE UNIQUE INDEX "Route_driverId_active_unique" ON "Route" ("driverId") WHERE "isActive" = true;
