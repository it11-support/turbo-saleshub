import { Request, Response } from 'express';
import prisma from '@/libs/prisma.js';
import fileUpload from 'express-fileupload';
import path from 'path';
import { promises as fsAsync } from 'fs';
import crypto from 'crypto';
import fs from 'fs';

import { VisitStatus } from '@/generated/prisma/enums.js';
import { getSuggestedItems } from '../customer/index.js';
import { AuthenticatedRequest, FollowUpUpdateData, IVisit } from '@saleshub-tsm/types';
import { activityLogger } from '@/services/logs/index.js';
import { socketIoBroadcastEmitter, socketIoEmitter } from '@/libs/socket-io.js';
import { visitsWhereInput } from '@/generated/prisma/models.js';
import { handleApiError } from '@/utils/apiResponse.js';
import { MAX_IMAGE_SIZE } from '../product/constants.js';
import { getConcerns, getConcernStatuses } from '@/services/index.js';
import { cacheDelete } from '@/libs/cache.js';
import { invalidateVisitCache } from '@/libs/cache-keys.js';

const fetchUpdatedVisit = (tx: any, visitId: number) =>
  tx.visits.findUnique({
    where: { id: visitId },
    include: {
      salesPerson: true,
      customer: {
        include: {
          subgroup: true,
        },
      },
      visit_items: {
        include: {
          product: true,
          visit_item_concerns: {
            include: {
              category: true,
              status: true,
            },
          },
        },
      },
    },
  })

export const fetchSalesVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const visitId = Number(id);
    const visit = await prisma.visits.findUnique({
      where: {
        id: visitId,
      },
      include: {
        salesPerson: true,
        customer: {
          include: {
            subgroup: true,
            sales_invoices: true,
          },
        },
        visit_items: {
          include: {
            product: true,
            visit_item_concerns: {
              include: {
                status: true,
                category: true,
              },
            },
          },
        },
        rule: true,
      },
    });

    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    const suggestedItems = await getSuggestedItems(Number(visit.customer_id));

    const data = {
      ...visit,
      suggestedItems,
    };
    res.status(200).json({ message: 'Success', data });
  } catch (error) {
    return handleApiError(error, res);
  }
};

const validateConcern = async (
  concern: any,
  productId: bigint,
  defaultStatusId: bigint
): Promise<void> => {
  if (!concern.concern_id) {
    throw new Error(`Concern category is required for product ${productId}`)
  }

  let categoryId: bigint
  try {
    categoryId = BigInt(concern.concern_id)
  } catch {
    throw new Error(`Invalid concern category: ${concern.concern_id}`)
  }

  let statusId = defaultStatusId
  if (concern.status_id) {
    try {
      statusId = BigInt(concern.status_id)
    } catch {
      throw new Error(`Invalid concern status: ${concern.status_id}`)
    }
  }

  const [categoryExists, statusExists] = await Promise.all([
    prisma.concern_categories.findUnique({
      where: { id: categoryId },
      select: { id: true },
    }),
    prisma.concern_status.findUnique({
      where: { id: statusId },
      select: { id: true },
    }),
  ])

  if (!categoryExists) {
    throw new Error(`Concern category not found: ${concern.concern_id}`)
  }

  if (!statusExists) {
    throw new Error(`Concern status not found: ${statusId.toString()}`)
  }
}

const validateVisitItems = async (
  visit_items: any[],
  defaultStatusId: bigint
): Promise<void> => {
  for (const item of visit_items) {
    if (!item.product_id) {
      throw new Error('Product id is required')
    }

    let productId: bigint
    try {
      productId = BigInt(item.product_id)
    } catch {
      throw new Error(`Invalid product id: ${item.product_id}`)
    }

    const productExists = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true },
    })

    if (!productExists) {
      throw new Error(`Product not found: ${item.product_id}`)
    }

    if (!Array.isArray(item.concerns)) {
      throw new Error(`Invalid concerns for product ${item.product_id}`)
    }

    for (const concern of item.concerns) {
      await validateConcern(concern, productId, defaultStatusId)
    }
  }
}

