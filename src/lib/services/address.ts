import type { Address } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError } from "../api";

export type AddressType = "HOME" | "WORK" | "OTHER";

export interface AddressData {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  houseFlat: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  type: AddressType;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export type AddressInput = Omit<AddressData, "id" | "userId">;

export const MAX_ADDRESSES_PER_USER = 10;

function mapAddress(a: Address): AddressData {
  return {
    id: a.id,
    userId: a.userId,
    fullName: a.fullName,
    phone: a.phone,
    houseFlat: a.houseFlat,
    street: a.street,
    landmark: a.landmark || undefined,
    city: a.city,
    state: a.state,
    pinCode: a.pinCode,
    type: a.type,
    isDefault: a.isDefault,
    latitude: a.latitude ?? undefined,
    longitude: a.longitude ?? undefined,
  };
}

/**
 * Validate Indian 6-digit Postal PIN Code
 * First digit cannot be 0. Must be exactly 6 numeric digits.
 */
export function validateIndianPinCode(pinCode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pinCode.trim());
}

/**
 * Get addresses for a user (default first)
 */
export async function getUserAddresses(userId: string): Promise<AddressData[]> {
  const list = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return list.map(mapAddress);
}

/**
 * Save new address. The first address of a user automatically becomes the default.
 */
export async function createAddress(userId: string, data: AddressInput): Promise<AddressData> {
  const count = await prisma.address.count({ where: { userId } });
  if (count >= MAX_ADDRESSES_PER_USER) {
    throw new HttpError(`You can save up to ${MAX_ADDRESSES_PER_USER} addresses.`, 400);
  }
  const makeDefault = data.isDefault || count === 0;

  const created = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: {
        userId,
        fullName: data.fullName,
        phone: data.phone,
        houseFlat: data.houseFlat,
        street: data.street,
        landmark: data.landmark || null,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        type: data.type,
        isDefault: makeDefault,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
    });
  });
  return mapAddress(created);
}

/**
 * Update existing address (must belong to the user)
 */
export async function updateAddress(id: string, userId: string, updates: Partial<AddressInput>): Promise<AddressData> {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError("Address not found", 404);

  const updated = await prisma.$transaction(async (tx) => {
    if (updates.isDefault) {
      await tx.address.updateMany({ where: { userId, NOT: { id } }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id },
      data: {
        ...(updates.fullName !== undefined ? { fullName: updates.fullName } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.houseFlat !== undefined ? { houseFlat: updates.houseFlat } : {}),
        ...(updates.street !== undefined ? { street: updates.street } : {}),
        ...(updates.landmark !== undefined ? { landmark: updates.landmark || null } : {}),
        ...(updates.city !== undefined ? { city: updates.city } : {}),
        ...(updates.state !== undefined ? { state: updates.state } : {}),
        ...(updates.pinCode !== undefined ? { pinCode: updates.pinCode } : {}),
        ...(updates.type !== undefined ? { type: updates.type } : {}),
        ...(updates.isDefault !== undefined ? { isDefault: updates.isDefault || existing.isDefault } : {}),
        ...(updates.latitude !== undefined ? { latitude: updates.latitude ?? null } : {}),
        ...(updates.longitude !== undefined ? { longitude: updates.longitude ?? null } : {}),
      },
    });
  });
  return mapAddress(updated);
}

/**
 * Delete address (must belong to the user). Promotes another address to default if needed.
 */
export async function deleteAddress(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError("Address not found", 404);

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });
  return true;
}
