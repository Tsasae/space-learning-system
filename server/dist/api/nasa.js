"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNEO = exports.fetchAPOD = void 0;
const BASE_URL = 'http://localhost:8000/api';
const fetchAPOD = async () => {
    const res = await fetch(`${BASE_URL}/nasa/apod`);
    const json = await res.json();
    return json.data;
};
exports.fetchAPOD = fetchAPOD;
const fetchNEO = async () => {
    const res = await fetch(`${BASE_URL}/nasa/neo`);
    const json = await res.json();
    return json.data;
};
exports.fetchNEO = fetchNEO;
