import { Prisma } from '@/generated/prisma/client.js';
import prisma from '@/libs/prisma.js';
import { activityLogger } from '@/services/logs/index.js';
import { AuthenticatedRequest, EProductCategory } from '@saleshub-tsm/types';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import { promises as fsAsync } from 'fs';
import { handleApiError } from '@/utils/apiResponse.js';
import { buildDestinationPath } from './path.js';
import { deleteExistingImages, saveImage } from './upload.js';
import { validateUploadFile } from './validation.js';
import { findProductImage, getFallbackImage, processUploadFile } from './image.js';
import { PRODUCT_IMAGE_DIR } from './constants.js';
import { getCachedFilterOptions } from '@/libs/filter-cache.js';
import { cacheGet, cacheSet } from '@/libs/cache.js';

type ProductSalesStat = {
  unitsSold: number
  revenue: number
}

type ProductCategoryOption = {
  ItmsGrpCod: number | null
  ItmsGrpNam: string | null
}

export type ImageResponseType = never;

const isSafeItemCode = (itemCode: string): boolean => /^[A-Za-z0-9_-]+$/.test(itemCode);

export const image = async (
  req: Request,
  res: Response
) => {
  try {
    const itemCode = String(req.params.itemCode)

    if (!isSafeItemCode(itemCode)) {
      return res.status(400).json({
        message: 'Invalid item code',
      })
    }

    const imagePath = findProductImage(itemCode)

    if (imagePath) {
      return res.sendFile(imagePath)
    }

    if (req.query.nofallback === '1') {
      return res.json({
        exists: false,
      })
    }

    return res.sendFile(getFallbackImage())
  } catch (error) {
    console.error(error)

    return res.sendFile(getFallbackImage())
  }
}

// Delete image
export const deleteImage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const itemCode = String(req.params.itemCode)

    if (!isSafeItemCode(itemCode)) {
      return res.status(400).json({
        message: 'Invalid item code',
      })
    }

    const fileDeleted =
      await deleteExistingImages(
        PRODUCT_IMAGE_DIR,
        itemCode
      )

    if (!fileDeleted) {
      return res.status(404).json({
        message: 'Image not found',
      })
    }

    activityLogger({
      req,
      actionType: 'Product',
      description: `Product image deleted: ${itemCode}`,
      status: 'SUCCESS',
    })

    return res.status(200).json({
      message: 'Image deleted',
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}

export const imageUpload = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const itemCode = String(req.params.itemCode)

    if (!isSafeItemCode(itemCode)) {
      return res.status(400).json({
        message: 'Invalid item code',
      })
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        message: 'No file uploaded',
      })
    }

    await fsAsync.mkdir(PRODUCT_IMAGE_DIR, {
      recursive: true,
    })

    const firstKey = Object.keys(req.files)[0]
    const imageFile =
      req.files[firstKey] as fileUpload.UploadedFile

    const validation =
      await validateUploadFile(imageFile)

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.reason,
      })
    }

    const ext = validation.ext!

    const fileName = `${itemCode}${ext}`

    const destinationPath =
      buildDestinationPath(
        PRODUCT_IMAGE_DIR,
        fileName
      )

    await deleteExistingImages(
      PRODUCT_IMAGE_DIR,
      itemCode
    )

    await saveImage(
      imageFile,
      destinationPath,
      ext,
      PRODUCT_IMAGE_DIR
    )

    activityLogger({
      req,
      actionType: 'Product',
      description: `Product image uploaded: ${fileName}`,
      status: 'SUCCESS',
    })

    return res.json({
      message: 'Upload successful',
      url: `/images/product/${fileName}`,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}

export const fetchProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      page,
      limit,
      search,
      category,
      productFocused,
      distributor,
      group,
    } = req.query

    const perPage = limit ? Number(limit) : 10
    const currentPage = page ? Number(page) : 1

    const keyword =
      typeof search === 'string' &&
        search.trim() !== ''
        ? search.trim()
        : null

    const isProductFocused =
      productFocused === 'true'

    const isDistributor =
      distributor === 'true'

    const productCategory =
      group as EProductCategory

    // =========================================
    // WHERE
    // =========================================

    const where: Prisma.productsWhereInput = {
      ...(category
        ? {
          ItmsGrpCod: Number(category),
        }
        : {}),

      ...(keyword
        ? {
          OR: [
            {
              ItemCode: {
                contains: keyword,
              },
            },
            {
              ItemName: {
                contains: keyword,
              },
            },
            {
              ItmsGrpNam: {
                contains: keyword,
              },
            },
          ],
        }
        : {}),

      ...(!isProductFocused && !isDistributor
        ? {
          validFor: 'Y',
          frozenFor: 'N',
        }
        : {}),

      ...((isProductFocused || isDistributor) && {
        OR: [
          ...(isProductFocused
            ? [
              {
                product_developments: {
                  some: {},
                },
              },
            ]
            : []),

          ...(isDistributor
            ? [
              {
                Distributor: 'Y',
                validFor: 'Y',
                frozenFor: 'N',
              },
            ]
            : []),
        ],
      }),

      ...(group
        ? {
          ProductCategory:
            productCategory,
        }
        : {}),
    }

    // =========================================
    // PRODUCTS + COUNT
    // =========================================

    const [products, totalRecords] =
      await Promise.all([
        prisma.products.findMany({
          skip:
            (currentPage - 1) *
            perPage,

          take: perPage,

          where,

          include: {
            product_developments: {
              include: {
                subgroup: true,
              },
            },
          },
        }),

        prisma.products.count({
          where,
        }),
      ])

    const totalPages =
      Math.ceil(
        totalRecords / perPage
      )

    // =========================================
    // CATEGORIES CACHE
    // =========================================

    const producCategories =
      await getCachedFilterOptions<
        ProductCategoryOption[]
      >(
        'saleshub:filters:product-categories',

        () =>
          prisma.products.findMany({
            select: {
              ItmsGrpCod: true,
              ItmsGrpNam: true,
            },

            distinct: [
              'ItmsGrpCod',
            ],
          }),

        3600
      )

    // =========================================
    // PRODUCT SALES CACHE
    // =========================================

    const salesStatsMap =
      new Map<
        string,
        ProductSalesStat
      >()

    const missingItemCodes:
      string[] = []

    // Check Redis untuk setiap produk di page
    await Promise.all(
      products.map(
        async product => {
          const cacheKey =
            `saleshub:product-sales-1m:${product.ItemCode}`

          const cached =
            await cacheGet<ProductSalesStat>(
              cacheKey
            )

          if (cached) {
            salesStatsMap.set(
              product.ItemCode,
              cached
            )

            return
          }

          missingItemCodes.push(
            product.ItemCode
          )
        }
      )
    )

    // =========================================
    // FETCH ONLY CACHE MISSES
    // =========================================

    if (
      missingItemCodes.length >
      0
    ) {
      const sales =
        await prisma.sales_invoices.groupBy({
          by: ['ItemCode'],

          where: {
            ItemCode: {
              in: missingItemCodes,
            },

            DocDate: {
              gte: dayjs()
                .subtract(
                  1,
                  'month'
                )
                .startOf('day')
                .toDate(),
            },
          },

          _sum: {
            QtyKg: true,
            TotalSales: true,
          },
        })

      const salesMap =
        new Map(
          sales.map(item => [
            item.ItemCode,
            {
              unitsSold: Number(
                item._sum
                  .QtyKg ?? 0
              ),

              revenue: Number(
                item._sum
                  .TotalSales ?? 0
              ),
            },
          ])
        )

      // =========================================
      // SAVE CACHE
      // =========================================

      await Promise.all(
        missingItemCodes.map(
          async itemCode => {
            const stat:
              ProductSalesStat =
              salesMap.get(
                itemCode
              ) ?? {
                unitsSold: 0,
                revenue: 0,
              }

            salesStatsMap.set(
              itemCode,
              stat
            )

            const cacheKey =
              `saleshub:product-sales-1m:${itemCode}`

            await cacheSet(
              cacheKey,
              stat,
              300
            )
          }
        )
      )
    }

    // =========================================
    // BUILD PRODUCT LIST
    // =========================================

    const productList =
      products.map(product => {
        const stats =
          salesStatsMap.get(
            product.ItemCode
          )

        return {
          ...product,

          unitsSold:
            stats?.unitsSold ??
            0,

          revenue:
            stats?.revenue ??
            0,
        }
      })

    // =========================================
    // RESPONSE
    // =========================================

    return res
      .status(200)
      .json({
        message:
          'Products fetched successfully',

        data: {
          items:
            productList,

          totalRecords,

          totalPages,

          categories:
            producCategories,
        },
      })
  } catch (error) {
    return handleApiError(
      error,
      res
    )
  }
}