export const syncSalesVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { visit_items } = req.body;

    const visitId = Number(id);

    if (!Number.isInteger(visitId) || visitId <= 0) {
      return res.status(400).json({ message: 'Invalid visit id' });
    }

    if (!Array.isArray(visit_items) || visit_items.length === 0) {
      return res.status(400).json({ message: 'Visit items are required' });
    }

    const visit = await prisma.visits.findUnique({
      where: { id: visitId },
      select: { id: true },
    });

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    const defaultStatus = await prisma.concern_status.findFirst({
      where: { status: 'Pending' },
      select: { id: true },
    });

    if (!defaultStatus) {
      return res.status(500).json({
        message: 'Default concern status "Pending" is not configured',
      });
    }

    try {
      await validateVisitItems(visit_items, defaultStatus.id)
    } catch (validationError) {
      return res.status(400).json({
        message: (validationError as Error).message,
      })
    }

    const updatedVisit = await prisma.$transaction(async (tx) => {
      await tx.visits.updateMany({
        where: { id: visitId, start_at: null },
        data: { start_at: new Date(), status: VisitStatus.Ongoing },
      })

      const visitNote = visit_items[0]?.visitNote
      if (typeof visitNote === 'string' && visitNote.trim() !== '') {
        await tx.visits.update({
          where: { id: visitId },
          data: { notes: visitNote },
        })
      }

      const existingItems = await tx.visit_items.findMany({
        where: { visit_id: visitId },
      })

      const existingMap = new Map(
        existingItems.map((item) => [item.product_id.toString(), item])
      )

      for (const item of visit_items) {
        const productId = BigInt(item.product_id)
        const existingItem = existingMap.get(productId.toString())

        let currentVisitItemId: bigint

        if (existingItem) {
          const updatedItem = await tx.visit_items.update({
            where: { id: existingItem.id },
            data: { offered: true },
          })
          currentVisitItemId = updatedItem.id
        } else {
          const createdItem = await tx.visit_items.create({
            data: {
              visit_id: visitId,
              product_id: productId,
              offered: true,
            },
          })
          currentVisitItemId = createdItem.id
        }

        await tx.visit_item_concerns.deleteMany({
          where: { visit_item_id: currentVisitItemId },
        })

        for (const concern of item.concerns) {
          const statusId = concern.status_id
            ? BigInt(concern.status_id)
            : defaultStatus.id

          await tx.visit_item_concerns.create({
            data: {
              visit_item_id: currentVisitItemId,
              concern_category_id: BigInt(concern.concern_id),
              status_id: statusId,
              notes: concern.note ?? null,
            },
          })
        }
      }

      return fetchUpdatedVisit(tx, visitId)
    })

    if (updatedVisit?.customer?.id) {
      const customerId = Number(updatedVisit.customer.id)
      await Promise.all([
        cacheDelete(`saleshub:suggested-items:${customerId}:with-recent`),
        cacheDelete(`saleshub:suggested-items:${customerId}:without-recent`),
        invalidateVisitCache(),
      ])
    }

    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit item synced : ${updatedVisit?.customer.CardName}`,
      status: 'SUCCESS',
    })

    return res.status(200).json({ message: 'Success', data: updatedVisit })
  } catch (error) {
    return handleApiError(error, res)
  }
}

export const completeSalesVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { notes } = req.body;
    await prisma.visits.update({
      where: {
        id: Number(id),
      },
      data: {
        status: VisitStatus.Completed,
        end_at: new Date(),
        notes,
      },
    });
    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit completed : ${process.env.CLIENT_URL}/visits/${id}`,
      status: 'SUCCESS',
    });

    await socketIoBroadcastEmitter('dashboard:visitCompleted', { id: Number(id) });
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    return handleApiError(error, res);
  }
};

export const visitDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const salesVisit = await prisma.visits.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        salesPerson: true,
        customer: {
          include: {
            subgroup: true,
          },
        },
        rule: true,
        visit_items: {
          include: {
            product: true,
            visit_item_concerns: {
              include: {
                category: true,
                status: true,
                follow_ups: {
                  include: {
                    concern_status: true,
                  },
                  orderBy: {
                    created_at: 'asc',
                  },
                },
              },
            },
          },
        },
        visit_competitors: {
          include: {
            competitors: true,
            competitor_products: true,
          },
        },
      },
    });

    const suggestedItems = await getSuggestedItems(Number(salesVisit?.customer_id), true);
    res.status(200).json({ message: 'Success', data: { ...salesVisit, suggestedItems } });
  } catch (error) {
    return handleApiError(error, res);
  }
};

