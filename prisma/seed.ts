import "dotenv/config";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/password";
import { WA_PHONES } from "../lib/site-config";

async function main() {
  await prisma.tenantDestination.deleteMany();
  await prisma.tenant.deleteMany();

  const password =
    process.env.SEED_TENANT_PASSWORD?.trim() || "winsurf123";

  const tenant = await prisma.tenant.create({
    data: {
      slug: "winsurf",
      name: "Winsurf",
      active: true,
      adminPasswordHash: hashPassword(password),
      destinations: {
        create: WA_PHONES.map((phone, index) => ({
          type: "whatsapp",
          number: phone.number,
          label: phone.label ?? null,
          active: true,
          sortOrder: index,
        })),
      },
    },
  });

  console.log(
    `Seed completed: tenant ${tenant.slug} with ${WA_PHONES.length} destinations (password: ${password})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
