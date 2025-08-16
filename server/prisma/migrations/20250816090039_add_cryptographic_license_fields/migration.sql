-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerNumber" TEXT,
    "domain" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "priceInterval" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "expiresAt" DATETIME,
    "lastApiAccessAt" DATETIME,
    "apiAccessCountHour" INTEGER NOT NULL DEFAULT 0,
    "apiAccessHourKey" TEXT,
    "isCryptographic" BOOLEAN NOT NULL DEFAULT false,
    "requiresEmailVerification" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" DATETIME,
    "verificationToken" TEXT,
    "verificationExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "LicenseType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_License" ("apiAccessCountHour", "apiAccessHourKey", "code", "createdAt", "customerEmail", "customerName", "customerNumber", "domain", "expiresAt", "id", "lastApiAccessAt", "notes", "priceCents", "priceInterval", "status", "typeId", "updatedAt") SELECT "apiAccessCountHour", "apiAccessHourKey", "code", "createdAt", "customerEmail", "customerName", "customerNumber", "domain", "expiresAt", "id", "lastApiAccessAt", "notes", "priceCents", "priceInterval", "status", "typeId", "updatedAt" FROM "License";
DROP TABLE "License";
ALTER TABLE "new_License" RENAME TO "License";
CREATE UNIQUE INDEX "License_code_key" ON "License"("code");
CREATE UNIQUE INDEX "License_verificationToken_key" ON "License"("verificationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
