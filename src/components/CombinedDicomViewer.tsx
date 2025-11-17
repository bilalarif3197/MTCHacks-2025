import { useEffect, useRef, useState, useCallback } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import { Loader2 } from "lucide-react";
import { type Annotation } from "./AnnotatableDicomViewer";
import { type HeatmapRegion } from "./DicomViewerWithOverlay";

// Configure cornerstone WADO Image Loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

interface CombinedDicomViewerProps {
  imageId?: string;
  className?: string;
  clinicianAnnotations?: Annotation[];
  aiRegions?: HeatmapRegion[];
  showConsensus?: boolean;
  onConsensusDetected?: (consensusRegions: ConsensusRegion[]) => void;
}

export interface ConsensusRegion {
  x: number;
  y: number;
  radius: number;
  clinicianAnnotation: Annotation;
  aiRegion: HeatmapRegion;
}

export const CombinedDicomViewer = ({
  imageId,
  className = "",
  clinicianAnnotations = [],
  aiRegions = [],
  showConsensus = false,
  onConsensusDetected,
}: CombinedDicomViewerProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [consensusRegions, setConsensusRegions] = useState<ConsensusRegion[]>([]);

  // Initialize cornerstone and load image
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    try {
      cornerstone.enable(element);
    } catch (err) {
      console.error("Failed to enable cornerstone:", err);
      setError("Failed to initialize viewer");
      setLoading(false);
      return;
    }

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
        })
        .catch((err) => {
          console.error("Failed to load image:", err);
          setError("Failed to load DICOM image");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      try {
        cornerstone.disable(element);
      } catch (err) {
        console.error("Error disabling cornerstone:", err);
      }
    };
  }, [imageId]);

  // Detect consensus regions where clinician annotations overlap with AI findings
  const detectConsensus = useCallback(() => {
    const detected: ConsensusRegion[] = [];

    clinicianAnnotations.forEach((annotation) => {
      aiRegions.forEach((region) => {
        // Calculate distance between annotation and region center
        const dx = annotation.x - region.x;
        const dy = annotation.y - region.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If annotation is within the AI region, it's consensus
        if (distance < region.radius) {
          detected.push({
            x: annotation.x,
            y: annotation.y,
            radius: region.radius * 0.8, // Slightly smaller than AI region
            clinicianAnnotation: annotation,
            aiRegion: region,
          });
        }
      });
    });

    setConsensusRegions(detected);
    onConsensusDetected?.(detected);
  }, [clinicianAnnotations, aiRegions, onConsensusDetected]);

  // Update consensus when annotations or regions change
  useEffect(() => {
    detectConsensus();
  }, [detectConsensus]);

  // Draw all overlays
  const drawOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    const element = elementRef.current;
    if (!canvas || !element) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw AI heatmap regions (orange/yellow gradient)
    aiRegions.forEach((region) => {
      const x = region.x * canvas.width;
      const y = region.y * canvas.height;
      const radius = region.radius * canvas.width;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const alpha = region.intensity || 0.3;
      gradient.addColorStop(0, `rgba(251, 146, 60, ${alpha})`); // Orange center
      gradient.addColorStop(0.5, `rgba(251, 191, 36, ${alpha * 0.6})`); // Yellow mid
      gradient.addColorStop(1, `rgba(251, 191, 36, 0)`); // Transparent edge

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "rgba(251, 146, 60, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw consensus regions (green highlights) if enabled
    if (showConsensus) {
      consensusRegions.forEach((consensus) => {
        const x = consensus.x * canvas.width;
        const y = consensus.y * canvas.height;
        const radius = consensus.radius * canvas.width;

        // Green pulsing highlight
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)"); // Green center
        gradient.addColorStop(0.5, "rgba(34, 197, 94, 0.2)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Green border
        ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    }

    // Draw clinician annotations (blue numbered markers for clear distinction)
    clinicianAnnotations.forEach((annotation, index) => {
      const x = annotation.x * canvas.width;
      const y = annotation.y * canvas.height;

      // Draw pin/marker with larger size for better visibility
      ctx.fillStyle = annotation.color || "rgba(59, 130, 246, 1)";
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI);
      ctx.fill();

      // Draw white border for contrast
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw annotation number in the center
      ctx.fillStyle = "white";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((index + 1).toString(), x, y);

      // Draw comment indicator if there's a comment
      if (annotation.comment) {
        ctx.fillStyle = annotation.color || "rgba(59, 130, 246, 1)";
        ctx.beginPath();
        ctx.arc(x + 16, y - 16, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("i", x + 16, y - 16);
      }
    });
  }, [aiRegions, clinicianAnnotations, showConsensus, consensusRegions]);

  // Redraw when overlays change
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !elementRef.current) return;

    const timer = setTimeout(() => {
      drawOverlays();
    }, 50);

    return () => clearTimeout(timer);
  }, [imageLoaded, drawOverlays]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={elementRef}
        className="w-full h-full bg-black rounded-lg overflow-hidden"
        style={{ minHeight: "400px" }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          display: imageLoaded ? "block" : "none",
          zIndex: 10,
        }}
      />

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
          </div>
        </div>
      )}
    </div>
  );
};
