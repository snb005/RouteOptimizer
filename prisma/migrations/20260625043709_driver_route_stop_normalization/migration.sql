-- CreateEnum
CREATE TYPE "StopRole" AS ENUM ('DRIVER', 'STOP', 'SHOP');

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "vehicle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "raw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "totalDistance" DOUBLE PRECISION NOT NULL,
    "totalDuration" DOUBLE PRECISION NOT NULL,
    "encodedPolyline" TEXT NOT NULL,
    "orderedPath" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "role" "StopRole" NOT NULL DEFAULT 'STOP',
    "remark" TEXT,
    "visitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "routeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiLog" (
    "id" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_lat_lng_key" ON "Location"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "Route_cacheKey_key" ON "Route"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "Route_driverId_isActive_key" ON "Route"("driverId", "isActive");

-- CreateIndex
CREATE INDEX "RouteStop_routeId_idx" ON "RouteStop"("routeId");

-- CreateIndex
CREATE INDEX "RouteStop_locationId_idx" ON "RouteStop"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_routeId_stopOrder_key" ON "RouteStop"("routeId", "stopOrder");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