export const bulkUploadProducts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    await fsAsync.mkdir(PRODUCT_IMAGE_DIR, {
      recursive: true,
    })

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      })
    }

    const files =
      req.files.files as
      | fileUpload.UploadedFile[]
      | fileUpload.UploadedFile

    const fileArray = Array.isArray(files)
      ? files
      : [files]

    const uploaded = []
    const invalidFiles = []

    for (const imageFile of fileArray) {
      try {
        const result =
          await processUploadFile(imageFile)

        if (!result.success) {
          invalidFiles.push({
            filename: imageFile.name,
            reason: result.reason!,
          })
          continue
        }

        uploaded.push({
          itemCode: result.itemCode!,
          filename: result.fileName!,
          url: `/images/product/${result.fileName}`,
        })
      } catch {
        invalidFiles.push({
          filename: imageFile.name,
          reason: 'Failed to save image',
        })
      }
    }

    activityLogger({
      req,
      actionType: 'Product',
      description: `Bulk upload of ${uploaded.length} images completed`,
      status: 'SUCCESS',
    })

    return res.json({
      status:
        invalidFiles.length > 0
          ? 'partial'
          : 'success',
      message:
        invalidFiles.length > 0
          ? 'Some files failed to upload'
          : 'Images uploaded successfully',
      data: uploaded,
      invalidFiles,
    })
  } catch (error) {
    return handleApiError(error, res)
  }
}
export const productDevelopment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, subgroupIds } = req.body;

    await prisma.product_developments.deleteMany({
      where: {
        product_id: productId,
      },
    });

    const safeSubgroupIds = Array.isArray(subgroupIds) ? subgroupIds : [];

    await prisma.product_developments.createMany({
      data: safeSubgroupIds.map((subgroupId: number) => ({
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
    return handleApiError(error, res)
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
    return handleApiError(error, res)
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
    return handleApiError(error, res)
  }
};
