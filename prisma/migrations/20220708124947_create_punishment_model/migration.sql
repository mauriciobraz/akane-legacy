-- CreateEnum
CREATE TYPE "PunishmentType" AS ENUM ('MUTE', 'WARN', 'KICK', 'BAN', 'REVERT');

-- CreateTable
CREATE TABLE "Punishment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "punisherId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "type" "PunishmentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "time" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Punishment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Punishment" ADD CONSTRAINT "Punishment_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punishment" ADD CONSTRAINT "Punishment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punishment" ADD CONSTRAINT "Punishment_punisherId_fkey" FOREIGN KEY ("punisherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
