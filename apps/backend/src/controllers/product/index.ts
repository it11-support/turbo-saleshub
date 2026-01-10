
import { Request, Response } from "express"
import path from "path";
import fs from "fs";

export type ImageResponseType = never;

export const image = async (req: Request, res: Response<ImageResponseType>) => {
  try {
    const { itemCode } = req.params;

    const baseDir = path.join(process.cwd(), "public/images/product");

    const png = path.join(baseDir, `${itemCode}.png`);
    const jpg = path.join(baseDir, `${itemCode}.jpg`);
    const fallback = path.join(baseDir, "no-image.png");

    if (fs.existsSync(png)) {
      return res.sendFile(png);
    }

    if (fs.existsSync(jpg)) {
      return res.sendFile(jpg);
    }

    return res.sendFile(fallback);

  } catch (error) {
    console.error(error);

    const fallback = path.join(process.cwd(), "public/images/product/no-image.png");
    return res.sendFile(fallback);
  }
}