export const followUpVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { visit_item_concern_id, notes, status, type, next_follow_up_date } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const follow_up = await tx.follow_ups.create({
        data: {
          visit_item_concern_id: BigInt(visit_item_concern_id),
          notes,
          status: BigInt(status),
          type,
          next_follow_up_date: next_follow_up_date ? new Date(next_follow_up_date) : null,
        },
        include: {
          visit_item_concerns: {
            include: {
              status: true,
              category: true,
              follow_ups: {
                include: {
                  concern_status: true,
                },
              },
              visit_items: {
                include: {
                  product: true,
                  visit: {
                    include: {
                      salesPerson: {
                        include: {
                          user: true,
                        },
                      },
                      customer: true,
                    },
                  },
                },
              },
            },
          },
          concern_status: true,
        },
      });

      const fwStatus = await prisma.concern_status.findFirst({
        where: { id: BigInt(status) },
        select: { id: true },
      });

      if (fwStatus) {
        await tx.visit_item_concerns.update({
          where: { id: BigInt(visit_item_concern_id) },
          data: {
            status: { connect: { id: fwStatus.id } },
          },
        });
      }
      return follow_up;
    });

    const userId = Number(result.visit_item_concerns.visit_items.visit.salesPerson?.user?.id);
    const salesPersonId = Number(result.visit_item_concerns.visit_items.visit.sales_person_id);
    const customerName = result.visit_item_concerns.visit_items.visit.customer.CardName;
    const productName = result.visit_item_concerns.visit_items.product.ItemName;
    const visitId = Number(result.visit_item_concerns.visit_items.visit.id);
    const lastFollowUp =
      result.visit_item_concerns.follow_ups[result.visit_item_concerns.follow_ups.length - 1];

    const messageContent =
      `Customer: ${customerName}.\n` +
      `Product: ${productName}\n` +
      `Current Status: ${lastFollowUp.concern_status.status}\n` +
      `Admin notes: ${lastFollowUp.notes}\n`;

    const where: visitsWhereInput = {
      visit_items: {
        some: {
          visit_item_concerns: {
            some: {
              status: {
                status: { contains: 'Follow Up' },
              },
            },
          },
        },
      },
      sales_person_id: salesPersonId,
    };

    const visits = await prisma.visits.findMany({
      where,
      select: { id: true, salesPerson: { select: { user: true } } },
    });

    const count = visits.length;

    if (type === 'Feedback') {
      const data: FollowUpUpdateData<IVisit> = {
        followUpUpdate: {
          count,
          updatedAt: new Date(),
        },
        item: result.visit_item_concerns.visit_items.visit as IVisit,
        info: {
          title: 'Update Follow Up',
          message: messageContent,
          action_url: `/visits/issues/${visitId}#productId-${result.visit_item_concerns.visit_items.product.ItemCode}`,
          severity: 'info',
        },
      };
      await prisma.notifications.create({
        data: {
          title: 'Update Follow Up',
          message: messageContent,
          type: 'FOLLOW UP',
          action_url: `/visits/issues/${visitId}#productId-${result.visit_item_concerns.visit_items.product.ItemCode}`,
          user_id: userId,
        },
      });
      await socketIoEmitter<FollowUpUpdateData<IVisit>>('followUpUpdate', data, userId);
    }

    activityLogger({
      req,
      actionType: 'FollowUp',
      description: `Follow up visit: ${result.visit_item_concerns.visit_items.visit.customer.CardName} - ${result.visit_item_concerns.visit_items.product.ItemName}`,
      status: 'SUCCESS',
    });
    res.status(200).json({ message: 'Success', data: result });
  } catch (error) {
    return handleApiError(error, res);
  }
};

