import { useEffect, useState } from "react";
import { Download, Layers3, Search } from "lucide-react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { fetchNEO, NEOObject } from "../../api/nasa";
import { datasets } from "../../data/mockData";
import { useTranslation } from "../../i18n/useTranslation";
import { Language } from "../../types";
import { SectionHeader } from "../common/SectionHeader";
import { NasaExplorer } from "../nasa/NasaExplorer";

export function MapViewer({ language }: { language: Language }) {
  const { t } = useTranslation(language);
  const [neos, setNeos] = useState<(NEOObject & { lat: number; lng: number })[]>([]);

  useEffect(() => {
    fetchNEO()
      .then((data) => {
        const mapped = data.map((neo) => ({
          ...neo,
          lat: Math.random() * 120 - 60,
          lng: Math.random() * 360 - 180,
        }));
        setNeos(mapped);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="space-y-6">
      <SectionHeader
        action={
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            type="button"
          >
            <Download className="h-4 w-4" />
            {t("downloadDataset")}
          </button>
        }
        description={t("spatialDataDesc")}
        eyebrow={t("spatialData")}
        title={t("spatialDataTitle")}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-[28px] p-5">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              {[
                "Coordinates: -84.4, 41.2",
                "Date: 2026-03-27",
                "Satellite: Chandrayaan-2",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-sky-200" />
              <p className="text-sm font-medium text-slate-100">{t("layerToggles")}</p>
            </div>
            <div className="space-y-3">
              {[
                "Elevation overlay",
                "Multispectral composite",
                "NDVI proxy",
                "Crater detection mask",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-300">{item}</span>
                  <div
                    className={`h-6 w-11 rounded-full p-1 ${index < 3 ? "bg-sky-300/20" : "bg-white/10"}`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition ${index < 3 ? "translate-x-5" : ""}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-5">
            <p className="text-sm font-medium text-slate-100">{t("datasetPreview")}</p>
            <div className="mt-4 space-y-3">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{dataset.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {dataset.satellite} | {dataset.date}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-300/10 px-3 py-1 text-xs text-sky-100">
                      {dataset.type}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{dataset.coords}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-100">{t("interactiveMap")}</p>
              <p className="text-xs text-slate-400">Leaflet-ready lunar exploration surface</p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
              4 layers active
            </span>
          </div>
          <div className="h-[620px] overflow-hidden rounded-[24px] border border-white/10">
            <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[20, 0]}>
                <Popup>Lunar south polar preview region</Popup>
              </Marker>
              {neos.map((neo) => {
                const diameterMax = neo.estimated_diameter.kilometers.estimated_diameter_max;
                const approach = neo.close_approach_data[0];
                return (
                  <Circle
                    key={neo.id}
                    center={[neo.lat, neo.lng]}
                    radius={diameterMax * 50000}
                    pathOptions={{
                      color: neo.is_potentially_hazardous_asteroid ? "red" : "yellow",
                      fillColor: neo.is_potentially_hazardous_asteroid ? "red" : "yellow",
                      fillOpacity: 0.5,
                    }}
                  >
                    <Popup>
                      <strong>{neo.name}</strong>
                      <br />
                      Diameter (max): {diameterMax.toFixed(3)} km
                      <br />
                      Miss distance: {Number(approach?.miss_distance.kilometers).toLocaleString()} km
                      <br />
                      Velocity: {Number(approach?.relative_velocity.kilometers_per_hour).toLocaleString()} km/h
                      <br />
                      Hazardous: {neo.is_potentially_hazardous_asteroid ? "Yes" : "No"}
                    </Popup>
                  </Circle>
                );
              })}
            </MapContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 px-1">
            <span className="text-xs text-slate-400">Legend:</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
              Hazardous
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
              Safe
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SectionHeader
          description="Explore NASA's Astronomy Picture of the Day collection and discover the latest images from space."
          eyebrow="Astronomy"
          title={t("nasaAstronomyData")}
        />
        <div className="mt-6">
          <NasaExplorer />
        </div>
      </div>
    </section>
  );
}
