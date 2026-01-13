import { Prisma } from '@/generated/prisma/client.js';
import prisma from '@/libs/prisma.js';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import fileUpload from 'express-fileupload'

export type ImageResponseType = never;

export const image = async (req: Request, res: Response) => {
  try {
    const { itemCode } = req.params;
    const { nofallback } = req.query; // optional param
    const baseDir = path.join(process.cwd(), 'public/images/product');

    const png = path.join(baseDir, `${itemCode}.png`);
    const jpg = path.join(baseDir, `${itemCode}.jpg`);
    const jpeg = path.join(baseDir, `${itemCode}.jpeg`);
    const fallback = path.join(baseDir, 'no-image.png');

    // cek file asli
    if (fs.existsSync(png)) return res.sendFile(png);
    if (fs.existsSync(jpg)) return res.sendFile(jpg);
    if (fs.existsSync(jpeg)) return res.sendFile(jpeg);

    if (nofallback === '1') {
      return res.json({ exists: false });
    }

    // default fallback lama
    return res.sendFile(fallback);
  } catch (error) {
    console.error(error);
    const fallback = path.join(process.cwd(), 'public/images/product/no-image.png');
    return res.sendFile(fallback);
  }
};

// Delete image
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { itemCode } = req.params;
    const baseDir = path.join(process.cwd(), 'public/images/product');

    const png = path.join(baseDir, `${itemCode}.png`);
    const jpg = path.join(baseDir, `${itemCode}.jpg`);
    const jpeg = path.join(baseDir, `${itemCode}.jpeg`);
    let fileDeleted = false;
    // cek file asli dan hapus jika ada
    if (fs.existsSync(png)) {
      fs.unlinkSync(png);
      fileDeleted = true;
    }
    if (fs.existsSync(jpg)) {
      fs.unlinkSync(jpg);
      fileDeleted = true;
    }
    if (fs.existsSync(jpeg)) {
      fs.unlinkSync(jpeg);
      fileDeleted = true;
    }
    if (fileDeleted) {
      return res.status(200).json({ message: 'Image deleted' });
    } else {
      return res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    } else {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const imageUpload = async (req: Request, res: Response) => {
  try {
    const baseDir = path.join(process.cwd(), 'public/images/product')

    const { itemCode } = req.params

    console.log('Uploading image for itemCode:', itemCode)
    console.log('Files received:', req.files)
    if (!itemCode) return res.status(400).json({ message: 'itemCode required' })

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // ambil file pertama
    const firstKey = Object.keys(req.files)[0]
    const imageFile = req.files[firstKey] as fileUpload.UploadedFile
    const ext = path.extname(imageFile.name).toLowerCase()
    const fileName = `${itemCode}${ext}`
    const filePath = path.join(baseDir, fileName)

    // Hapus semua file lama dengan nama itemCode.*
    const filesInDir = fs.readdirSync(baseDir)
    filesInDir.forEach((f) => {
      if (f.startsWith(itemCode + '.')) {
        fs.unlinkSync(path.join(baseDir, f))
      }
    })

    // Simpan file baru
    await imageFile.mv(filePath)

    return res.json({
      message: 'Upload successful',
      url: `/images/product/${fileName}`,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Failed to upload image' })
  }
}

export const fetchProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category } = req.query;
    const perPage = limit ? Number(limit) : 10;
    const currentPage = page ? Number(page) : 1;
    const keyword = typeof search === 'string' && search.trim() !== '' ? search.trim() : null;

    const where: Prisma.productsWhereInput = {
      ...(category ? { ItmsGrpCod: Number(category) } : {}),
      ...(keyword
        ? {
            OR: [
              {
                ItemCode: { contains: keyword },
              },
              {
                ItemName: { contains: keyword },
              },
              {
                ItmsGrpNam: { contains: keyword },
              },
            ],
          }
        : {}),
    };
    const products = await prisma.products.findMany({
      skip: (currentPage - 1) * perPage,
      take: perPage,
      where,
    });

    const totalRecords = await prisma.products.count({ where });

    const totalPages = Math.ceil(totalRecords / perPage);

    const producCategories = await prisma.products.findMany({
      select: {
        ItmsGrpCod: true,
        ItmsGrpNam: true,
      },
      distinct: ['ItmsGrpCod'],
    });

    return res.status(200).json({
      message: 'Products fetched successfully',
      data: {
        items: products,
        totalRecords,
        totalPages,
        categories: producCategories,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
