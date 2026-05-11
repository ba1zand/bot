import { db, usersTable, referralsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function getOrCreateUser(
  telegramId: number,
  firstName: string,
  lastName: string | undefined,
  username: string | undefined,
  referredByCode?: string
): Promise<typeof usersTable.$inferSelect> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  let referredBy: number | undefined = undefined;

  if (referredByCode) {
    const referrer = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, referredByCode))
      .limit(1);

    if (referrer.length > 0 && referrer[0].telegramId !== telegramId) {
      referredBy = referrer[0].telegramId;
    }
  }

  const referralCode = nanoid(8);

  const [newUser] = await db
    .insert(usersTable)
    .values({
      telegramId,
      firstName,
      lastName: lastName ?? null,
      username: username ?? null,
      referralCode,
      referredBy: referredBy ?? null,
    })
    .returning();

  if (referredBy) {
    await db.insert(referralsTable).values({
      referrerId: referredBy,
      refereeId: telegramId,
    });

    const [{ val }] = await db
      .select({ val: count() })
      .from(referralsTable)
      .where(eq(referralsTable.referrerId, referredBy));

    await db
      .update(usersTable)
      .set({ totalReferrals: Number(val) })
      .where(eq(usersTable.telegramId, referredBy));
  }

  return newUser;
}

export async function getUserReferrals(telegramId: number) {
  const rows = await db
    .select({
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      username: usersTable.username,
      joinedAt: usersTable.joinedAt,
    })
    .from(referralsTable)
    .innerJoin(usersTable, eq(referralsTable.refereeId, usersTable.telegramId))
    .where(eq(referralsTable.referrerId, telegramId))
    .orderBy(desc(referralsTable.createdAt));

  return rows;
}

export async function getLeaderboard(limit = 10) {
  return db
    .select({
      firstName: usersTable.firstName,
      username: usersTable.username,
      totalReferrals: usersTable.totalReferrals,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.totalReferrals))
    .limit(limit);
}
