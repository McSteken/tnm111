import React, { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import InfoWindow from "./InfoWindow";

interface DataPoint {
  x: number;
  y: number;
  label: string;
}

const ScatterPlot: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [currentDataset, setCurrentDataset] = useState<"data1" | "data2">("data1");
  const [highlightedNeighbors, setHighlightedNeighbors] = useState<DataPoint[]>([]);
  const [infoWindow, setInfoWindow] = useState<{ x: number; y: number } | null>(null);

  const loadData = (dataset: "data1" | "data2") => {
    const filePath = `/data/${dataset}.csv`;
    Papa.parse(filePath, {
      download: true,
      header: false,
      complete: (results) => {
        const parsedData = (results.data as string[][]).map((row) => ({
            x: parseFloat(row[0]),
            y: parseFloat(row[1]),
            label: row[2] as string,
          }));
        setData(parsedData);
        setSelectedPoint(null); // Reset selected point on dataset switch
      },
    });
  };

  useEffect(() => {
    loadData(currentDataset);
  }, [currentDataset]); 
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && data.length > 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;

        // Calculate min and max values
        const minX = Math.floor(Math.min(...data.map((d) => d.x)) / 10) * 10;
        const maxX = Math.ceil(Math.max(...data.map((d) => d.x)) / 10) * 10;
        const minY = Math.floor(Math.min(...data.map((d) => d.y)) / 10) * 10;
        const maxY = Math.ceil(Math.max(...data.map((d) => d.y)) / 10) * 10;

        // Scale functions
        const xScale = (x: number) =>
          padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding);
        const yScale = (y: number) =>
          height - padding - ((y - minY) / (maxY - minY)) * (height - 2 * padding);

        ctx.clearRect(0, 0, width, height);

        // Determine where axes should cross
        const zeroX = currentDataset === "data1" ? xScale(0) : padding;
        const zeroY = currentDataset === "data1" ? yScale(0) : height - padding;

        // Draw axes
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(zeroX, padding); // Y-axis
        ctx.lineTo(zeroX, height - padding);
        ctx.moveTo(padding, zeroY); // X-axis
        ctx.lineTo(width - padding, zeroY);
        ctx.stroke();

        // ticks 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";

        for (let x = Math.ceil(minX / 10) * 10; x <= maxX; x += 10) {
            const xPos = xScale(x);
            ctx.beginPath();
            ctx.moveTo(xPos, zeroY - 5); 
            ctx.lineTo(xPos, zeroY + 5);
            ctx.stroke();
            
            ctx.fillText(x.toString(), xPos, zeroY + 15); // Adjust label position
        }
        for (let y = Math.ceil(minY / 10) * 10; y <= maxY; y += 10) {
            const yPos = yScale(y);
            ctx.beginPath();
            ctx.moveTo(zeroX - 5, yPos); // Position ticks relative to axis line
            ctx.lineTo(zeroX + 5, yPos);
            ctx.stroke();
            
            ctx.fillText(y.toString(), zeroX - 15, yPos); // Adjust label position
        }
        
        // Draw subtle lines for the new origin if a point is selected
        if (selectedPoint) {
            const originX = xScale(selectedPoint.x);
            const originY = yScale(selectedPoint.y);
    
            ctx.strokeStyle = "lightgray";
            ctx.lineWidth = 1;
    
            // Vertical line (new y-axis)
            ctx.beginPath();
            ctx.moveTo(originX, padding);
            ctx.lineTo(originX, height - padding);
            ctx.stroke();
    
            // Horizontal line (new x-axis)
            ctx.beginPath();
            ctx.moveTo(padding, originY);
            ctx.lineTo(width - padding, originY);
            ctx.stroke();
            }
    

        // Draw points
        const drawShape = (
          ctx: CanvasRenderingContext2D,
          x: number,
          y: number,
          label: string,
          highlight = false,
          color?: string
        ) => {
          ctx.beginPath();
          ctx.fillStyle = color || "red";
          switch (label) {
            case "a":
            case "foo":
              ctx.arc(x, y, 5, 0, 2 * Math.PI); // Circle
              break;
            case "b":
            case "baz":
              ctx.rect(x - 5, y - 5, 10, 10); // Square
              break;
            case "c":
            case "bar":
              ctx.moveTo(x, y - 8); // Triangle
              ctx.lineTo(x + 8, y + 8);
              ctx.lineTo(x - 8, y + 8);
              ctx.closePath();
              break;
          }
          ctx.fill();

          if (highlight) {
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        };

        // Apply quadrant-based coloring
        data.forEach((point) => {
            const x = xScale(point.x);
            const y = yScale(point.y);
            let color = "red";
        
            if (selectedPoint) {
                if (highlightedNeighbors.includes(point)) {
                  color = "green"; // Nearest neighbors
                } else if (point === selectedPoint) {
                  color = "blue"; // Selected point
                } else if (highlightedNeighbors.length > 0) {
                  color = "gray"; // Other points when neighbors are highlighted
                } else {
                    // Apply quadrant-based colors
                    if (point.x >= selectedPoint.x && point.y >= selectedPoint.y) {
                        color = "purple"; // Top-right
                    } else if (point.x <= selectedPoint.x && point.y >= selectedPoint.y) {
                        color = "orange"; // Top-left
                    } else if (point.x <= selectedPoint.x && point.y <= selectedPoint.y) {
                        color = "pink"; // Bottom-left
                    } else if (point.x >= selectedPoint.x && point.y <= selectedPoint.y) {
                        color = "cyan"; // Bottom-right
                    }
                }
            }
            
            drawShape(ctx, x, y, point.label, false, color);
        });
        
        // Highlight selected point
        if (selectedPoint) {
          const selectedX = xScale(selectedPoint.x);
          const selectedY = yScale(selectedPoint.y);
          drawShape(ctx, selectedX, selectedY, selectedPoint.label, true);      
        }
      }
    }
  }, [data, selectedPoint, highlightedNeighbors]);


  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
  
      const width = canvas.width;
      const height = canvas.height;
      const padding = 50;
  
      const minX = Math.floor(Math.min(...data.map((d) => d.x)) / 10) * 10;
      const maxX = Math.ceil(Math.max(...data.map((d) => d.x)) / 10) * 10;
      const minY = Math.floor(Math.min(...data.map((d) => d.y)) / 10) * 10;
      const maxY = Math.ceil(Math.max(...data.map((d) => d.y)) / 10) * 10;

      const xScale = (x: number) => padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding);
      const yScale = (y: number) => height - padding - ((y - minY) / (maxY - minY)) * (height - 2 * padding);
  
      // Find the clicked point
      const clickedPoint = data.find(
          (point) => Math.abs(xScale(point.x) - clickX) < 10 && Math.abs(yScale(point.y) - clickY) < 10
      );
  
      if (!clickedPoint) return;
    
  
      if (event.button === 0 && !event.ctrlKey) {
          // Left Click (Quadrant Coloring)
          if (selectedPoint && selectedPoint.x === clickedPoint.x && selectedPoint.y === clickedPoint.y && highlightedNeighbors.length === 0) {
              setSelectedPoint(null);
              setInfoWindow(null); 

          } else {
              setSelectedPoint(clickedPoint);
              setInfoWindow({ x: event.clientX, y: event.clientY });

          }
          setHighlightedNeighbors([]); 

      } else if (event.ctrlKey && event.button === 0) {
          if (selectedPoint && selectedPoint.x === clickedPoint.x && selectedPoint.y === clickedPoint.y && highlightedNeighbors.length > 0) {
              setHighlightedNeighbors([]);
              setSelectedPoint(null);
              setInfoWindow(null); 
          } else {
              setSelectedPoint(clickedPoint);
              setInfoWindow({ x: event.clientX, y: event.clientY });
  
              // Find 5 Nearest Neighbors
              const neighbors = data
                  .filter(p => p !== clickedPoint)
                  .map(p => ({
                      point: p,
                      distance: Math.sqrt(Math.pow(p.x - clickedPoint.x, 2) + Math.pow(p.y - clickedPoint.y, 2))
                  }))
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, 5)
                  .map(item => item.point);
  
              setHighlightedNeighbors(neighbors);  
          }
      }
  };
    
  return (
    <div>
        <div className="toggle-container">
        <label className="toggle-label">
            <h2>Dataset:</h2>
            <input
            type="checkbox"
            className="toggle-checkbox"
            onChange={() =>
                setCurrentDataset(currentDataset === "data1" ? "data2" : "data1")
            }
            checked={currentDataset === "data2"}
            />
            <h2>{currentDataset === "data1" ? "Data 1" : "Data 2"}</h2>
        </label>
        </div>

        <div className="flex gap-4">
        <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ width: "100%", height: "auto" }}
        onClick={handleClick}
        />

        <InfoWindow point={selectedPoint} position={infoWindow} />

        
        <div className="flex flex-col gap-4 w-1/3">
            <h1 className="font-bold">Legend:</h1>
            <div className="legend-item flex flex-row items-center gap-2">
            <svg width="20" height="20">
                <circle cx="10" cy="10" r="5" fill="red" />
            </svg>
            <h2>{currentDataset === "data1" ? "Label: a" : "Label: foo"}</h2>
            </div>
            <div className="legend-item flex flex-row items-center gap-2">
            <svg width="20" height="20">
                <rect x="5" y="5" width="10" height="10" fill="red" />
            </svg>
            <h2>{currentDataset === "data1" ? "Label: b" : "Label: baz"}</h2>
            </div>
            <div className="legend-item flex flex-row items-center gap-2">
                <svg width="20" height="20">
                    <polygon points="10,2 18,18 2,18" fill="red" />
                </svg>
                <h2>{currentDataset === "data1" ? "Label: c" : "Label: bar"}</h2>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlot;
export type { DataPoint };
