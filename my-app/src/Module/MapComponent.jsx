import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { OSM } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function MapComponent() {
  const mapRef = useRef();
  const vectorSource = new VectorSource();
  const [map, setMap] = useState();
  const [selectedPoints, setSelectedPoints] = useState([]);

  useEffect(() => {
    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: vectorSource }),
      ],
      view: new View({
        center: fromLonLat([77.5946, 12.9716]), // Bengaluru
        zoom: 12,
      }),
    });

    initialMap.on("singleclick", async (event) => {
      const [lon, lat] = toLonLat(event.coordinate);
console.log(lon,lat)
      const choice = prompt(
        "Choose action:\n1: Add Location\n2: Find Nearby (radius km)\n3: Find Nearest\n4: Select for Distance"
      );

      if (choice === "1") {
        const name = prompt("Enter location name:");
        const type = prompt("Enter location type:");
        if (name && type) {
          await axios.post(`${API_BASE}/add`, {
            name,
            type,
            latitude: lat,
            longitude: lon,
          });
          alert("Location added!");
          addMarker(lon, lat, "blue");
        }
      } else if (choice === "2") {
        const radius = prompt("Enter radius in km:");
        if (radius) {
          try {
            const res = await axios.get(`${API_BASE}/nearby`, {
              params: { lat, lon, radius },
            });
            console.log(res.data);  // Check the data structure in the response
            
            res.data.forEach((place) => {
              if (place.latitude != null && place.longitude != null) {
                addMarker(place.longitude, place.latitude, "green");
              } else {
                console.error("Invalid lat/lon for place:", place);
              }
            });
          } catch (err) {
            console.error('Error fetching nearby places:', err);
          }
        }
      } else if (choice === "3") {
        const res = await axios.get(`${API_BASE}/nearest`, {
          params: { lat, lon },
        });
        const place = res.data;
        alert(`Nearest: ${place.name} (${place.type})`);
        addMarker(
          place.longitude,
          place.latitude,
          "red"
        );
      } else if (choice === "4") {
        setSelectedPoints((prevPoints) => {
          const newPoints = [...prevPoints, { lat, lon }];
          addMarker(lon, lat, "orange");
          console.log(newPoints, " two points after adding");
      
          if (newPoints.length === 2) {
            const dist = calculateDistance(
              newPoints[0].lat,
              newPoints[0].lon,
              newPoints[1].lat,
              newPoints[1].lon
            );
            alert(`Distance: ${dist.toFixed(2)} km`);
            setSelectedPoints([]);
          }
      
          return newPoints;
        });
      }
      
    });

    setMap(initialMap);
  }, []);

// Haversine formula to calculate distance between two lat-lon points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};



  const addMarker = (lon, lat, color) => {
    const marker = new Feature({
      geometry: new Point(fromLonLat([lon, lat])),
    });

    marker.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: "white", width: 2 }),
        }),
      })
    );
    vectorSource.addFeature(marker);
  };

  const getPlaceIdByCoords = async ({ lat, lon }) => {
    const res = await axios.get(`${API_BASE}/nearby`, {
      params: { lat, lon, radius: 0.01 },
    });
    return res.data.length ? res.data[0].id : null;
  };

  return <div ref={mapRef} style={{ width: "100%", height: "90vh" }} />;
}
