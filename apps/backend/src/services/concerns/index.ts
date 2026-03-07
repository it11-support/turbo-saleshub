import prisma from "@/libs/prisma.js";

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
