import {
  Map,
  MapProvider,
  MapRef,
  MapboxEvent,
  NavigationControl,
  useMap,
} from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fetcher } from "./lib/fetcher";
import { IconMarker } from "./components/IconMarker";
import useSWR from "swr";
import * as turf from "@turf/turf";

import "./App.css";
import { useCallback, useEffect, useRef, useState } from "react";

type GyamapResponse = {
  desc: string;
  latitude: number;
  longitude: number;
  photo: string;
  title: string;
  zoom: number;
};

const GyamapPhoto: React.FC<{ poi: GyamapResponse }> = ({ poi }) => {
  const { mainMap: map } = useMap();

  const flyTo = useCallback(
    (e: any) => {
      if (!map) return;

      map.flyTo({
        center: [poi.longitude, poi.latitude],
        zoom: map.getZoom(),
      });
    },
    [map, poi]
  );

  return (
    <div
      style={{
        margin: "0 5px 5px",
        cursor: "pointer",
      }}
      onClick={flyTo}
    >
      <img
        style={{
          height: "195px",
          width: "195px",
          objectFit: "cover",
        }}
        src={poi.photo + "/raw"}
      />
    </div>
  );
};

const GyamapTitle: React.FC<{ poi: GyamapResponse }> = ({ poi }) => {
  const { mainMap: map } = useMap();

  const flyTo = useCallback(
    (e: any) => {
      if (!map) return;

      map.flyTo({
        center: [poi.longitude, poi.latitude],
        zoom: map.getZoom(),
      });
    },
    [map, poi]
  );

  return (
    <li style={{ marginTop: "5px" }}>
      <a target="_blank" href={"https://scrapbox.io/yuiseki/" + poi.title}>
        <img
          width={18}
          height={18}
          src="https://scrapbox.io/assets/img/favicon/favicon.ico"
        />
      </a>
      <span> </span>
      <span onClick={flyTo} style={{ fontWeight: "bold", cursor: "pointer" }}>
        {poi.title}
      </span>
      {poi.desc && poi.desc.length > 0 && (
        <>
          <span>: </span>
          <span>{poi.desc}</span>
        </>
      )}
    </li>
  );
};

function App() {
  const mapRef = useRef<MapRef | null>(null);
  const [currentCenter, setCurrentCenter] = useState<number[] | undefined>(
    undefined
  );

  const gyamapUrl = "https://gyamap.com/project_entries/yuiseki";
  const { data } = useSWR<GyamapResponse[]>(gyamapUrl, fetcher);
  const [sortedData, setSortedData] = useState<GyamapResponse[] | undefined>(
    undefined
  );

  const onLoad = useCallback(() => {
    if (!mapRef || !mapRef.current) return;
    setCurrentCenter([
      mapRef.current.getCenter().lng,
      mapRef.current.getCenter().lat,
    ]);
  }, []);

  const onMove = useCallback(() => {
    if (!mapRef || !mapRef.current) return;
    setCurrentCenter([
      mapRef.current.getCenter().lng,
      mapRef.current.getCenter().lat,
    ]);
  }, []);

  useEffect(() => {
    if (!currentCenter) return;
    if (!data) return;
    const sorted = data.sort((poi1, poi2) => {
      // Note order: longitude, latitude.
      const center = turf.point(currentCenter);
      const from = turf.point([poi1.longitude, poi1.latitude]);
      const to = turf.point([poi2.longitude, poi2.latitude]);
      const centerToFrom = turf.distance(center, from, { units: "degrees" });
      const centerToTo = turf.distance(center, to, { units: "degrees" });
      return centerToFrom - centerToTo;
    });
    setSortedData(sorted);
  }, [currentCenter, data]);

  return (
    <div className="App">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "20px",
        }}
      >
        <h3 style={{ margin: "0px", padding: "0px" }}>Gyamap React</h3>
        <p style={{ margin: "0px", paddingLeft: "20px" }}>
          このWebサイトは
          <a
            target="_blank"
            href="https://ja.wikipedia.org/wiki/%E5%A2%97%E4%BA%95%E4%BF%8A%E4%B9%8B"
          >
            増井俊之さん
          </a>
          が発明した
          <a target="_blank" href="https://gyamap.com/">
            Gyamap
          </a>
          をReactで写経したプロトタイプです
        </p>
        <p style={{ margin: "0px", paddingLeft: "20px" }}>
          <a href="https://scrapbox.io/Gyamap/%E6%A6%82%E8%A6%81">Gyamapとは</a>
        </p>
      </div>
      <MapProvider>
        <div style={{ display: "flex", margin: "20px" }}>
          <Map
            style={{
              display: "block",
              flexGrow: 1,
              minWidth: "400px",
              maxWidth: "400px",
              width: "400px",
              height: "400px",
            }}
            id="mainMap"
            ref={mapRef}
            mapLib={maplibregl}
            mapStyle="https://tile.openstreetmap.jp/styles/osm-bright/style.json"
            attributionControl={true}
            initialViewState={{
              latitude: 35.7084,
              longitude: 139.784,
              zoom: 11,
            }}
            hash={false}
            maxZoom={22}
            maxPitch={85}
            onLoad={onLoad}
            onMove={onMove}
          >
            {data &&
              data.map((poi) => {
                return (
                  <IconMarker
                    key={poi.title}
                    icon={"yuiseki_icon.png"}
                    {...poi}
                  />
                );
              })}
            <NavigationControl
              position="bottom-right"
              visualizePitch={true}
              showZoom={true}
              showCompass={true}
            />
          </Map>
          <div style={{ flexGrow: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                marginLeft: "5px",
              }}
            >
              {sortedData &&
                sortedData
                  .filter((poi) => poi.photo && poi.photo.length > 0)
                  .slice(0, 14)
                  .map((poi, idx) => {
                    return <GyamapPhoto key={poi.title} poi={poi} />;
                  })}
            </div>
          </div>
        </div>
        <div>
          <ul style={{ listStyle: "none", padding: 0, margin: "20px" }}>
            {sortedData &&
              sortedData.map((poi) => {
                return <GyamapTitle key={poi.title} poi={poi} />;
              })}
          </ul>
        </div>
      </MapProvider>
    </div>
  );
}

export default App;
