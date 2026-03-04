import prisma from "@/libs/prisma.js";

export const getConcerns = async () => {
  try {
    return await prisma.concern_categories.findMany();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
