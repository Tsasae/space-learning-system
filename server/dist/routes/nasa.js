"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nasaService_1 = require("../services/nasaService");
const router = (0, express_1.Router)();
router.get('/apod', async (req, res) => {
    try {
        const count = Math.min(Math.max(parseInt(req.query.count) || 9, 1), 20);
        const data = await (0, nasaService_1.getAPOD)(count);
        res.json({ success: true, data });
    }
    catch (err) {
        console.error('NASA Error:', err.response?.data || err.message);
        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
});
router.get('/neo', async (req, res) => {
    try {
        const data = await (0, nasaService_1.getNEO)();
        res.json({ success: true, data });
    }
    catch (err) {
        console.error('NEO Error:', err.response?.data || err.message);
        res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
});
exports.default = router;