export const startVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const visitId = Number(req.params.id);
    const { location, mode } = req.body;

    const visitItem = await prisma.$transaction(async (tx) => {
      const visit = await tx.visits.findUnique({
        where: { id: visitId },
        select: {
          id: true,
          customer_id: true,
        },
      });

      if (!visit) {
        throw new Error('Visit not found');
      }

      if (location) {
        await tx.visits.update({
          where: {
            id: visitId,
          },
          data: {
            start_at: new Date(),
            status: VisitStatus.Ongoing,
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
          },
        });

        if (mode === 'NO_LOCATION') {
          await tx.customers.update({
            where: {
              id: visit.customer_id,
            },
            data: {
              lat: location.latitude,
              lng: location.longitude,
              accuracy: location.accuracy,
            },
          });
        }
      }

      return tx.visits.findUnique({
        where: { id: visitId },
      });
    });

    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit started : ${process.env.CLIENT_URL}/visits/${visitId}`,
      status: 'SUCCESS',
    });

    res.status(200).json({
      message: 'Success',
      data: visitItem,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
};

const prepareCloseItemsPayload = (
  visit_items: any[],
  defaultStatusId: bigint
): {
  productIds: bigint[]
  categoryIds: bigint[]
  statusIds: bigint[]
} => {
  const productIds = new Set<bigint>()
  const categoryIds = new Set<bigint>()
  const statusIds = new Set<bigint>()

  for (const item of visit_items) {
    if (!Array.isArray(item.product_ids)) {
      throw new Error('product_ids must be an array')
    }

    if (!Array.isArray(item.concerns)) {
      throw new Error('concerns must be an array')
    }

    for (const productId of item.product_ids) {
      try {
        productIds.add(BigInt(productId))
      } catch {
        throw new Error(`Invalid product id: ${productId}`)
      }
    }

    for (const concern of item.concerns) {
      if (!concern.concernId) {
        throw new Error('Concern category is required')
      }

      let categoryId: bigint
      let statusId: bigint

      try {
        categoryId = BigInt(concern.concernId)
        statusId = concern.statusId ? BigInt(concern.statusId) : defaultStatusId
      } catch {
        throw new Error('Invalid concern category/status')
      }

      categoryIds.add(categoryId)
      statusIds.add(statusId)
    }
  }

  return {
    productIds: Array.from(productIds),
    categoryIds: Array.from(categoryIds),
    statusIds: Array.from(statusIds),
  }
}

const validateMasterData = async (
  productIds: bigint[],
  categoryIds: bigint[],
  statusIds: bigint[]
): Promise<void> => {
  const [products, categories, statuses] = await Promise.all([
    prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    }),
    getConcerns(),
    getConcernStatuses(),
  ])

  const validProductIds = new Set(products.map((p) => p.id.toString()))
  const invalidProductIds = productIds.filter((p) => !validProductIds.has(p.toString()))

  if (invalidProductIds.length > 0) {
    throw new Error(`Some products were not found: ${invalidProductIds.map(String).join(', ')}`)
  }

  const validCategoryIds = new Set(categories.map((c) => c.id.toString()))
  const invalidCategoryIds = categoryIds.filter((c) => !validCategoryIds.has(c.toString()))

  if (invalidCategoryIds.length > 0) {
    throw new Error(`Some concern categories were not found: ${invalidCategoryIds.map(String).join(', ')}`)
  }

  const validStatusIds = new Set(statuses.map((s) => s.id.toString()))
  const invalidStatusIds = statusIds.filter((s) => !validStatusIds.has(s.toString()))

  if (invalidStatusIds.length > 0) {
    throw new Error(`Some concern statuses were not found: ${invalidStatusIds.map(String).join(', ')}`)
  }
}

const buildConcernRows = (
  visit_items: any[],
  visitItemMap: Map<string, bigint>,
  defaultStatusId: bigint
): {
  visit_item_id: bigint
  concern_category_id: bigint
  status_id: bigint
  notes: string | null
}[] => {
  const concernRows: {
    visit_item_id: bigint
    concern_category_id: bigint
    status_id: bigint
    notes: string | null
  }[] = []

  for (const item of visit_items) {
    for (const productIdRaw of item.product_ids) {
      const productId = BigInt(productIdRaw)
      const visitItemId = visitItemMap.get(productId.toString())

      if (!visitItemId) {
        throw new Error(`Visit item not found for product ${productId}`)
      }

      for (const concern of item.concerns) {
        concernRows.push({
          visit_item_id: visitItemId,
          concern_category_id: BigInt(concern.concernId),
          status_id: concern.statusId ? BigInt(concern.statusId) : defaultStatusId,
          notes: concern.notes ?? null,
        })
      }
    }
  }

  return concernRows
}

export const closeItems = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { visit_items } = req.body;

    const visitId = Number(id);

    if (!Number.isInteger(visitId) || visitId <= 0) {
      return res.status(400).json({ message: 'Invalid visit id' });
    }

    if (!Array.isArray(visit_items) || visit_items.length === 0) {
      return res.status(400).json({ message: 'Visit items are required' });
    }

    const visit = await prisma.visits.findUnique({
      where: { id: visitId },
      select: { id: true },
    });

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    const defaultStatus = await prisma.concern_status.findFirst({
      where: { status: 'Pending' },
      select: { id: true },
    });

    if (!defaultStatus) {
      return res.status(500).json({
        message: 'Default concern status "Pending" is not configured',
      });
    }

    let productIds: bigint[]
    let categoryIds: bigint[]
    let statusIds: bigint[]

    try {
      const payload = prepareCloseItemsPayload(visit_items, defaultStatus.id)
      productIds = payload.productIds
      categoryIds = payload.categoryIds
      statusIds = payload.statusIds
    } catch (validationError) {
      return res.status(400).json({ message: (validationError as Error).message })
    }

    try {
      await validateMasterData(productIds, categoryIds, statusIds)
    } catch (validationError) {
      return res.status(400).json({ message: (validationError as Error).message })
    }

    const updatedVisit = await prisma.$transaction(async (tx) => {
      await tx.visit_items.createMany({
        data: productIds.map((productId) => ({
          visit_id: BigInt(visitId),
          product_id: productId,
          offered: true,
        })),
      })

      const createdItems = await tx.visit_items.findMany({
        where: {
          visit_id: BigInt(visitId),
          product_id: { in: productIds },
        },
        select: { id: true, product_id: true },
      })

      const visitItemMap = new Map(
        createdItems.map((item) => [item.product_id.toString(), item.id])
      )

      const concernRows = buildConcernRows(visit_items, visitItemMap, defaultStatus.id)

      if (concernRows.length > 0) {
        await tx.visit_item_concerns.createMany({ data: concernRows })
      }

      return fetchUpdatedVisit(tx, visitId)
    })

    if (updatedVisit?.customer?.id) {
      const customerId = Number(updatedVisit.customer.id)
      await Promise.all([
        cacheDelete(`saleshub:suggested-items:${customerId}:with-recent`),
        cacheDelete(`saleshub:suggested-items:${customerId}:without-recent`),
        invalidateVisitCache(),
      ])
    }

    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit item closed : ${process.env.CLIENT_URL}/visits/${visitId}`,
      status: 'SUCCESS',
    })

    return res.status(200).json({ message: 'Success', data: updatedVisit })
  } catch (error) {
    return handleApiError(error, res)
  }
}

