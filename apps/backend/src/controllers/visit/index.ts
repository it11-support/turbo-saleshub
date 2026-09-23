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

export const syncSalesVisit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { visit_items } = req.body;

    const visitId = Number(id);

    if (!Number.isInteger(visitId) || visitId <= 0) {
      return res.status(400).json({
        message: 'Invalid visit id',
      });
    }

    if (!Array.isArray(visit_items) || visit_items.length === 0) {
      return res.status(400).json({
        message: 'Visit items are required',
      });
    }

    // Pastikan visit ada SEBELUM melakukan update apa pun
    const visit = await prisma.visits.findUnique({
      where: { id: visitId },
      select: {
        id: true,
      },
    });

    if (!visit) {
      return res.status(404).json({
        message: 'Visit not found',
      });
    }

    /*
     * Default status = Pending.
     *
     * Jangan hardcode ID 1 karena production saat ini:
     * 25 = Closed
     * 26 = Pending
     * 27 = Follow Up
     * 28 = Done
     *
     * Cari berdasarkan nama supaya tetap aman jika ID berubah.
     */
    const defaultStatus = await prisma.concern_status.findFirst({
      where: {
        status: 'Pending',
      },
      select: {
        id: true,
      },
    });

    if (!defaultStatus) {
      return res.status(500).json({
        message: 'Default concern status "Pending" is not configured',
      });
    }

    // =====================================================
    // VALIDASI SEMUA DATA SEBELUM DATABASE DIUBAH
    // =====================================================
    for (const item of visit_items) {
      if (!item.product_id) {
        return res.status(400).json({
          message: 'Product id is required',
        });
      }

      let productId: bigint;

      try {
        productId = BigInt(item.product_id);
      } catch {
        return res.status(400).json({
          message: `Invalid product id: ${item.product_id}`,
        });
      }

      const productExists = await prisma.products.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
        },
      });

      if (!productExists) {
        return res.status(400).json({
          message: `Product not found: ${item.product_id}`,
        });
      }

      if (!Array.isArray(item.concerns)) {
        return res.status(400).json({
          message: `Invalid concerns for product ${item.product_id}`,
        });
      }

      for (const concern of item.concerns) {
        // Category tidak boleh menggunakan fallback.
        if (!concern.concern_id) {
          return res.status(400).json({
            message: `Concern category is required for product ${item.product_id}`,
          });
        }

        let categoryId: bigint;

        try {
          categoryId = BigInt(concern.concern_id);
        } catch {
          return res.status(400).json({
            message: `Invalid concern category: ${concern.concern_id}`,
          });
        }

        // status kosong -> Pending
        let statusId = defaultStatus.id;

        if (concern.status_id) {
          try {
            statusId = BigInt(concern.status_id);
          } catch {
            return res.status(400).json({
              message: `Invalid concern status: ${concern.status_id}`,
            });
          }
        }

        const [categoryExists, statusExists] = await Promise.all([
          prisma.concern_categories.findUnique({
            where: {
              id: categoryId,
            },
            select: {
              id: true,
            },
          }),

          prisma.concern_status.findUnique({
            where: {
              id: statusId,
            },
            select: {
              id: true,
            },
          }),
        ]);

        if (!categoryExists) {
          return res.status(400).json({
            message: `Concern category not found: ${concern.concern_id}`,
          });
        }

        if (!statusExists) {
          return res.status(400).json({
            message: `Concern status not found: ${statusId.toString()}`,
          });
        }
      }
    }

    // =====================================================
    // SEMUA PERUBAHAN DALAM SATU TRANSACTION
    // =====================================================
    const updatedVisit = await prisma.$transaction(async (tx) => {
      // Set visit menjadi ongoing hanya jika belum dimulai
      await tx.visits.updateMany({
        where: {
          id: visitId,
          start_at: null,
        },
        data: {
          start_at: new Date(),
          status: VisitStatus.Ongoing,
        },
      });

      // Update visit note jika dikirim
      const visitNote = visit_items[0]?.visitNote;

      if (typeof visitNote === 'string' && visitNote.trim() !== '') {
        await tx.visits.update({
          where: {
            id: visitId,
          },
          data: {
            notes: visitNote,
          },
        });
      }

      // Ambil existing visit items
      const existingItems = await tx.visit_items.findMany({
        where: {
          visit_id: visitId,
        },
      });

      /*
       * BigInt sebagai key Map bisa membingungkan jika payload product_id
       * berupa number/string.
       * Normalisasi ke string.
       */
      const existingMap = new Map(
        existingItems.map((item) => [
          item.product_id.toString(),
          item,
        ]),
      );

      for (const item of visit_items) {
        const productId = BigInt(item.product_id);

        const existingItem = existingMap.get(
          productId.toString(),
        );

        let currentVisitItemId: bigint;

        // ==========================================
        // UPSERT VISIT ITEM
        // ==========================================
        if (existingItem) {
          const updatedItem = await tx.visit_items.update({
            where: {
              id: existingItem.id,
            },
            data: {
              offered: true,
            },
          });

          currentVisitItemId = updatedItem.id;
        } else {
          const createdItem = await tx.visit_items.create({
            data: {
              visit_id: visitId,
              product_id: productId,
              offered: true,
            },
          });

          currentVisitItemId = createdItem.id;
        }

        // ==========================================
        // REPLACE CONCERNS
        // ==========================================
        await tx.visit_item_concerns.deleteMany({
          where: {
            visit_item_id: currentVisitItemId,
          },
        });

        for (const concern of item.concerns) {
          const statusId = concern.status_id
            ? BigInt(concern.status_id)
            : defaultStatus.id;

          await tx.visit_item_concerns.create({
            data: {
              visit_item_id: currentVisitItemId,

              concern_category_id: BigInt(
                concern.concern_id,
              ),

              status_id: statusId,

              notes: concern.note ?? null,
            },
          });
        }
      }

      // ==========================================
      // RETURN FRESH DATA
      // ==========================================
      return tx.visits.findUnique({
        where: {
          id: visitId,
        },
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
      });
    });

    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit item synced : ${updatedVisit?.customer.CardName}`,
      status: 'SUCCESS',
    });

    return res.status(200).json({
      message: 'Success',
      data: updatedVisit,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
};

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

export const closeItems = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { visit_items } = req.body;

    const visitId = Number(id);

    if (!Number.isInteger(visitId) || visitId <= 0) {
      return res.status(400).json({
        message: 'Invalid visit id',
      });
    }

    if (!Array.isArray(visit_items) || visit_items.length === 0) {
      return res.status(400).json({
        message: 'Visit items are required',
      });
    }

    // Pastikan visit ada
    const visit = await prisma.visits.findUnique({
      where: { id: visitId },
      select: { id: true },
    });

    if (!visit) {
      return res.status(404).json({
        message: 'Visit not found',
      });
    }

    // Default status berdasarkan master data, bukan hardcode ID 1
    const defaultStatus = await prisma.concern_status.findFirst({
      where: {
        status: 'Pending',
      },
      select: {
        id: true,
      },
    });

    if (!defaultStatus) {
      return res.status(500).json({
        message: 'Default concern status "Pending" is not configured',
      });
    }

    // =====================================================
    // PREPARE + VALIDATE PAYLOAD
    // =====================================================

    const productIds = new Set<bigint>();
    const categoryIds = new Set<bigint>();
    const statusIds = new Set<bigint>();

    for (const item of visit_items) {
      if (!Array.isArray(item.product_ids)) {
        return res.status(400).json({
          message: 'product_ids must be an array',
        });
      }

      if (!Array.isArray(item.concerns)) {
        return res.status(400).json({
          message: 'concerns must be an array',
        });
      }

      for (const productId of item.product_ids) {
        try {
          productIds.add(BigInt(productId));
        } catch {
          return res.status(400).json({
            message: `Invalid product id: ${productId}`,
          });
        }
      }

      for (const concern of item.concerns) {
        if (!concern.concernId) {
          return res.status(400).json({
            message: 'Concern category is required',
          });
        }

        let categoryId: bigint;
        let statusId: bigint;

        try {
          categoryId = BigInt(concern.concernId);

          statusId = concern.statusId
            ? BigInt(concern.statusId)
            : defaultStatus.id;
        } catch {
          return res.status(400).json({
            message: 'Invalid concern category/status',
          });
        }

        categoryIds.add(categoryId);
        statusIds.add(statusId);
      }
    }

    // =====================================================
    // VALIDATE MASTER DATA - 3 QUERY SAJA
    // =====================================================

    const [products, categories, statuses] = await Promise.all([
      prisma.products.findMany({
        where: {
          id: {
            in: Array.from(productIds),
          },
        },
        select: {
          id: true,
        },
      }),

      prisma.concern_categories.findMany({
        where: {
          id: {
            in: Array.from(categoryIds),
          },
        },
        select: {
          id: true,
        },
      }),

      prisma.concern_status.findMany({
        where: {
          id: {
            in: Array.from(statusIds),
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    // =====================================================
    // CHECK PRODUCT
    // =====================================================

    const validProductIds = new Set(
      products.map((product) => product.id.toString()),
    );

    const invalidProductIds = Array.from(productIds).filter(
      (productId) => !validProductIds.has(productId.toString()),
    );

    if (invalidProductIds.length > 0) {
      return res.status(400).json({
        message: 'Some products were not found',
        invalid_product_ids: invalidProductIds.map(String),
      });
    }

    // =====================================================
    // CHECK CATEGORY
    // =====================================================

    const validCategoryIds = new Set(
      categories.map((category) => category.id.toString()),
    );

    const invalidCategoryIds = Array.from(categoryIds).filter(
      (categoryId) => !validCategoryIds.has(categoryId.toString()),
    );

    if (invalidCategoryIds.length > 0) {
      return res.status(400).json({
        message: 'Some concern categories were not found',
        invalid_category_ids: invalidCategoryIds.map(String),
      });
    }

    // =====================================================
    // CHECK STATUS
    // =====================================================

    const validStatusIds = new Set(
      statuses.map((status) => status.id.toString()),
    );

    const invalidStatusIds = Array.from(statusIds).filter(
      (statusId) => !validStatusIds.has(statusId.toString()),
    );

    if (invalidStatusIds.length > 0) {
      return res.status(400).json({
        message: 'Some concern statuses were not found',
        invalid_status_ids: invalidStatusIds.map(String),
      });
    }

    // =====================================================
    // DATABASE TRANSACTION
    // =====================================================

    const updatedVisit = await prisma.$transaction(async (tx) => {
      /*
       * INSERT SEMUA VISIT ITEMS SEKALIGUS
       */
      await tx.visit_items.createMany({
        data: Array.from(productIds).map((productId) => ({
          visit_id: BigInt(visitId),
          product_id: productId,
          offered: true,
        })),
      });

      /*
       * Ambil ID visit_items yang baru dibuat.
       *
       * Kita perlu ID ini karena visit_item_concerns
       * membutuhkan visit_item_id.
       */
      const createdItems = await tx.visit_items.findMany({
        where: {
          visit_id: BigInt(visitId),

          product_id: {
            in: Array.from(productIds),
          },
        },

        select: {
          id: true,
          product_id: true,
        },
      });

      /*
       * Map:
       *
       * product_id -> visit_item_id
       */
      const visitItemMap = new Map(
        createdItems.map((item) => [
          item.product_id.toString(),
          item.id,
        ]),
      );

      /*
       * Build semua concerns di memory.
       */
      const concernRows: {
        visit_item_id: bigint;
        concern_category_id: bigint;
        status_id: bigint;
        notes: string | null;
      }[] = [];

      for (const item of visit_items) {
        for (const productIdRaw of item.product_ids) {
          const productId = BigInt(productIdRaw);

          const visitItemId = visitItemMap.get(
            productId.toString(),
          );

          if (!visitItemId) {
            throw new Error(
              `Visit item not found for product ${productId}`,
            );
          }

          for (const concern of item.concerns) {
            concernRows.push({
              visit_item_id: visitItemId,

              concern_category_id: BigInt(
                concern.concernId,
              ),

              status_id: concern.statusId
                ? BigInt(concern.statusId)
                : defaultStatus.id,

              notes: concern.notes ?? null,
            });
          }
        }
      }

      /*
       * INSERT SEMUA CONCERNS SEKALIGUS
       */
      if (concernRows.length > 0) {
        await tx.visit_item_concerns.createMany({
          data: concernRows,
        });
      }

      return tx.visits.findUnique({
        where: {
          id: visitId,
        },

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
      });
    });

    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit item closed : ${process.env.CLIENT_URL}/visits/${visitId}`,
      status: 'SUCCESS',
    });

    return res.status(200).json({
      message: 'Success',
      data: updatedVisit,
    });
  } catch (error) {
    return handleApiError(error, res);
  }
};

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
