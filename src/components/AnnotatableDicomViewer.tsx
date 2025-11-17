import { useEffect, useRef, useState, useCallback } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import { Loader2, MapPin, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

// Configure cornerstone WADO Image Loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

export interface Annotation {
  id: string;
  type: "point";
  x: number; // Normalized 0-1
  y: number;
  comment: string;
  color: string;
}

interface AnnotatableDicomViewerProps {
  imageId?: string;
  className?: string;
  annotations?: Annotation[];
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}

export const AnnotatableDicomViewer = ({
  imageId,
  className = "",
  annotations: externalAnnotations = [],
  onAnnotationsChange,
}: AnnotatableDicomViewerProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use external annotations if provided, otherwise use internal state
  const annotations = externalAnnotations;

  // UI state
  const [drawingMode, setDrawingMode] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<Annotation | null>(null);
  const [commentText, setCommentText] = useState("");

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

  // Draw single annotation helper
  const drawSingleAnnotation = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      annotation: Annotation,
      canvasWidth: number,
      canvasHeight: number,
      annotationNumber: number
    ) => {
      if (!annotation.x || !annotation.y) return;

      const x = annotation.x * canvasWidth;
      const y = annotation.y * canvasHeight;

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
      ctx.fillText(annotationNumber.toString(), x, y);

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
    },
    []
  );

  // Draw annotations
  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    const element = elementRef.current;
    if (!canvas || !element) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations with numbers
    annotations.forEach((annotation, index) => {
      drawSingleAnnotation(ctx, annotation, canvas.width, canvas.height, index + 1);
    });
  }, [annotations, drawSingleAnnotation]);

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !elementRef.current) return;

    const timer = setTimeout(() => {
      drawAnnotations();
    }, 50);

    return () => clearTimeout(timer);
  }, [annotations, imageLoaded, drawAnnotations]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Create a point annotation
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: "point",
      x,
      y,
      comment: "",
      color: "rgba(59, 130, 246, 1)", // Blue for clinician annotations
    };

    setPendingAnnotation(newAnnotation);
    setShowCommentDialog(true);
  };

  const handleSaveComment = () => {
    if (pendingAnnotation) {
      const newAnnotation = { ...pendingAnnotation, comment: commentText };
      const updatedAnnotations = [...annotations, newAnnotation];
      onAnnotationsChange?.(updatedAnnotations);
      toast.success("Annotation added", {
        description: commentText ? `"${commentText.substring(0, 30)}..."` : "No comment",
      });
    }

    setShowCommentDialog(false);
    setCommentText("");
    setPendingAnnotation(null);
    setDrawingMode(false);
  };

  const handleDeleteAnnotation = (id: string) => {
    const updatedAnnotations = annotations.filter(a => a.id !== id);
    onAnnotationsChange?.(updatedAnnotations);
    toast.success("Annotation deleted");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      {imageLoaded && (
        <div className="flex gap-2 items-center">
          <Button
            variant={drawingMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawingMode(!drawingMode)}
          >
            <MapPin className="h-4 w-4 mr-1" />
            {drawingMode ? "Click to Add Note" : "Add Annotation"}
          </Button>
          {drawingMode && (
            <span className="text-xs text-muted-foreground">
              Click anywhere on the image to place a note
            </span>
          )}
        </div>
      )}

      {/* Viewer */}
      <div className="relative">
        <div
          ref={elementRef}
          className="w-full h-full bg-black rounded-lg overflow-hidden"
          style={{ minHeight: "400px" }}
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 rounded-lg"
          style={{
            display: imageLoaded ? "block" : "none",
            cursor: drawingMode ? "crosshair" : "default",
            zIndex: 10,
          }}
          onClick={handleCanvasClick}
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

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Clinician Annotations ({annotations.length})</p>
          {annotations.map((annotation, index) => (
            <div key={annotation.id} className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-blue-600 dark:text-blue-400">
                  Annotation {index + 1}
                </p>
                {annotation.comment && (
                  <p className="text-muted-foreground truncate">{annotation.comment}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleDeleteAnnotation(annotation.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment to Annotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                placeholder="Enter your observation or note..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCommentDialog(false);
              setCommentText("");
              setPendingAnnotation(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveComment}>Save Annotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
