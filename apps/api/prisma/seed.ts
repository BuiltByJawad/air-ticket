import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

const SeedEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(12),
  SEED_AGENCY_NAME: z.string().min(1).optional()
});

type SeedEnv = z.infer<typeof SeedEnvSchema>;

function loadSeedEnv(): SeedEnv {
  return SeedEnvSchema.parse({
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    SEED_AGENCY_NAME: process.env.SEED_AGENCY_NAME
  });
}

async function main() {
  const env = loadSeedEnv();
  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);

    const agency = env.SEED_AGENCY_NAME
      ? await prisma.agency.upsert({
          where: { name: env.SEED_AGENCY_NAME },
          update: {},
          create: { name: env.SEED_AGENCY_NAME }
        })
      : null;

    await prisma.user.upsert({
      where: { email: env.SEED_ADMIN_EMAIL.toLowerCase() },
      update: {
        passwordHash,
        role: 'admin',
        agencyId: agency?.id ?? null
      },
      create: {
        email: env.SEED_ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: 'admin',
        agencyId: agency?.id ?? null
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (err: unknown) => {
  const prisma = new PrismaClient();
  await prisma.$disconnect();
  throw err;
});
