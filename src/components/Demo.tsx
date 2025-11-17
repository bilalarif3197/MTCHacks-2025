import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Layers, Upload } from "lucide-react";
import { toast } from "sonner";
import { DicomViewer } from "@/components/DicomViewer";
import { DicomViewerWithOverlay, type HeatmapRegion } from "@/components/DicomViewerWithOverlay";
import { AnnotatableDicomViewer, type Annotation } from "@/components/AnnotatableDicomViewer";
import { CombinedDicomViewer, type ConsensusRegion } from "@/components/CombinedDicomViewer";
import { DicomUploader } from "@/components/DicomUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Pathology descriptions for various chest radiography findings
const PATHOLOGY_INFO: Record<string, {
  fullName: string;
  description: string;
  secondaryFindings?: string[];
}> = {
  atelectasis: {
    fullName: "Atelectasis",
    description: "Collapse or closure of lung tissue detected. This finding shows characteristic opacity consistent with atelectasis, often caused by airway obstruction, compression, or post-surgical changes.",
    secondaryFindings: [
      "Adjacent tissue changes observed. May indicate volume loss or compensatory hyperinflation in neighboring lung segments.",
      "Mild mediastinal shift noted, consistent with volume loss in affected region."
    ]
  },
  pneumothorax: {
    fullName: "Pneumothorax",
    description: "Air accumulation detected in pleural space. Visible absence of lung markings with potential visceral pleural line, indicating separation of lung from chest wall.",
    secondaryFindings: [
      "Lung edge visualization suggests partial lung collapse.",
      "Possible tension signs: mediastinal shift or diaphragm depression may be present."
    ]
  },
  cardiomegaly: {
    fullName: "Cardiomegaly",
    description: "Enlarged cardiac silhouette detected. Cardiothoracic ratio appears increased, suggesting possible cardiac chamber enlargement or pericardial effusion.",
    secondaryFindings: [
      "Vascular congestion patterns may indicate associated heart failure.",
      "Pulmonary vascular redistribution suggestive of elevated pulmonary venous pressure."
    ]
  },
  lung_opacity: {
    fullName: "Lung Opacity",
    description: "Abnormal opacity detected in lung parenchyma. This finding may represent consolidation, infiltrate, mass, or other pathological process requiring clinical correlation.",
    secondaryFindings: [
      "Air bronchograms may be present, suggesting alveolar filling process.",
      "Pattern suggests possible infectious, inflammatory, or neoplastic etiology."
    ]
  },
  pleural_effusion: {
    fullName: "Pleural Effusion",
    description: "Fluid accumulation detected in pleural space. Characteristic blunting of costophrenic angle or meniscus sign indicates pleural fluid collection.",
    secondaryFindings: [
      "Compressive atelectasis may be present in adjacent lung tissue.",
      "Layering pattern suggests free-flowing pleural fluid."
    ]
  },
  consolidation: {
    fullName: "Consolidation",
    description: "Dense airspace opacity detected consistent with alveolar consolidation. Pattern suggests filling of alveolar spaces with fluid, pus, blood, or cells.",
    secondaryFindings: [
      "Air bronchograms visible within consolidated region.",
      "Lobar or segmental distribution pattern noted."
    ]
  },
  infiltration: {
    fullName: "Infiltration",
    description: "Pulmonary infiltrate detected showing increased interstitial or alveolar markings. Pattern may represent infection, inflammation, or other pathological process.",
    secondaryFindings: [
      "Bilateral distribution suggests diffuse process.",
      "Reticular or nodular pattern indicates interstitial involvement."
    ]
  },
  pleural_thickening: {
    fullName: "Pleural Thickening",
    description: "Abnormal pleural thickening detected. Findings consistent with chronic pleural changes, possibly from prior inflammation, infection, or asbestos exposure.",
    secondaryFindings: [
      "Localized pleural irregularity noted.",
      "May represent sequelae of prior empyema or hemothorax."
    ]
  },
  aortic_enlargement: {
    fullName: "Aortic Enlargement",
    description: "Widened aortic contour detected. Finding suggests possible aortic aneurysm, atherosclerotic changes, or other vascular abnormality requiring further evaluation.",
    secondaryFindings: [
      "Aortic calcification may be present.",
      "Mediastinal widening consistent with vascular enlargement."
    ]
  },
  calcification: {
    fullName: "Calcification",
    description: "Calcified density detected within lung parenchyma or associated structures. May represent granuloma from prior infection, healed tuberculosis, or other benign processes.",
    secondaryFindings: [
      "Multiple calcified nodules suggest prior granulomatous disease.",
      "Pattern consistent with old healed infection."
    ]
  },
  pulmonary_fibrosis: {
    fullName: "Pulmonary Fibrosis",
    description: "Interstitial changes consistent with pulmonary fibrosis detected. Reticular pattern and volume loss suggest chronic scarring of lung tissue.",
    secondaryFindings: [
      "Honeycombing pattern may indicate advanced fibrotic changes.",
      "Bilateral lower lobe predominance noted, typical of usual interstitial pneumonia pattern."
    ]
  },
  normal: {
    fullName: "Normal",
    description: "No significant abnormalities detected. Lung fields appear clear with normal cardiac silhouette, mediastinal contours, and bony structures.",
    secondaryFindings: []
  }
};

