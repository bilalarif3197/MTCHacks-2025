# Multi-Model Analysis Feature

## Overview

The Co-Read Assist platform now includes **automatic multi-model analysis** that tests your uploaded DICOM images against ALL available pathology models and automatically selects the best match.

## Problem Solved

**Before:** When you uploaded a custom DICOM file, the system would try to detect the pathology from the filename. If your file was named something generic like `image.dcm` or `scan123.dcm`, it would default to only checking for Atelectasis.

**Now:** The system automatically tests your image against ALL 13 pathology models and returns the diagnosis with the highest confidence score.

## How It Works

### Backend Processing

When you upload a DICOM image and click "Display AI Insights":

1. **File Upload**: Image is sent to the API server
2. **Multi-Model Analysis**: Server runs inference with ALL available models:
   - Atelectasis
   - Pneumothorax
   - Cardiomegaly
   - Lung Opacity
   - Pleural Effusion
   - Consolidation
   - Infiltration
   - Pleural Thickening
   - Aortic Enlargement
   - Calcification
   - Pulmonary Fibrosis
   - ILD
   - Normal

3. **Score Comparison**: Each model returns a confidence score (0-1)
4. **Best Match Selection**: System selects the pathology with highest score
5. **Results Return**: Frontend receives the best match with appropriate explanations

### Example Console Output

```
Analyzing DICOM file with all models: my_chest_xray.dcm
==================================================
Testing atelectasis...
  → atelectasis: 0.234
Testing pneumothorax...
  → pneumothorax: 0.891
Testing cardiomegaly...
  → cardiomegaly: 0.156
...
==================================================
Best match: pneumothorax (0.891)
==================================================
```

### API Response Structure

The API now returns additional metadata:

```json
{
  "success": true,
  "study_id": "uuid-...",
  "image_id": "uuid-...",
  "model_id": "mc_chestradiography_pneumothorax:v1.20250828",
  "filename": "my_chest_xray.dcm",
  "results": {
    "response": {
      "score": 0.891,
      "model": "mc_chestradiography_pneumothorax:v1.20250828"
    }
  },
  "all_scores": {
    "pneumothorax": 0.891,
    "atelectasis": 0.234,
    "cardiomegaly": 0.156,
    "lung_opacity": 0.112,
    "normal": 0.089
  }
}
```

The `all_scores` field contains the top 5 pathologies ranked by confidence.

## Performance Considerations

### Analysis Time

- **Single model**: ~2-3 seconds
- **All models (13)**: ~30-45 seconds

The system tests all models sequentially, so expect longer analysis times. Future optimizations could include:
- Parallel model execution
- Early stopping if confidence > 0.95
- Caching results for identical images

### Resource Usage

- Each model inference requires API calls to Hoppr
- Memory usage increases temporarily during multi-model analysis
- API rate limits may apply depending on your Hoppr subscription

## Manual Model Selection (Advanced)

If you want to skip multi-model analysis and test a specific pathology, you can specify the model in the API call:

```javascript
const formData = new FormData();
formData.append('dicom', dicomFile);
formData.append('model_id', 'mc_chestradiography_pneumothorax:v1.20250828');

fetch('http://localhost:5001/api/analyze', {
  method: 'POST',
  body: formData,
});
```

## User Experience

### Frontend Updates

1. **Loading Indicator**: "Analyzing with AI models..." toast notification
2. **Progress Description**: "Testing all pathology models to find best match"
3. **Results Display**: Automatically shows the best match with:
   - Pathology name
   - Confidence score
   - Clinical explanation
   - Interactive heatmap regions

### Example Workflow

1. **Upload** any DICOM file (filename doesn't matter)
2. **Click** "Display AI Insights"
3. **Wait** ~30-45 seconds while all models analyze
4. **View** automatic detection results with explanations

## Edge Cases Handled

### All Models Fail
If all 13 models fail to analyze the image:
```json
{
  "success": false,
  "error": "All models failed to analyze the image"
}
```

### Low Confidence Across All Models
If the highest score is below 0.3 (30%), the system still returns results but won't generate heatmap regions (as per existing threshold logic).

### Tie Scores
If multiple pathologies have the same score, the first one encountered (based on dictionary order) is selected.

## Configuration

### Pathology Model Mapping

All pathology-to-model mappings are defined in [pathology_utils.py:7-20](pathology_utils.py#L7-L20):

```python
PATHOLOGY_TO_MODEL = {
    "atelectasis": "mc_chestradiography_atelectasis:v1.20250828",
    "pneumothorax": "mc_chestradiography_pneumothorax:v1.20250828",
    ...
}
```

### Adding New Models

To add a new pathology model:

1. Update `PATHOLOGY_TO_MODEL` in `pathology_utils.py`
2. Add pathology info to `PATHOLOGY_INFO` in `src/components/Demo.tsx`
3. Restart API server
4. New model will automatically be included in multi-model analysis

## Optimization Ideas

Future improvements for faster analysis:

### 1. Parallel Execution
Run multiple models simultaneously using threading:
```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(analyze_model, path, model)
               for model in models]
    results = [f.result() for f in futures]
```

### 2. Smart Early Stopping
Stop testing if confidence exceeds threshold:
```python
if score > 0.95:
    print("High confidence match found, skipping remaining models")
    break
```

### 3. Two-Phase Analysis
- Phase 1: Quick screening with subset of common pathologies
- Phase 2: Full analysis only if Phase 1 is inconclusive

### 4. Caching
Cache results based on image hash to avoid re-analysis:
```python
import hashlib
image_hash = hashlib.sha256(image_data).hexdigest()
if image_hash in cache:
    return cache[image_hash]
```

## Testing

To test the multi-model feature:

1. **Upload** a DICOM file with a known pathology
2. **Watch** the server console for model scores
3. **Verify** the correct pathology is selected
4. **Check** that explanations match the detected pathology

Example test files from your dataset:
- `dicom_images/.../Pneumothorax/train/*.dcm` should detect pneumothorax
- `dicom_images/.../Cardiomegaly/train/*.dcm` should detect cardiomegaly
- `dicom_images/.../Normal/train/*.dcm` should detect normal

## API Endpoints

### POST /api/analyze

**Auto-detect mode (tests all models):**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -F "dicom=@my_image.dcm"
```

**Manual model selection:**
```bash
curl -X POST http://localhost:5001/api/analyze \
  -F "dicom=@my_image.dcm" \
  -F "model_id=mc_chestradiography_pneumothorax:v1.20250828"
```

## Limitations

1. **Sequential Processing**: Models run one at a time (not parallelized)
2. **Time-Intensive**: Full analysis takes 30-45 seconds
3. **No Ensemble**: System picks single best match (doesn't combine scores)
4. **Binary Classification**: Each model gives yes/no score for its pathology
5. **No Multi-Label**: Can't detect multiple pathologies simultaneously

## Future Enhancements

1. **Parallel Processing** for faster analysis
2. **Ensemble Scoring** combining multiple model outputs
3. **Multi-Label Detection** for co-occurring pathologies
4. **Confidence Visualization** showing all scores to user
5. **Model Pruning** excluding unlikely models based on image metadata
6. **Progressive Results** streaming partial results as models complete

---

**Last Updated**: November 2, 2025
**Version**: 2.1 (Multi-Model Auto-Detection)
