const BASE_URL = 'http://localhost:8000/api';

    export const fetchAPOD = async () => {
    const res = await fetch(`${BASE_URL}/nasa/apod`);
    const json = await res.json();
    return json.data;
    };

    export const fetchNEO = async () => {
    const res = await fetch(`${BASE_URL}/nasa/neo`);
    const json = await res.json();
    return json.data;
    };