import { cacheDelete, cacheGet, cacheSet } from "@/libs/cache.js";
import prisma from "@/libs/prisma.js";
import { EBadgeVariant } from "@saleshub-tsm/types";

const CONCERN_CATEGORIES_CACHE_KEY =
  'saleshub:master:concern-categories';

const CONCERN_STATUS_CACHE_KEY =
  'saleshub:master:concern-status';

const CACHE_TTL = 3600;

export const getConcerns = async () => {
  try {
    const cached = await cacheGet<
      Awaited<
        ReturnType<typeof prisma.concern_categories.findMany>
      >
    >(CONCERN_CATEGORIES_CACHE_KEY);

    if (cached) {
      return cached;
    }

    const data =
      await prisma.concern_categories.findMany();

    await cacheSet(
      CONCERN_CATEGORIES_CACHE_KEY,
      data,
      CACHE_TTL,
    );

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createCategory = async (
  data: { name: string; description: string }
) => {
  try {
    const { name, description } = data;

    const category = await prisma.concern_categories.create({
      data: {
        name,
        description,
      },
    });

    // Invalidate cache setelah database berhasil berubah
    await cacheDelete(CONCERN_CATEGORIES_CACHE_KEY);

    return category;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateCategory = async (
  id: number,
  data: { name?: string; description?: string }
) => {
  try {
    const category = await prisma.concern_categories.update({
      where: {
        id: BigInt(id),
      },
      data: {
        ...(data.name !== undefined
          ? { name: data.name }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
      },
    });

    // Invalidate cache setelah update berhasil
    await cacheDelete(CONCERN_CATEGORIES_CACHE_KEY);

    return category;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteCategory = async (id: number) => {
  try {
    const category = await prisma.concern_categories.delete({
      where: {
        id: BigInt(id),
      },
    });

    // Invalidate cache setelah delete berhasil
    await cacheDelete(CONCERN_CATEGORIES_CACHE_KEY);

    return category;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
export const getConcernStatuses = async () => {
  try {
    const cached = await cacheGet<
      Awaited<
        ReturnType<typeof prisma.concern_status.findMany>
      >
    >(CONCERN_STATUS_CACHE_KEY);

    if (cached) {
      return cached;
    }

    const data =
      await prisma.concern_status.findMany();

    await cacheSet(
      CONCERN_STATUS_CACHE_KEY,
      data,
      CACHE_TTL,
    );

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


export const createStatus = async (data: { status: string, level: EBadgeVariant, icon: string, requires_action?: boolean }) => {
  try {
    const { status, level, icon, requires_action } = data
    const statusData = await prisma.concern_status.create({
      data: {
        status,
        level,
        icon,
        requires_action
      }
    })
    return statusData
  } catch (error) {
    console.error(error);
    throw error;
  }
}


export const updateStatus = async (
  id: number,
  data: { status?: string, level?: EBadgeVariant, icon?: string, requires_action?: boolean }
) => {
  try {
    return await prisma.concern_status.update({
      where: {
        id: BigInt(id),
      },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.requires_action !== undefined ? { requires_action: data.requires_action } : {}),
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};


export const deleteStatus = async (id: number) => {
  try {
    return await prisma.concern_status.delete({
      where: {
        id: BigInt(id),
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
