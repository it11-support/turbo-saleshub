import { Prisma } from '@/generated/prisma/client.js';
import prisma from '@/libs/prisma.js';
import { activityLogger } from '@/services/logs/index.js';
import { AuthenticatedRequest, EProductCategory } from '@saleshub-tsm/types';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import path from 'path';

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
      res.json({ exists: false });
      return;
    }

    // default fallback lama
    res.sendFile(fallback);
  } catch (error) {
    console.error(error);
    const fallback = path.join(process.cwd(), 'public/images/product/no-image.png');
    res.sendFile(fallback);
  }
};

// Delete image
export const deleteImage = async (req: AuthenticatedRequest, res: Response) => {
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
      activityLogger({
        req,
        actionType: "Product",
        description: `Product image deleted: ${itemCode}`,
        status: "SUCCESS",
      });

      res.status(200).json({ message: 'Image deleted' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const imageUpload = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const baseDir = path.join(process.cwd(), 'public/images/product');

    const { itemCode } = req.params;

    if (!itemCode) {
      res.status(400).json({ message: 'itemCode required' });
      return;
    }

    // Canonicalize and validate itemCode to prevent path traversal/injection
    const safeItemCode = itemCode.replace(/[^A-Za-z0-9_-]/g, '');
    if (!safeItemCode || safeItemCode !== itemCode) {
      res.status(400).json({ message: 'Invalid itemCode format' });
      return;
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // ambil file pertama
    const firstKey = Object.keys(req.files)[0];
    const imageFile = req.files[firstKey] as fileUpload.UploadedFile;
    const ext = path.extname(imageFile.name).toLowerCase();
    const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp']);
    if (!allowedExt.has(ext)) {
      res.status(400).json({ message: 'Invalid file extension' });
      return;
    }

    const fileName = `${safeItemCode}${ext}`;
    const resolvedBaseDir = path.resolve(baseDir);
    const resolvedFilePath = path.resolve(resolvedBaseDir, fileName);

    if (
      resolvedFilePath !== resolvedBaseDir &&
      !resolvedFilePath.startsWith(resolvedBaseDir + path.sep)
    ) {
      res.status(400).json({ message: 'Invalid file path' });
      return;
    }

    // Hapus semua file lama dengan nama itemCode.*
    const filesInDir = fs.readdirSync(baseDir);
    filesInDir.forEach((f) => {
      if (f.startsWith(safeItemCode + '.')) {
        fs.unlinkSync(path.join(baseDir, f));
      }
    });

    // Simpan file baru via temporary server-generated path, then move to final validated path
    const tmpDir = fs.mkdtempSync(path.join(resolvedBaseDir, '.upload-'));
    const tmpPath = path.join(tmpDir, `upload-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    await imageFile.mv(tmpPath);
    fs.renameSync(tmpPath, resolvedFilePath);
    fs.rmdirSync(tmpDir);

    activityLogger({
      req,
      actionType: "Product",
      description: `Product image uploaded: ${fileName}`,
      status: "SUCCESS",
    });
    res.json({
      message: 'Upload successful',
      url: `/images/product/${fileName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

export const fetchProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, category, productFocused, distributor, group } = req.query;
    const perPage = limit ? Number(limit) : 10;
    const currentPage = page ? Number(page) : 1;
    const keyword = typeof search === 'string' && search.trim() !== '' ? search.trim() : null;
    const isProductFocused = productFocused === 'true';
    const isDistributor = distributor === 'true';
    const productCategory = group as EProductCategory

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
      ...(!isProductFocused && !isDistributor
        ? { validFor: 'Y', frozenFor: 'N' }
        : {}),

      // 2. Logika OR Saling Silang (Hanya muncul jika flag terpilih)
      ...((isProductFocused || isDistributor) && {
        OR: [
          // Muncul HANYA jika tombol/checkbox Focus dinyalakan
          ...(isProductFocused
            ? [{ product_developments: { some: {} } }]
            : []),

          // Muncul HANYA jika tombol/checkbox Distributor dinyalakan
          ...(isDistributor
            ? [{
              Distributor: 'Y',
              validFor: 'Y',
              frozenFor: 'N'
            }]
            : []),
        ]
      }),
      ...(group ? { ProductCategory: productCategory } : {})
    };
    const products = await prisma.products.findMany({
      skip: (currentPage - 1) * perPage,
      take: perPage,
      where,
      include: {
        product_developments: {
          include: { subgroup: true },
        },
        sales_invoices: {
          where: {
            DocDate: {
              gte: dayjs().subtract(1, 'month').startOf('day').toDate(),
            }
          },
          select: {
            QtyKg: true,
            unitMsr: true,
            TotalSales: true,
          }
        }
      },
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

    const productList = products.map(p => {
      const unitsSold = p.sales_invoices.reduce((sum, inv) => sum + Number(inv.QtyKg ?? 0), 0);
      const revenue = p.sales_invoices.reduce(
        (sum, inv) => sum + Number(inv.TotalSales ?? 0),
        0
      );

      return {
        ...p,
        unitsSold,
        revenue
      };
    });
    res.status(200).json({
      message: 'Products fetched successfully',
      data: {
        items: productList,
        totalRecords,
        totalPages,
        categories: producCategories,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUploadProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const baseDir = path.join(process.cwd(), 'public/images/product');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ status: 'error', message: 'No file uploaded' });
      return;
    }

    const files = req.files['files'] as fileUpload.UploadedFile[] | fileUpload.UploadedFile;
    const fileArray = Array.isArray(files) ? files : [files];

    const uploaded: any[] = [];
    const invalidFiles: any[] = [];

    for (const imageFile of fileArray) {
      const originalName = imageFile.name;
      const ext = path.extname(originalName).toLowerCase();
      const itemCode = path.parse(originalName).name;
      const fileName = `${itemCode}${ext}`;
      const filePath = path.join(baseDir, fileName);

      // max 5MB
      if (imageFile.size > 5 * 1024 * 1024) {
        invalidFiles.push({ filename: originalName, reason: 'File exceeds 5MB limit' });
        continue;
      }

      const productExist = await prisma.products.findUnique({
        where: { ItemCode: itemCode },
      });

      if (!productExist) {
        invalidFiles.push({ filename: originalName, reason: 'Item code not found' });
        continue;
      }

      // hapus file lama
      fs.readdirSync(baseDir).forEach((f) => {
        if (f.startsWith(itemCode + '.')) {
          fs.unlinkSync(path.join(baseDir, f));
        }
      });

      await imageFile.mv(filePath);

      uploaded.push({
        itemCode,
        filename: fileName,
        url: `/images/product/${fileName}`,
      });
    }
    activityLogger({
      req,
      actionType: "Product",
      description: `Bulk upload of ${uploaded.length} images completed`,
      status: "SUCCESS",
    });

    res.json({
      status: invalidFiles.length ? 'partial' : 'success',
      message: invalidFiles.length ? 'Some files failed to upload' : 'Images uploaded successfully',
      data: uploaded,
      invalidFiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Bulk upload failed' });
  }
};

export const productDevelopment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, subgroupIds } = req.body;

    await prisma.product_developments.deleteMany({
      where: {
        product_id: productId,
      },
    });

    await prisma.product_developments.createMany({
      data: subgroupIds.map((subgroupId: number) => ({
        product_id: productId,
        subgroup_id: subgroupId,
      })),
    });

    const dev = await prisma.products.findUnique({
      where: { id: BigInt(productId) },
      include: {
        product_developments: {
          include: { subgroup: true },
        },
      },
    });
    if (dev) {
      activityLogger({
        req,
        actionType: "Product",
        description: `Product development updated: ${dev.ItemCode}`,
        status: "SUCCESS",
      });

      res.json({
        id: Number(dev.id),
        ItemCode: dev.ItemCode,
        ItemName: dev.ItemName,
        subgroups: dev.product_developments.map((d) => d.subgroup),
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeProductDevelopment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, subgroupIds } = req.body;

    await prisma.product_developments.deleteMany({
      where: {
        product_id: Number(productId),
        subgroup_id: {
          in: subgroupIds,
        },
      },
    });

    activityLogger({
      req,
      actionType: "Product",
      description: `Product development removed: ${productId}`,
      status: "SUCCESS",
    });
    res.json({ message: 'Success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { product_id, productInfo } = req.body;
    const product = await prisma.products.update({
      where: { id: BigInt(product_id) },
      data: {
        ProductInfo: productInfo,
      },
    });

    activityLogger({
      req,
      actionType: "Product",
      description: `Product info updated: ${product.ItemCode}`,
      status: "SUCCESS",
    });

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
