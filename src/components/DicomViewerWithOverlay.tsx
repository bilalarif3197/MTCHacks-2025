import { useEffect, useRef, useState } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import { Loader2 } from "lucide-react";

// Configure cornerstone WADO Image Loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

export interface HeatmapRegion {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  label?: string;
  explanation?: string;
}

interface DicomViewerWithOverlayProps {
  imageId?: string;
  className?: string;
  onImageLoaded?: () => void;
  showHeatmap?: boolean;
  heatmapIntensity?: number; // 0-1 scale, based on AI confidence
  heatmapRegions?: HeatmapRegion[]; // Custom regions with explanations
  onRegionHover?: (region: HeatmapRegion | null) => void;
}

export const DicomViewerWithOverlay = ({
  imageId,
  className = "",
  onImageLoaded,
  showHeatmap = false,
  heatmapIntensity = 0,
  heatmapRegions,
  onRegionHover,
}: DicomViewerWithOverlayProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<HeatmapRegion | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Enable the element for Cornerstone
    try {
      cornerstone.enable(element);
    } catch (err) {
      console.error("Failed to enable cornerstone:", err);
      setError("Failed to initialize viewer");
      setLoading(false);
      return;
    }

    // Load and display the image if imageId is provided
    if (imageId) {
      setLoading(true);
      setError(null);
      setImageLoaded(false);

      cornerstone
        .loadImage(imageId)
        .then((image) => {
          cornerstone.displayImage(element, image);
          setLoading(false);
          setImageLoaded(true);
          onImageLoaded?.();
        })
        .catch((err) => {
          console.error("Failed to load image:", err);
          setError("Failed to load DICOM image");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    // Cleanup
    return () => {
      try {
        cornerstone.disable(element);
      } catch (err) {
        console.error("Error disabling cornerstone:", err);
      }
    };
  }, [imageId, onImageLoaded]);

  // Draw heatmap overlay
  useEffect(() => {
    if (!showHeatmap || !imageLoaded || !canvasRef.current || !elementRef.current) {
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      drawHeatmap();
    }, 100);

    return () => clearTimeout(timer);
  }, [showHeatmap, heatmapIntensity, imageLoaded]);

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    const element = elementRef.current;
    if (!canvas || !element) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match the viewer
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    console.log("Drawing heatmap:", {
      width: canvas.width,
      height: canvas.height,
      intensity: heatmapIntensity
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Use custom regions if provided, otherwise generate based on intensity
    const regions = heatmapRegions || generateHeatmapRegions(heatmapIntensity);

    regions.forEach((region) => {
      const gradient = ctx.createRadialGradient(
        region.x * canvas.width,
        region.y * canvas.height,
        0,
        region.x * canvas.width,
        region.y * canvas.height,
        region.radius * Math.min(canvas.width, canvas.height)
      );

      // Color based on confidence: red = high, yellow = medium, transparent = low
      const alpha = region.intensity * 0.5; // Max 50% opacity
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${alpha * 0.6})`);
      gradient.addColorStop(1, "rgba(255, 165, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    // Draw highlighting boxes with labels
    regions.forEach((region) => {
      const isHovered = hoveredRegion === region;
      ctx.strokeStyle = `rgba(255, 0, 0, ${isHovered ? 1 : region.intensity})`;
      ctx.lineWidth = isHovered ? 4 : 3;
      ctx.setLineDash([5, 5]);

      const boxSize = region.radius * Math.min(canvas.width, canvas.height) * 1.5;
      const x = region.x * canvas.width - boxSize / 2;
      const y = region.y * canvas.height - boxSize / 2;

      ctx.strokeRect(x, y, boxSize, boxSize);

      // Draw label if provided
      if (region.label) {
        ctx.font = "bold 12px system-ui";
        ctx.fillStyle = isHovered ? "rgba(255, 0, 0, 1)" : "rgba(255, 0, 0, 0.9)";
        ctx.fillText(region.label, x + 5, y + 15);
      }
    });

    console.log("Heatmap drawn successfully with", regions.length, "regions");
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapRegions) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Find if mouse is over any region
    const regions = heatmapRegions;
    let foundRegion: HeatmapRegion | null = null;

    for (const region of regions) {
      const dx = x - region.x;
      const dy = y - region.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < region.radius) {
        foundRegion = region;
        break;
      }
    }

    if (foundRegion !== hoveredRegion) {
      setHoveredRegion(foundRegion);
      onRegionHover?.(foundRegion);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredRegion(null);
    onRegionHover?.(null);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={elementRef}
        className="w-full h-full bg-black rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />

      {/* Heatmap overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 rounded-lg"
        style={{
          display: showHeatmap && imageLoaded ? "block" : "none",
          zIndex: 10,
          cursor: heatmapRegions && heatmapRegions.length > 0 ? "pointer" : "default"
        }}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />

      {/* Tooltip for hovered region */}
      {hoveredRegion && hoveredRegion.explanation && (
        <div className="absolute bottom-4 left-4 right-4 bg-accent/95 border-2 border-accent text-white p-3 rounded-lg shadow-lg z-40 animate-fade-in">
          <div className="font-semibold text-sm mb-1">{hoveredRegion.label}</div>
          <div className="text-xs opacity-90">{hoveredRegion.explanation}</div>
          <div className="text-xs opacity-75 mt-1">
            Confidence: {(hoveredRegion.intensity * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-20">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading DICOM image...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg z-20">
          <div className="text-center space-y-2 p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <p className="text-xs text-muted-foreground">Please check the image path and try again</p>
          </div>
        </div>
      )}

      {showHeatmap && imageLoaded && (
        <div className="absolute top-2 right-2 bg-red-600/90 text-white px-3 py-1 rounded-md text-xs font-medium z-30">
          AI Overlay Active
        </div>
      )}
    </div>
  );
};

// Generate simulated heatmap regions based on AI confidence
function generateHeatmapRegions(intensity: number): HeatmapRegion[] {
  if (intensity < 0.3) return []; // Low confidence, no highlights

  // Simulate 1-2 regions of interest based on confidence
  const numRegions = intensity > 0.7 ? 2 : 1;
  const regions: HeatmapRegion[] = [];

  for (let i = 0; i < numRegions; i++) {
    regions.push({
      x: 0.35 + i * 0.25, // Position (normalized 0-1)
      y: 0.4 + i * 0.2,
      radius: 0.2 + intensity * 0.1, // Size based on confidence
      intensity: intensity,
      label: `Region ${i + 1}`,
      explanation: `AI detected potential finding with ${(intensity * 100).toFixed(0)}% confidence`
    });
  }

  return regions;
}
