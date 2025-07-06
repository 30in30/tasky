const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { start } = require('repl');

const app = express();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
        try{
            const userId = req.user?.id;
            const tasks = await prisma.task.findMany({
                where: {
                    user: userId
                },
            });
            return res.json(tasks);
        } catch (err) {
            console.error('GET tasks error');
            return res.status(500).json({ message: "Internal server error." });
        }
    });
    
router.post("/", async (req, res) => {
        const { title, description, startDate, endDate } = req.body;
        const userId = req.user?.id;
        try {
            const task = await prisma.task.create({
                data: {
                    title,
                    description,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    completionStatus: false,
                    user: userId
                }
            });
            return res.status(201).json(task);
        } catch (err) {
            return res.status(500).json({ message: "POST error." });
        }
    });

router.put('/:id', async(req, res) => {
    const { title, description, startDate, endDate, completionStatus } = req.body;
    try {
        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                completionStatus
            }
        });
        res.json(task);
    } catch (err) {
        console.error('Update route error.', err);
        res.status(500).json({ message: 'Update route error.' });
    }
});

router.delete('/:id', async(req, res) => {
    try {
        const task = await prisma.task.delete({
            where: { id: req.params.id },
        });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Delete route error."});
    }
});

module.exports = router;