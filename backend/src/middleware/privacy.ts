import { prisma } from "../prisma";

/**
 * checkNotBlocked — İki kullanıcı arasında block ilişkisi olup olmadığını kontrol eder.
 * Block ilişkisi çift yönlü kontrol edilir: A→B veya B→A bloklarsa 403 hatası fırlatır.
 *
 * @param requesterId - İsteği yapan kullanıcının User.id'si (auth.uid)
 * @param targetUserId - Hedef kullanıcının User.id'si (auth.uid)
 * @throws {BlockedError} - Eğer block ilişkisi mevcutsa 403 kodu ile hata fırlatır.
 */
export class BlockedError extends Error {
  readonly status = 403 as const;
  readonly code = "BLOCKED";

  constructor() {
    super("Bu kullanıcıya erişim engellendi.");
    this.name = "BlockedError";
  }
}

export async function checkNotBlocked(
  requesterId: string,
  targetUserId: string
): Promise<void> {
  // Kendine erişim her zaman izinli
  if (requesterId === targetUserId) return;

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: requesterId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: requesterId },
      ],
    },
    select: { id: true },
  });

  if (block) {
    throw new BlockedError();
  }
}

/**
 * filterBlockedProfiles — Bir profil listesinden bloklananları filtreler.
 * Discover gibi liste dönen endpointlerde kullanılır.
 *
 * @param requesterId - İsteği yapan kullanıcının User.id'si
 * @param profileUserIds - Kontrol edilecek kullanıcı id listesi (User.id)
 * @returns Bloklanan User.id kümesi
 */
export async function getBlockedUserIds(requesterId: string): Promise<Set<string>> {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: requesterId },
        { blockedId: requesterId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedIds = new Set<string>();
  for (const b of blocks) {
    if (b.blockerId === requesterId) {
      blockedIds.add(b.blockedId);
    } else {
      blockedIds.add(b.blockerId);
    }
  }
  return blockedIds;
}
