import express from "express";
import prisma from "../prisma/index.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, email } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ message: "Full name & phone required" });
    }

    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone,
        email,
        companyId: req.companyId
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Failed to create customer" });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        companyId: req.companyId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

export default router;