// Anatomically accurate region coordinates for different pathologies
// Based on typical chest X-ray anatomy (normalized 0-1 coordinates)
// X-ray orientation: 0,0 is top-left, 1,1 is bottom-right
const PATHOLOGY_REGIONS: Record<string, { x: number; y: number; radius: number; description: string }[]> = {
  atelectasis: [
    { x: 0.30, y: 0.35, radius: 0.18, description: "Left upper/mid lung zone" },
    { x: 0.70, y: 0.35, radius: 0.18, description: "Right upper/mid lung zone" }
  ],
  pneumothorax: [
    { x: 0.25, y: 0.25, radius: 0.15, description: "Left apical region" },
    { x: 0.75, y: 0.25, radius: 0.15, description: "Right apical region" }
  ],
  cardiomegaly: [
    { x: 0.50, y: 0.60, radius: 0.28, description: "Cardiac silhouette enlargement" }
  ],
  lung_opacity: [
    { x: 0.35, y: 0.45, radius: 0.20, description: "Left lung field" },
    { x: 0.65, y: 0.45, radius: 0.20, description: "Right lung field" }
  ],
  pleural_effusion: [
    { x: 0.30, y: 0.72, radius: 0.18, description: "Left costophrenic angle blunting" },
    { x: 0.70, y: 0.72, radius: 0.18, description: "Right costophrenic angle blunting" }
  ],
  consolidation: [
    { x: 0.35, y: 0.52, radius: 0.18, description: "Left lower lobe" },
    { x: 0.65, y: 0.52, radius: 0.18, description: "Right lower lobe" }
  ],
  infiltration: [
    { x: 0.35, y: 0.42, radius: 0.22, description: "Left perihilar/central region" },
    { x: 0.65, y: 0.42, radius: 0.22, description: "Right perihilar/central region" }
  ],
  pleural_thickening: [
    { x: 0.18, y: 0.50, radius: 0.12, description: "Left lateral pleural margin" },
    { x: 0.82, y: 0.50, radius: 0.12, description: "Right lateral pleural margin" }
  ],
  aortic_enlargement: [
    { x: 0.45, y: 0.28, radius: 0.16, description: "Aortic arch/knob widening" }
  ],
  calcification: [
    { x: 0.50, y: 0.55, radius: 0.18, description: "Cardiac/vascular calcification" }
  ],
  pulmonary_fibrosis: [
    { x: 0.35, y: 0.58, radius: 0.20, description: "Left lower zone reticular pattern" },
    { x: 0.65, y: 0.58, radius: 0.20, description: "Right lower zone reticular pattern" }
  ],
  ild: [
    { x: 0.35, y: 0.48, radius: 0.22, description: "Left mid/lower zone interstitial pattern" },
    { x: 0.65, y: 0.48, radius: 0.22, description: "Right mid/lower zone interstitial pattern" }
  ],
  normal: []
};

