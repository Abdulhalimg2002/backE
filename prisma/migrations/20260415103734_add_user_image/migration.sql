-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT NOT NULL DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
