import fs from "fs";
import path from "path";
import type { Address } from "@prisma/client";
import { prisma } from "../prisma";
import { HttpError } from "../api";
import { IS_PRODUCTION } from "../config";

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
  createdAt?: string;
  updatedAt?: string;
}

export type AddressInput = Omit<AddressData, "id" | "userId" | "createdAt" | "updatedAt">;

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

const DEV_ADDRESSES_FILE = path.join(process.cwd(), "src", "lib", "data", "dev-addresses.json");

function loadDevAddresses(): AddressData[] {
  try {
    if (fs.existsSync(DEV_ADDRESSES_FILE)) {
      return JSON.parse(fs.readFileSync(DEV_ADDRESSES_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load dev addresses:", e);
  }
  return [];
}

function persistDevAddresses(addresses: AddressData[]) {
  try {
    fs.writeFileSync(DEV_ADDRESSES_FILE, JSON.stringify(addresses, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist dev addresses:", e);
  }
}

const globalForAddresses = globalThis as unknown as {
  devAddresses?: AddressData[];
};

if (!globalForAddresses.devAddresses) {
  globalForAddresses.devAddresses = loadDevAddresses();
}

function getDevAddresses(): AddressData[] {
  if (!globalForAddresses.devAddresses || globalForAddresses.devAddresses.length === 0) {
    globalForAddresses.devAddresses = loadDevAddresses();
  }
  return globalForAddresses.devAddresses;
}

function saveDevAddresses(addresses: AddressData[]) {
  globalForAddresses.devAddresses = addresses;
  persistDevAddresses(addresses);
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
  try {
    const list = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    if (list.length > 0) return list.map(mapAddress);
  } catch (err) {
    if (IS_PRODUCTION) throw err;
  }
  if (!IS_PRODUCTION) {
    const addresses = getDevAddresses();
    const userList = addresses.filter((a) => a.userId === userId);
    if (userList.length > 0) return userList;
    return addresses;
  }
  return [];
}

/**
 * Save new address. The first address of a user automatically becomes the default.
 */
export async function createAddress(userId: string, data: AddressInput): Promise<AddressData> {
  try {
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
  } catch (err) {
    if (!IS_PRODUCTION) {
      console.warn("[address] DB unreachable during createAddress, storing in memory:", (err as Error).message);
      const newAddr: AddressData = {
        id: `addr-${Date.now()}`,
        userId,
        ...data,
        isDefault: data.isDefault ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const addresses = getDevAddresses();
      if (newAddr.isDefault) {
        addresses.forEach((a) => {
          if (a.userId === userId) a.isDefault = false;
        });
      }
      addresses.unshift(newAddr);
      saveDevAddresses(addresses);
      return newAddr;
    }
    throw err;
  }
}

/**
 * Update existing address (must belong to the user)
 */
export async function updateAddress(id: string, userId: string, updates: Partial<AddressInput>): Promise<AddressData> {
  try {
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
  } catch (err) {
    if (!IS_PRODUCTION) {
      const addresses = getDevAddresses();
      const idx = addresses.findIndex((a) => a.id === id);
      if (idx !== -1) {
        if (updates.isDefault) {
          addresses.forEach((a) => {
            if (a.userId === userId && a.id !== id) a.isDefault = false;
          });
        }
        addresses[idx] = { ...addresses[idx], ...updates, updatedAt: new Date().toISOString() };
        saveDevAddresses(addresses);
        return addresses[idx];
      }
    }
    throw err;
  }
}

/**
 * Delete address (must belong to the user). Promotes another address to default if needed.
 */
export async function deleteAddress(id: string, userId: string): Promise<boolean> {
  try {
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
  } catch (err) {
    if (!IS_PRODUCTION) {
      const addresses = getDevAddresses().filter((a) => a.id !== id);
      saveDevAddresses(addresses);
      return true;
    }
    throw err;
  }
}
