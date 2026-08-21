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

    if (!Array.isArray(visit_items)) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    const visitId = Number(id);

    const visit = await prisma.visits.findUnique({
      where: { id: visitId },
    });
    await prisma.visits.updateMany({
      where: {
        id: visitId,
        start_at: null,
      },
      data: {
        start_at: new Date(),
        status: VisitStatus.Ongoing,
      },
    });
    if (visit_items[0].visitNote !== '') {
      await prisma.visits.update({
        where: { id: visitId },
        data: {
          notes: visit_items[0].visitNote,
        },
      });
    }

    if (!visit) {
      res.status(404).json({ message: 'Visit not found' });
      return;
    }

    const existing = await prisma.visit_items.findMany({
      where: { visit_id: visitId },
    });

    const existingMap = new Map(existing.map((i) => [i.product_id, i]));

    // UPSERT ITEMS
    for (const item of visit_items) {
      let currentVisitItemId: bigint; // Gunakan ini untuk menyimpan ID yang valid

      if (existingMap.has(item.product_id)) {
        // 1. Update data lama
        const updated = await prisma.visit_items.update({
          where: { id: existingMap.get(item.product_id)!.id },
          data: { offered: true },
        });
        currentVisitItemId = BigInt(updated.id);
      } else {
        // 2. Create data baru
        const created = await prisma.visit_items.create({
          data: {
            visit_id: visitId,
            product_id: item.product_id,
            offered: true,
          },
        });
        currentVisitItemId = BigInt(created.id);
      }

      // 3. Bersihkan data concerns lama menggunakan ID database yang valid
      await prisma.visit_item_concerns.deleteMany({
        where: { visit_item_id: currentVisitItemId },
      });

      // 4. Masukkan concerns baru
      for (const concern of item.concerns) {
        await prisma.visit_item_concerns.create({
          data: {
            visit_items: {
              connect: { id: currentVisitItemId }, // Gunakan ID yang baru kita dapatkan
            },
            category: {
              connect: { id: concern.concern_id ? BigInt(concern.concern_id) : 1n },
            },
            notes: concern.note,
            status: {
              connect: { id: concern.status_id ? BigInt(concern.status_id) : 1n },
            },
          },
        });
      }
    }

    const updatedVisit = await prisma.visits.findUnique({
      where: { id: visitId },
      include: {
        salesPerson: true,
        customer: { include: { subgroup: true } },
        visit_items: { include: { product: true, visit_item_concerns: true } },
      },
    });

    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit item synced : ${updatedVisit?.customer.CardName}`,
      status: 'SUCCESS',
    });

    res.status(200).json({ message: 'Success', data: updatedVisit });
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

export const closeItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { visit_items } = req.body;

    if (!Array.isArray(visit_items)) {
      res.status(400).json({ message: 'Bad request' });
      return;
    }

    const visitId = Number(id);

    for (const item of visit_items) {
      let currentVisitItemId: bigint;
      for (const id of item.product_ids) {
        const created = await prisma.visit_items.create({
          data: {
            visit_id: visitId,
            product_id: BigInt(id),
            offered: true,
          },
        });
        currentVisitItemId = BigInt(created.id);

        for (const concern of item.concerns) {
          await prisma.visit_item_concerns.create({
            data: {
              visit_items: {
                connect: { id: currentVisitItemId },
              },
              category: {
                connect: { id: concern.concernId ? BigInt(concern.concernId) : 1n },
              },
              notes: concern.notes,
              status: {
                connect: { id: concern.statusId ? BigInt(concern.statusId) : 1n },
              },
            },
          });
        }
      }
    }
    const updatedVisit = await prisma.visits.findUnique({
      where: { id: visitId },
      include: {
        salesPerson: true,
        customer: { include: { subgroup: true } },
        visit_items: { include: { product: true, visit_item_concerns: true } },
      },
    });

    activityLogger({
      req,
      actionType: 'Sales Visit',
      description: `Sales Visit item closed : ${process.env.CLIENT_URL}/visits/${visitId}`,
      status: 'SUCCESS',
    });
    res.status(200).json({ message: 'Success', data: updatedVisit });
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
