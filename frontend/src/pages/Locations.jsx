import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../css/Locations.css";
import storefrontImg from "../assets/TravelBookersStoreFront.jpg";

const DEFAULT_POSITION = [33.8819, -117.8869];

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function Locations() {
  const popupContent = useMemo(
    () => (
      <div style={{ minWidth: "180px" }}>
        <strong>Travel Bookers at CSUF</strong>
        <br />
        Langsdorf Hall Room 111
        <br />
        Fullerton, CA 92831
      </div>
    ),
    []
  );

  return (
    <section className="locations-page">
      <div className="locations-hero">
        <div className="locations-text">
          <h1>Our Fullerton Campus Office</h1>
          <p>
            We&apos;re rooted right inside California State University, Fullerton, where students,
            staff, and the surrounding community can easily pick up premium rentals, get trip
            planning help, or chat with our concierge about adventure packages. Swing by to see the
            fleet, sip a cold brew, and plan your next getaway with a team that knows Orange County
            inside and out.
          </p>
          <div className="locations-address">
            <strong>Travel Bookers @ CSUF</strong>
            Office of Admissions
            <br />
            800 N State College Blvd
            <br />
            Langsdorf Hall Room 111
            <br />
            Fullerton, CA 92831
          </div>
        </div>
        <div className="locations-image-card">
          <img src={storefrontImg} alt="Travel Bookers storefront" />
        </div>
      </div>

      <div className="locations-map-card">
        <h2>Find us on the map</h2>
        <p>
          The marker below pins our office on the north side of campus, steps away from the Office
          of Admissions. Street parking is available along State College Blvd, and the Nutwood
          Parking Structure is less than a five-minute walk.
        </p>
        <div className="locations-map-wrapper">
          <MapContainer
            center={DEFAULT_POSITION}
            zoom={16}
            scrollWheelZoom={false}
            className="locations-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={DEFAULT_POSITION}>{popupContent}</Marker>
          </MapContainer>
        </div>
      </div>
    </section>
  );
}

export default Locations;
