import prisma from "@/libs/prisma.js";
import { EBadgeVariant } from "@saleshub-tsm/types";

export const getConcerns = async () => {
  try {
    return await prisma.concern_categories.findMany();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const createCategory = async (data: {name: string, description: string}) => {
  try {
    const {name, description} = data
    const category = await prisma.concern_categories.create({
      data: {
        name,
        description
      }
    })
    return category
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const updateCategory = async (
  id: number,
  data: { name?: string; description?: string }
) => {
  try {
    return await prisma.concern_categories.update({
      where: {
        id: BigInt(id),
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteCategory = async (id: number) => {
  try {
    return await prisma.concern_categories.delete({
      where: {
        id: BigInt(id),
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getConcernStatuses = async () => {
  try {
    return await prisma.concern_status.findMany();
  } catch (error) {
    console.error(error);
    throw error;
  }
}


export const createStatus = async (data: {status: string, level: EBadgeVariant, icon: string}) => {
  try {
    const {status, level, icon} = data
    const statusData = await prisma.concern_status.create({
      data: {
        status,
        level,
        icon
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
  data: { status?: string, level?: EBadgeVariant, icon?: string }
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