// Generate heatmap regions based on AI model response
function generateRegionsFromAIResponse(
  aiResponse: any
): HeatmapRegion[] {
  const score = aiResponse.results?.response?.score || 0;
  const modelId = aiResponse.model_id || aiResponse.results?.response?.model || "";

  // Extract pathology type from model ID (e.g., "mc_chestradiography_atelectasis:v1.20250828" -> "atelectasis")
  const pathologyMatch = modelId.match(/chestradiography_([a-z_]+)/i);
  const pathologyKey = pathologyMatch
    ? pathologyMatch[1].toLowerCase()
    : "lung_opacity";

  const pathologyInfo = PATHOLOGY_INFO[pathologyKey] || PATHOLOGY_INFO["lung_opacity"];

  // Only generate regions if confidence is above threshold
  if (score < 0.3) return [];

  // Get anatomically accurate regions for this pathology
  const anatomicalRegions = PATHOLOGY_REGIONS[pathologyKey] || PATHOLOGY_REGIONS["lung_opacity"];

  if (anatomicalRegions.length === 0) {
    // No regions for "normal" scans
    return [];
  }

  const regions: HeatmapRegion[] = [];

  // Primary finding - use first anatomical region
  const primaryRegion = anatomicalRegions[0];
  regions.push({
    x: primaryRegion.x,
    y: primaryRegion.y,
    radius: primaryRegion.radius,
    intensity: score,
    label: pathologyInfo.fullName,
    explanation: pathologyInfo.description
  });

  // Secondary finding - use second anatomical region if confidence is high
  if (score > 0.6 && anatomicalRegions.length > 1) {
    const secondaryRegion = anatomicalRegions[1];
    const secondaryLabel = pathologyInfo.secondaryFindings?.[0]
      ? "Secondary Finding"
      : pathologyInfo.fullName;
    const secondaryExplanation = pathologyInfo.secondaryFindings?.[0]
      || secondaryRegion.description;

    regions.push({
      x: secondaryRegion.x,
      y: secondaryRegion.y,
      radius: secondaryRegion.radius,
      intensity: score * 0.85,
      label: secondaryLabel,
      explanation: secondaryExplanation
    });
  }

  return regions;
}

// Available pathology models for user selection
const AVAILABLE_MODELS = [
  { key: 'auto', label: 'Auto-detect (Comprehensive)', description: 'Test all models' },
  { key: 'atelectasis', label: 'Atelectasis', description: 'Lung collapse' },
  { key: 'pneumothorax', label: 'Pneumothorax', description: 'Air in pleural space' },
  { key: 'cardiomegaly', label: 'Cardiomegaly', description: 'Enlarged heart' },
  { key: 'lung_opacity', label: 'Lung Opacity', description: 'Abnormal lung density' },
  { key: 'pleural_effusion', label: 'Pleural Effusion', description: 'Fluid in pleura' },
  { key: 'consolidation', label: 'Consolidation', description: 'Airspace filling' },
  { key: 'infiltration', label: 'Infiltration', description: 'Infiltrate pattern' },
  { key: 'pleural_thickening', label: 'Pleural Thickening', description: 'Thickened pleura' },
  { key: 'aortic_enlargement', label: 'Aortic Enlargement', description: 'Widened aorta' },
  { key: 'calcification', label: 'Calcification', description: 'Calcium deposits' },
  { key: 'pulmonary_fibrosis', label: 'Pulmonary Fibrosis', description: 'Lung scarring' },
  { key: 'ild', label: 'ILD', description: 'Interstitial lung disease' },
  { key: 'normal', label: 'Normal', description: 'No abnormalities' },
];

