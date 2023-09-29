/*
  Warnings:

  - The primary key for the `Status` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Status` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `Ticket` table. All the data in the column will be lost.
  - Added the required column `state` to the `Status` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusState` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Status" (
    "state" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Status" ("createdAt", "label") SELECT "createdAt", "label" FROM "Status";
DROP TABLE "Status";
ALTER TABLE "new_Status" RENAME TO "Status";
CREATE TABLE "new_Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "statusState" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ticket_statusState_fkey" FOREIGN KEY ("statusState") REFERENCES "Status" ("state") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("content", "createdAt", "id", "image_url", "title") SELECT "content", "createdAt", "id", "image_url", "title" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_statusState_key" ON "Ticket"("statusState");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
