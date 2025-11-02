import { useEffect, useRef, useState } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import { Loader2, MapPin, MessageSquare, Trash2, Edit } from "lucide-react";
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
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}

export const AnnotatableDicomViewer = ({
  imageId,
  className = "",
  onAnnotationsChange,
}: AnnotatableDicomViewerProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Annotation state
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
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

  // Draw annotations
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !elementRef.current) return;

    const timer = setTimeout(() => {
      drawAnnotations();
    }, 50);

    return () => clearTimeout(timer);
  }, [annotations, imageLoaded]);

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    const element = elementRef.current;
    if (!canvas || !element) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    annotations.forEach((annotation) => {
      drawSingleAnnotation(ctx, annotation, canvas.width, canvas.height);
    });
  };

  const drawSingleAnnotation = (
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (!annotation.x || !annotation.y) return;

    const x = annotation.x * canvasWidth;
    const y = annotation.y * canvasHeight;

    // Draw pin/marker
    ctx.fillStyle = annotation.color || "rgba(220, 38, 38, 0.9)";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw white border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw comment indicator if there's a comment
    if (annotation.comment) {
      ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
      ctx.beginPath();
      ctx.arc(x + 10, y - 10, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("i", x + 10, y - 7);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setIsDrawing(true);
    setCurrentAnnotation({
      id: Date.now().toString(),
      type: drawingMode,
      x,
      y,
      width: 0,
      height: 0,
      comment: "",
      color: "rgba(220, 38, 38, 0.8)",
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;

    setCurrentAnnotation({
      ...currentAnnotation,
      width: currentX - (currentAnnotation.x || 0),
      height: currentY - (currentAnnotation.y || 0),
    });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    setIsDrawing(false);

    // Only save if annotation has meaningful size
    if (Math.abs(currentAnnotation.width || 0) > 0.02 && Math.abs(currentAnnotation.height || 0) > 0.02) {
      setPendingAnnotation(currentAnnotation as Annotation);
      setShowCommentDialog(true);
    }

    setCurrentAnnotation(null);
  };

  const handleSaveComment = () => {
    if (pendingAnnotation) {
      const newAnnotation = { ...pendingAnnotation, comment: commentText };
      const updatedAnnotations = [...annotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      onAnnotationsChange?.(updatedAnnotations);
      toast.success("Annotation added", {
        description: commentText ? `"${commentText.substring(0, 30)}..."` : "No comment",
      });
    }

    setShowCommentDialog(false);
    setCommentText("");
    setPendingAnnotation(null);
    setDrawingMode(null);
  };

  const handleDeleteAnnotation = (id: string) => {
    const updatedAnnotations = annotations.filter(a => a.id !== id);
    setAnnotations(updatedAnnotations);
    onAnnotationsChange?.(updatedAnnotations);
    toast.success("Annotation deleted");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toolbar */}
      {imageLoaded && (
        <div className="flex gap-2">
          <Button
            variant={drawingMode === "circle" ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawingMode(drawingMode === "circle" ? null : "circle")}
          >
            <Circle className="h-4 w-4 mr-1" />
            Circle
          </Button>
          <Button
            variant={drawingMode === "rectangle" ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawingMode(drawingMode === "rectangle" ? null : "rectangle")}
          >
            <Square className="h-4 w-4 mr-1" />
            Rectangle
          </Button>
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
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
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
          <p className="text-xs font-medium text-muted-foreground">Your Annotations ({annotations.length})</p>
          {annotations.map((annotation, index) => (
            <div key={annotation.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
              <MessageSquare className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-destructive">
                  Annotation {index + 1} ({annotation.type})
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
              <Input
                placeholder="Enter your observation or note..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveComment()}
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
