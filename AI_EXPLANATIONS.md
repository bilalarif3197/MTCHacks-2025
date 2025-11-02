# AI Explanations Feature

## Overview

The Co-Read Assist platform now includes **intelligent AI explanations** that dynamically generate detailed clinical descriptions for any detected pathology. The system automatically adapts to different chest radiography findings and provides radiologists with context-rich annotations.

## Supported Pathologies

The system supports the following chest radiography findings with specialized explanations:

1. **Atelectasis** - Lung collapse or closure
2. **Pneumothorax** - Air in pleural space
3. **Cardiomegaly** - Enlarged heart
4. **Lung Opacity** - General lung opacity findings
5. **Pleural Effusion** - Fluid in pleural space
6. **Consolidation** - Dense airspace opacity
7. **Infiltration** - Pulmonary infiltrates
8. **Pleural Thickening** - Chronic pleural changes
9. **Aortic Enlargement** - Widened aortic contour
10. **Calcification** - Calcified densities
11. **Pulmonary Fibrosis** - Lung scarring/fibrosis
12. **ILD** - Interstitial lung disease
13. **Normal** - No abnormalities detected

## How It Works

### 1. Automatic Pathology Detection

When you upload a DICOM image, the system:
- Analyzes the filename to detect the pathology type
- Automatically selects the appropriate Hoppr AI model
- Example: `"Atelectasis/train/sample.dcm"` → Uses atelectasis model

### 2. AI Analysis with Explanations

The AI generates:
- **Primary Finding**: Main pathology with detailed clinical description
- **Secondary Findings**: Additional observations (for high confidence detections >70%)
- **Confidence Scores**: Percentage confidence for each finding

### 3. Interactive Visualization

Users can interact with findings in multiple ways:

#### On the DICOM Image:
- **Hover over highlighted regions** → Tooltip appears with:
  - Finding name
  - Detailed explanation
  - Confidence percentage
- Hovered regions become brighter for emphasis
- Labels are drawn directly on the image

#### In the Findings Panel:
- **Hover over finding cards** → Corresponding region highlights on image
- Each card shows:
  - Finding label
  - Confidence badge
  - Full clinical explanation
- Bi-directional interaction (hover on image OR card)

## Example Explanations

### Atelectasis (Primary Finding)
**Label**: Atelectasis
**Explanation**: "Collapse or closure of lung tissue detected. This finding shows characteristic opacity consistent with atelectasis, often caused by airway obstruction, compression, or post-surgical changes."
**Confidence**: 87.3%

### Atelectasis (Secondary Finding)
**Label**: Secondary Finding
**Explanation**: "Adjacent tissue changes observed. May indicate volume loss or compensatory hyperinflation in neighboring lung segments."
**Confidence**: 69.8%

### Pneumothorax (Primary Finding)
**Label**: Pneumothorax
**Explanation**: "Air accumulation detected in pleural space. Visible absence of lung markings with potential visceral pleural line, indicating separation of lung from chest wall."
**Confidence**: 92.1%

## Technical Implementation

### Frontend Components

**DicomViewerWithOverlay.tsx**
- Exports `HeatmapRegion` interface with label and explanation fields
- Handles mouse hover detection on canvas overlay
- Renders interactive tooltips with finding details
- Supports custom region data from AI response

**Demo.tsx**
- `PATHOLOGY_INFO`: Comprehensive database of pathology descriptions
- `generateRegionsFromAIResponse()`: Extracts pathology from model ID and generates regions
- Dynamic pathology name display in UI
- Interactive findings panel with hover states

### Backend Components

**pathology_utils.py**
- `detect_pathology_from_filename()`: Auto-detects pathology from file path
- `get_model_for_pathology()`: Maps pathology to Hoppr model ID
- `PATHOLOGY_TO_MODEL`: Dictionary of all supported models
- Handles variant naming (underscores, spaces, camelCase)

**api_server.py**
- Auto-detection: Analyzes filename if no model specified
- Model selection: Routes to appropriate Hoppr AI model
- Logging: Prints detected pathology for debugging

## Usage

### Basic Workflow

1. **Load DICOM Image**
   ```
   - Click "Load Sample Image" or upload your own
   - System auto-detects pathology type from filename
   ```

2. **Run AI Analysis**
   ```
   - Click "Display AI Insights"
   - Backend selects appropriate model automatically
   - AI generates findings with explanations
   ```

3. **Explore Findings**
   ```
   - Hover over highlighted regions on image
   - Review findings panel below the viewer
   - Hover over finding cards to highlight regions
   ```

### Advanced: Manual Model Selection

You can also specify a model manually via the API:

```python
# Python API call
response = requests.post('http://localhost:5001/api/analyze',
    files={'dicom': dicom_file},
    data={'model_id': 'mc_chestradiography_pneumothorax:v1.20250828'}
)
```

## Adding New Pathologies

To add support for a new pathology:

### 1. Update Frontend (`src/components/Demo.tsx`)

Add to `PATHOLOGY_INFO` object:

```typescript
new_pathology: {
  fullName: "Display Name",
  description: "Primary finding description for radiologists...",
  secondaryFindings: [
    "Secondary observation 1...",
    "Secondary observation 2..."
  ]
}
```

### 2. Update Backend (`pathology_utils.py`)

Add to `PATHOLOGY_TO_MODEL` dictionary:

```python
"new_pathology": "mc_chestradiography_new_pathology:v1.20250828",
```

### 3. Test

Upload a DICOM file with the pathology name in the path:
```
dicom_images/New_Pathology/train/sample.dcm
```

The system will automatically detect and use the correct model.

## Clinical Accuracy Note

⚠️ **Important**: The explanations are educational templates designed for prototyping. For production use:
- Explanations should be reviewed by board-certified radiologists
- Consider integration with radiology lexicons (RadLex, LOINC)
- Add relevant ICD-10/SNOMED codes
- Include confidence thresholds and uncertainty indicators
- Comply with FDA guidelines for AI/ML medical devices

## Future Enhancements

Potential improvements for production:
1. **Multi-language support** for international deployment
2. **Customizable templates** per institution preferences
3. **Integration with ACR appropriateness criteria**
4. **Differential diagnosis suggestions** for ambiguous findings
5. **Teaching file integration** with reference images
6. **Evidence-based citations** linking to medical literature
7. **Severity grading** (mild/moderate/severe classifications)
8. **Measurement extraction** from AI bounding boxes

## API Reference

### POST /api/analyze

**Request:**
```
Content-Type: multipart/form-data

dicom: <file>
model_id: <optional-string>
```

**Response:**
```json
{
  "success": true,
  "study_id": "uuid-string",
  "image_id": "uuid-string",
  "model_id": "mc_chestradiography_atelectasis:v1.20250828",
  "filename": "sample.dcm",
  "results": {
    "response": {
      "score": 0.873,
      "model": "mc_chestradiography_atelectasis:v1.20250828"
    }
  }
}
```

The frontend automatically parses this response and generates appropriate regions with explanations.

---

**Last Updated**: November 2, 2025
**Version**: 2.0 (Generalized AI Explanations)
