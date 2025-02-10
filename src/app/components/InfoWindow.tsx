import { DataPoint } from "./scatterplot";

const InfoWindow: React.FC<{ point: DataPoint | null; position: { x: number; y: number } | null }> = ({ point, position }) => {
    if (!point || !position) return null; // Don't render if no point is selected

    return (
        <div
            style={{
                position: "absolute",
                top: position.y + 10, // Offset to avoid overlapping cursor
                left: position.x + 10,
                background: "white",
                color: "black",
                padding: "8px",
                border: "1px solid black",
                borderRadius: "5px",
                boxShadow: "2px 2px 10px rgba(0,0,0,0.3)",
                zIndex: 1000
            }}
        >
            <p><strong>Label:</strong> {point.label}</p>
            <p><strong>X:</strong> {point.x.toFixed(2)}</p>
            <p><strong>Y:</strong> {point.y.toFixed(2)}</p>
        </div>
    );
};

export default InfoWindow;
