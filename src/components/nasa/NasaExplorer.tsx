import { useEffect, useState } from 'react';
import { fetchAPOD, APODImage } from '../../api/nasa';

export const NasaExplorer = () => {
  const [images, setImages] = useState<APODImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        const data = await fetchAPOD(12);
        setImages(data);
        setError(null);
      } catch (err) {
        setError('Failed to load NASA images.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading NASA images...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.date} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <div className="w-full h-48 bg-gray-800 overflow-hidden">
              {image.media_type === 'image' ? (
                <img src={image.url} alt={image.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <p className="text-sm">Not an image</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-2">{image.date}</p>
              <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2">{image.title}</h3>
              <p className="text-sm text-gray-300 line-clamp-3">{image.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NasaExplorer;
