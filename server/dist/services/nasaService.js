"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNEO = exports.getAPOD = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const node_cache_1 = __importDefault(require("node-cache"));
const https_1 = __importDefault(require("https"));
const cache = new node_cache_1.default({ stdTTL: 86400 });
const NASA_KEY = process.env.NASA_API_KEY;
const BASE_URL = 'https://api.nasa.gov';
const client = axios_1.default.create({
    timeout: 15000,
    httpsAgent: new https_1.default.Agent({ rejectUnauthorized: false })
});
console.log('NASA_KEY:', NASA_KEY);
const getAPOD = async (count = 9) => {
    const cacheKey = `apod_${count}`;
    const cached = cache.get(cacheKey);
    if (cached)
        return cached;
    try {
        const response = await client.get(`${BASE_URL}/planetary/apod`, {
            params: { api_key: NASA_KEY, count }
        });
        cache.set(cacheKey, response.data);
        return response.data;
    }
    catch (err) {
        console.error('APOD Error:', err.message, err.code);
        throw err;
    }
};
exports.getAPOD = getAPOD;
const getNEO = async () => {
    const cacheKey = 'neo_today';
    const cached = cache.get(cacheKey);
    if (cached)
        return cached;
    const today = new Date().toISOString().split('T')[0];
    const response = await client.get(`${BASE_URL}/neo/rest/v1/feed`, {
        params: { api_key: NASA_KEY, start_date: today, end_date: today }
    });
    cache.set(cacheKey, response.data);
    return response.data;
};
exports.getNEO = getNEO;