export const handleUploadVisitImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const visitId = Number(id);

    if (!Number.isInteger(visitId)) {
      return res.status(400).json({
        message: 'Invalid visit id',
      });
    }

    const visit = await prisma.visits.findUnique({
      where: {
        id: visitId,
      },
    });

    if (!visit) {
      return res.status(404).json({
        message: 'Visit not found',
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        message: 'No file uploaded',
      });
    }

    const firstKey = Object.keys(req.files)[0];
    const imageFile = req.files[firstKey] as fileUpload.UploadedFile;

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    const ext = mimeToExt[imageFile.mimetype];

    if (!ext) {
      return res.status(400).json({
        message: 'Invalid file type',
      });
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        message: 'Maximum image size is 10 MB',
      });
    }

    const baseDir = path.resolve(process.cwd(), 'public/images/visit', String(visitId));

    await fsAsync.mkdir(baseDir, {
      recursive: true,
    });

    // hapus seluruh file lama
    const existingFiles = await fsAsync.readdir(baseDir);

    for (const file of existingFiles) {
      const filePath = path.resolve(baseDir, file);

      const rel = path.relative(baseDir, filePath);

      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        continue;
      }

      await fsAsync.rm(filePath, {
        force: true,
      });
    }

    const fileName = `${crypto.randomUUID()}${ext}`;

    const destinationPath = path.resolve(baseDir, fileName);

    const relativePath = path.relative(baseDir, destinationPath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return res.status(400).json({
        message: 'Invalid file path',
      });
    }

    await imageFile.mv(destinationPath);

    await prisma.visits.update({
      where: {
        id: visitId,
      },
      data: {
        photo_url: `images/visit/${visitId}/${fileName}`,
      },
    });

    return res.json({
      message: 'Upload successful',
      image: fileName,
      url: `/images/visit/${visitId}/${fileName}`,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
};

export const fetchVisitImage = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nofallback } = req.query;

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: 'Invalid visit id' });
      return;
    }

    const baseDir = path.resolve(process.cwd(), 'public/images/visit');
    const visitDir = path.resolve(baseDir, String(id));

    if (!visitDir.startsWith(baseDir)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    if (fs.existsSync(visitDir)) {
      const image = fs.readdirSync(visitDir).find((file) => /\.(png|jpe?g|webp)$/i.test(file));

      if (image) {
        const imagePath = path.join(visitDir, image);

        const stats = fs.statSync(imagePath);

        if (stats.size > MAX_IMAGE_SIZE) {
          return res.status(413).json({
            message: 'Image exceeds maximum allowed size',
          });
        }

        return res.sendFile(imagePath);
      }
    }

    if (nofallback === '1') {
      res.json({ exists: false });
      return;
    }

    res.status(404).json({ message: 'Image not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load image' });
  }
};