export const Demo = () => {
  const [viewMode, setViewMode] = useState<"sideBySide" | "combined">("sideBySide");
  const [showConsensus, setShowConsensus] = useState(false);
  const [dicomFile, setDicomFile] = useState<File | null>(null);
  const [dicomImageId, setDicomImageId] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [heatmapRegions, setHeatmapRegions] = useState<HeatmapRegion[]>([]);
  const [hoveredRegion, setHoveredRegion] = useState<HeatmapRegion | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [useParallel, setUseParallel] = useState<boolean>(true);
  const [consensusRegions, setConsensusRegions] = useState<ConsensusRegion[]>([]);

  const toggleConsensus = () => {
    setShowConsensus(!showConsensus);
    if (!showConsensus) {
      toast.info("Consensus highlighting enabled", {
        description: "Mutual agreement regions are now highlighted",
      });
    }
  };

  const handleFileSelect = (file: File) => {
    setDicomFile(file);
    // Create a wadouri imageId from the file
    const imageId = `wadouri:${URL.createObjectURL(file)}`;
    setDicomImageId(imageId);
    toast.success("DICOM file loaded", {
      description: file.name,
    });
  };

  const handleClearFile = () => {
    if (dicomImageId && dicomImageId.startsWith("wadouri:")) {
      URL.revokeObjectURL(dicomImageId.replace("wadouri:", ""));
    }
    setDicomFile(null);
    setDicomImageId(null);

    // Clear all analysis data
    setAiResults(null);
    setHeatmapRegions([]);
    setAnnotations([]);
    setConsensusRegions([]);
  };

  const handleLoadSample = async () => {
    try {
      // Fetch the sample DICOM file from public folder
      const response = await fetch('/sample.dcm');
      const blob = await response.blob();
      const file = new File([blob], 'sample-atelectasis.dcm', { type: 'application/dicom' });

      setDicomFile(file);
      const imageId = `wadouri:${URL.createObjectURL(blob)}`;
      setDicomImageId(imageId);

      // Clear previous analysis data when sample is loaded
      setAiResults(null);
      setHeatmapRegions([]);
      setAnnotations([]);
      setConsensusRegions([]);

      toast.success("Sample DICOM loaded", {
        description: "Chest X-ray with Atelectasis",
      });
    } catch (error) {
      console.error("Failed to load sample:", error);
      toast.error("Failed to load sample image", {
        description: "Please try uploading your own DICOM file",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.dcm')) {
      toast.error("Invalid file type", {
        description: "Please upload a DICOM (.dcm) file",
      });
      return;
    }

    setDicomFile(file);
    const imageId = `wadouri:${URL.createObjectURL(file)}`;
    setDicomImageId(imageId);

    // Clear previous analysis data when new file is loaded
    setAiResults(null);
    setHeatmapRegions([]);
    setAnnotations([]);
    setConsensusRegions([]);

    toast.success("DICOM file loaded", {
      description: file.name,
    });

    // Reset the input so the same file can be uploaded again if needed
    event.target.value = '';
  };

  const handleAnalyzeWithAI = async () => {
    if (!dicomFile) {
      toast.error("No image to analyze", {
        description: "Please load a DICOM image first",
      });
      return;
    }

    setIsAnalyzing(true);
    setAiResults(null);
    setHeatmapRegions([]); // Clear old heatmap regions
    setConsensusRegions([]); // Clear old consensus regions

    // Determine analysis mode and description
    const isAutoDetect = selectedModel === 'auto';

    // Show analyzing toast
    toast.info("Analyzing with AI models...", {
      description: isAutoDetect
        ? `Testing all models (${useParallel ? 'parallel - faster' : 'sequential - slower'})`
        : `Testing ${AVAILABLE_MODELS.find(m => m.key === selectedModel)?.label} - fast`,
      duration: 5000,
    });

    try {
      // Create FormData to send the DICOM file
      const formData = new FormData();
      formData.append('dicom', dicomFile);

      // Add model selection if specific model chosen
      if (!isAutoDetect) {
        const modelId = `mc_chestradiography_${selectedModel}:v1.20250828`;
        formData.append('model_id', modelId);
      } else if (useParallel) {
        // Use parallel execution for auto-detect
        formData.append('parallel', 'true');
      }

      // Call the API
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAiResults(data);

        // Generate heatmap regions with explanations based on AI results
        const regions = generateRegionsFromAIResponse(data);
        setHeatmapRegions(regions);

        const score = data.results.response.score;
        const modelId = data.model_id || data.results?.response?.model || "";
        const pathologyMatch = modelId.match(/chestradiography_([a-z_]+)/i);
        const pathologyName = pathologyMatch
          ? PATHOLOGY_INFO[pathologyMatch[1].toLowerCase()]?.fullName || "Finding"
          : "Finding";

        toast.success("AI Analysis Complete", {
          description: `${pathologyName} detected - Confidence: ${(score * 100).toFixed(1)}%`,
        });
      } else {
        toast.error("Analysis failed", {
          description: data.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Failed to analyze:", error);
      toast.error("Failed to connect to AI service", {
        description: "Please ensure the API server is running",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section id="demo" className="py-20 px-4 bg-gradient-subtle">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Interactive Demo</span>
          <h2 className="text-4xl font-bold text-foreground mt-2 mb-4">Try It Yourself</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Toggle between viewing modes and see how consensus highlighting works.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-elegant overflow-hidden animate-scale-in">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            {/* Demo Controls */}
            <div className="bg-muted px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Sample Study: DEMO-CT-001</Badge>
                <span className="text-sm text-muted-foreground">Chest CT • Axial view</span>
              </div>
              
              <TabsList>
                <TabsTrigger value="sideBySide">Side-by-Side</TabsTrigger>
                <TabsTrigger value="combined">Combined Overlay</TabsTrigger>
              </TabsList>
            </div>

            {/* Demo Viewer */}
            <div className="p-8">
              <TabsContent value="sideBySide" className="mt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Clinician View */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Your Annotations</h3>
                      <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Clinician</Badge>
                    </div>

{!dicomFile ? (
                      <div className="aspect-square bg-muted rounded-lg border-2 border-destructive/30 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
                        <div className="relative z-10 text-center space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-destructive" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">No image loaded</p>
                            <div className="flex gap-2 justify-center">
                              <Button onClick={handleLoadSample} variant="default" size="sm">
                                Load Sample
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('dicom-upload')?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload DICOM
                              </Button>
                            </div>
                            <input
                              id="dicom-upload"
                              type="file"
                              accept=".dcm"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-sm font-medium text-foreground">{dicomFile.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFile}
                            className="h-8"
                          >
                            Clear
                          </Button>
                        </div>
                        <AnnotatableDicomViewer
                          imageId={dicomImageId || undefined}
                          annotations={annotations}
                          onAnnotationsChange={setAnnotations}
                        />
                      </div>
                    )}

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-destructive mt-0.5" />
                        <span className="text-muted-foreground">
                          {annotations.length > 0
                            ? `${annotations.length} annotation${annotations.length !== 1 ? 's' : ''} added`
                            : "Ready for annotations"}
                        </span>
                      </li>
                      {dicomFile && (
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-destructive mt-0.5" />
                          <span className="text-muted-foreground">Image loaded: {dicomFile.name}</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* AI View */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">AI Findings</h3>
                      <Badge className="bg-accent/10 text-accent hover:bg-accent/20">HOPPR AI</Badge>
                    </div>

{!dicomFile ? (
                      <div className="aspect-square bg-muted rounded-lg border-2 border-accent/30 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
                        <div className="relative z-10 text-center space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded border-2 border-accent" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Load an image to analyze
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : !aiResults ? (
                      <div className="aspect-square bg-muted rounded-lg border-2 border-accent/30 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
                        <div className="relative z-10 text-center space-y-4 p-6">
                          <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded border-2 border-accent" />
                          </div>
                          <div className="space-y-4 max-w-xs mx-auto">
                            <p className="text-sm text-muted-foreground">Ready for AI analysis</p>

                            {/* Model Selection */}
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-foreground">Analysis Mode</label>
                              <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select pathology" />
                                </SelectTrigger>
                                <SelectContent>
                                  {AVAILABLE_MODELS.map((model) => (
                                    <SelectItem key={model.key} value={model.key}>
                                      <div className="flex flex-col items-start">
                                        <span className="font-medium">{model.label}</span>
                                        <span className="text-xs text-muted-foreground">{model.description}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Parallel Option - Only show for auto-detect */}
                            {selectedModel === 'auto' && (
                              <div className="flex items-center space-x-2 justify-center">
                                <Checkbox
                                  id="parallel"
                                  checked={useParallel}
                                  onCheckedChange={(checked) => setUseParallel(checked as boolean)}
                                />
                                <label
                                  htmlFor="parallel"
                                  className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  Use parallel execution (faster)
                                </label>
                              </div>
                            )}

                            <Button
                              onClick={handleAnalyzeWithAI}
                              variant="default"
                              size="sm"
                              disabled={isAnalyzing}
                              className="w-full"
                            >
                              {isAnalyzing ? "Analyzing..." : "Display AI Insights"}
                            </Button>

                            {/* Time estimate */}
                            <p className="text-xs text-muted-foreground">
                              {selectedModel === 'auto'
                                ? (useParallel ? 'Faster comprehensive analysis' : 'Thorough comprehensive analysis')
                                : 'Fast targeted analysis'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
                          <div className="flex items-center justify-between">
                            <div className="text-center flex-1">
                              <div className="text-2xl font-bold text-accent">
                                {(aiResults.results.response.score * 100).toFixed(1)}%
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  const modelId = aiResults.model_id || aiResults.results?.response?.model || "";
                                  const pathologyMatch = modelId.match(/chestradiography_([a-z_]+)/i);
                                  return pathologyMatch
                                    ? PATHOLOGY_INFO[pathologyMatch[1].toLowerCase()]?.fullName || "Finding"
                                    : "Finding";
                                })()}
                              </p>
                            </div>
                            <Button
                              onClick={() => setAiResults(null)}
                              variant="ghost"
                              size="sm"
                            >
                              New Analysis
                            </Button>
                          </div>
                        </div>
                        <div className="aspect-square border-2 border-accent/30 rounded-lg overflow-hidden">
                          <DicomViewerWithOverlay
                            imageId={dicomImageId || undefined}
                            className="w-full h-full"
                            showHeatmap={true}
                            heatmapIntensity={aiResults.results.response.score}
                            heatmapRegions={heatmapRegions}
                            onRegionHover={setHoveredRegion}
                          />
                        </div>
                      </div>
                    )}

                    {/* AI Findings List */}
                    {aiResults && heatmapRegions.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">AI Findings</h4>
                        <div className="space-y-2">
                          {heatmapRegions.map((region, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                hoveredRegion === region
                                  ? "bg-accent/20 border-accent shadow-md"
                                  : "bg-muted/50 border-border hover:border-accent/50"
                              }`}
                              onMouseEnter={() => setHoveredRegion(region)}
                              onMouseLeave={() => setHoveredRegion(null)}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">{region.label}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {(region.intensity * 100).toFixed(0)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {region.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Hover over findings to highlight on image</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent mt-0.5" />
                          <span className="text-muted-foreground">
                            {aiResults ? "Analysis complete" : "Awaiting analysis"}
                          </span>
                        </li>
                        {aiResults && (
                          <>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5" />
                              <span className="text-muted-foreground">
                                Model: {aiResults.results.response.model.split(':')[0]}
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-accent mt-0.5" />
                              <span className="text-muted-foreground">
                                Study ID: {aiResults.study_id.substring(0, 8)}...
                              </span>
                            </li>
                          </>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="combined" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Combined View</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleConsensus}
                      className={showConsensus ? "border-success text-success" : ""}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {showConsensus ? "Consensus Active" : "Show Consensus"}
                    </Button>
                  </div>

                  {dicomImageId ? (
                    <CombinedDicomViewer
                      imageId={dicomImageId}
                      clinicianAnnotations={annotations}
                      aiRegions={heatmapRegions}
                      showConsensus={showConsensus}
                      onConsensusDetected={setConsensusRegions}
                      className="aspect-video"
                    />
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg border-2 border-border flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                          <Layers className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Upload a DICOM file to see combined view
                        </p>
                      </div>
                    </div>
                  )}

                  {showConsensus && consensusRegions.length > 0 && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-sm text-foreground font-medium mb-2">Consensus Summary</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {consensusRegions.map((region, index) => (
                          <li key={index}>
                            • Agreement detected: {region.clinicianAnnotation.comment || "Clinician annotation"} matches {region.aiRegion.label || "AI finding"}
                          </li>
                        ))}
                        {heatmapRegions.length > consensusRegions.length && (
                          <li className="text-accent">
                            • AI detected {heatmapRegions.length - consensusRegions.length} additional finding(s) - review recommended
                          </li>
                        )}
                        {annotations.length > consensusRegions.length && (
                          <li className="text-destructive">
                            • {annotations.length - consensusRegions.length} clinician annotation(s) not matched by AI - review recommended
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {showConsensus && consensusRegions.length === 0 && annotations.length > 0 && heatmapRegions.length > 0 && (
                    <div className="p-4 rounded-lg bg-muted border border-border">
                      <p className="text-sm text-foreground font-medium mb-2">No Consensus Detected</p>
                      <p className="text-sm text-muted-foreground">
                        Clinician annotations and AI findings do not overlap. Consider reviewing both independently.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-destructive" />
            <span className="text-muted-foreground">Clinician Annotation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-accent" />
            <span className="text-muted-foreground">AI Finding</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success/30 border-2 border-success" />
            <span className="text-muted-foreground">Consensus Region</span>
          </div>
        </div>
      </div>
    </section>
  );
};
