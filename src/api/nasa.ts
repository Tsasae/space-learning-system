export interface APODImage {
  date: string;
  title: string;
  explanation: string;
  url: string;
  media_type: string;
}

export interface NEOObject {
  id: string;
  name: string;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: {
    close_approach_date: string;
    miss_distance: {
      kilometers: string;
    };
    relative_velocity: {
      kilometers_per_hour: string;
    };
  }[];
}

const NASA_KEY = 'gHtKQXKgO26BQghZNFP5aE7adQiF7ORVAoeWvKn8';

export const fetchAPOD = async (count: number = 10): Promise<APODImage[]> => {
  const response = await fetch(
    `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&count=${count}`
  );
  if (!response.ok) throw new Error('NASA API error');
  return response.json();
};

export const fetchNEO = async (): Promise<NEOObject[]> => {
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(
    `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`
  );
  if (!response.ok) throw new Error('NEO API error');
  const data = await response.json();
  const allNEOs: NEOObject[] = [];
  Object.values(data.near_earth_objects).forEach((dayNEOs: any) => {
    allNEOs.push(...dayNEOs);
  });
  return allNEOs;
};
