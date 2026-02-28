import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

interface Camera {
  id: number | string;
  name: string;
  location: string;
  position: [number, number];
  status: string;
  violations: number;
}

interface MapComponentProps {
  cameras: Camera[];
}

export function MapComponent({ cameras }: MapComponentProps) {
  return (
    <MapContainer
      center={[33.6844, 73.0479]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {cameras.map((camera) => (
        <Marker key={camera.id} position={camera.position}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold mb-1">{camera.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{camera.location}</p>
              <Badge
                className={
                  camera.status === "active"
                    ? "bg-success text-success-foreground"
                    : "bg-destructive text-destructive-foreground"
                }
              >
                {camera.status === "active" ? "Active" : "Offline"}
              </Badge>
              {camera.status === "active" && (
                <p className="text-sm mt-2">
                  <strong>Today's Violations:</strong> {camera.violations}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
