import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { userId, packageName } = req.body;

        if (!userId || !packageName) {
            return res.status(400).json({
                success: false,
                message: "User ID and package name are required"
            });
        }

        // Kullanıcıya ait mevcut bir abonelik var mı kontrol et
        const existingSubscription = await prisma.subscription.findFirst({
            where: { userId }
        });

        let subscription;
        if (existingSubscription) {
            // Varsa güncelle
            subscription = await prisma.subscription.update({
                where: { id: existingSubscription.id },
                data: {
                    packageName,
                    isActive: true
                }
            });
        } else {
            // Yoksa oluştur
            subscription = await prisma.subscription.create({
                data: {
                    userId,
                    packageName,
                    isActive: true,
                }
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { subscription: true }
        });

        return res.status(existingSubscription ? 200 : 201).json({
            success: true,
            message: existingSubscription ? "Subscription updated successfully" : "Subscription created successfully",
            data: subscription
        });
    } catch (error: any) {
        console.error("Error creating/updating subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create or update subscription",
            error: error.message
        });
    }
};

export const getUserSubscriptions = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const subscriptions = await prisma.subscription.findMany({
            where: { userId }
        });

        return res.status(200).json({
            success: true,
            data: subscriptions
        });
    } catch (error: any) {
        console.error("Error fetching subscriptions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscriptions",
            error: error.message
        });
    }
};

export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Önce mevcut aboneliği bul
        const existingSubscription = await prisma.subscription.findUnique({
            where: { id }
        });

        if (!existingSubscription) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found"
            });
        }

        // Mevcut aboneliği güncelle (yeni veri göndermeden)
        const subscription = await prisma.subscription.update({
            where: { id },
            data: {} // Boş data objesi ile sadece son erişim zamanı güncellenir
        });

        return res.status(200).json({
            success: true,
            message: "Subscription accessed successfully",
            data: subscription
        });
    } catch (error: any) {
        console.error("Error accessing subscription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to access subscription",
            error: error.message
        });
    }
};


export const isUserPremium = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error("Error checking user premium status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check user premium status",
            error: error.message
        });
    }
}