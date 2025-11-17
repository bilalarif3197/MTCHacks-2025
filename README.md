# Synapse - AI-Assisted Radiology Workflow Assistant

An AI-assisted radiology platform that integrates HOPPR AI for medical imaging analysis, enabling radiologists to annotate DICOM images side-by-side with AI findings and visualize consensus regions.

## Project Overview

This project combines:
- **Frontend**: React + TypeScript + Vite web application for DICOM viewing and annotation
- **AI Backend**: Flask API server with HOPPR AI integration for chest radiography analysis
- **Features**: Side-by-side comparison, consensus highlighting, combined overlay, and multi-model AI analysis

### Demo Mode

The application includes an optional **demo mode** toggle that displays representative AI data without requiring backend API infrastructure. When enabled, demo mode allows you to:
- Explore the UI/UX design and interactive features
- See how the annotation tools work
- Experience the side-by-side and combined overlay views
- Understand the consensus highlighting concept

**How to use:**
1. Click "Enable Demo Mode" button at the top of the demo section
2. Load a DICOM image (or use the sample)
3. Click "Display AI Insights" to see mock AI analysis with realistic confidence scores

When demo mode is disabled, the app attempts to connect to the real HOPPR AI backend. For full AI integration, follow the installation steps below.

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- shadcn-ui components
- Tailwind CSS
- React Router
- TanStack Query

### Backend/AI
- Python 3
- Flask (REST API server)
- Flask-CORS
- HOPPR AI SDK (`hopprai`)
- DICOM image processing
- Cornerstone.js (DICOM rendering)

## Getting Started

### Prerequisites
- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Python 3.x
- HOPPR AI API key ([get one from HOPPR](https://hoppr.ai))

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd MTCHacks-2025
   ```

2. **Set up the frontend**
   ```bash
   # Install Node dependencies
   npm install
   ```

3. **Set up the Python backend**
   ```bash
   # Create and activate virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On macOS/Linux
   # or: venv\Scripts\activate  # On Windows

   # Install Python dependencies
   pip install hopprai python-dotenv flask flask-cors
   ```

4. **Configure environment variables**

   Create a `.env` file in the project root:
   ```env
   HOPPR_API_KEY=your_api_key_here
   ```

### Running the Application

**Start the backend API server (in one terminal):**
```bash
source venv/bin/activate
python api_server.py
```

**Start the frontend development server (in another terminal):**
```bash
npm run dev
```

**Test the HOPPR AI integration:**
```bash
source venv/bin/activate
python test_hoppr.py
```

## Project Structure

```
MTCHacks-2025/
├── src/                        # React frontend source
│   ├── components/             # UI components
│   │   ├── Demo.tsx           # Main interactive demo
│   │   ├── AnnotatableDicomViewer.tsx  # Annotation interface
│   │   ├── CombinedDicomViewer.tsx     # Combined overlay view
│   │   └── DicomViewerWithOverlay.tsx  # AI findings overlay
│   ├── pages/                  # Page components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utility functions
├── public/                     # Static assets
├── api_server.py              # Flask REST API server
├── hoppr_model.py             # HOPPR AI integration module
├── pathology_utils.py         # Pathology region mapping
├── test_hoppr.py              # AI model test script
├── main.py                    # Example HOPPR usage
├── dicom_images/              # Sample DICOM files
├── venv/                      # Python virtual environment
└── .env                       # Environment variables (not in git)
```

## Key Features

- **Side-by-Side Comparison**: View clinician annotations next to AI findings simultaneously
- **Interactive Annotations**: Click to add annotations with custom comments on DICOM images
- **Combined Overlay**: Merge both clinician and AI views with visual consensus highlighting
- **Consensus Detection**: Automatically detect and highlight regions where AI and clinician agree (green glow)
- **Multi-Model AI Analysis**: Analyze images across 13+ chest pathology models via HOPPR AI
- **Anatomically Accurate Regions**: AI findings mapped to medically appropriate locations on X-rays
- **Real-time Analysis**: Instant AI inference with visual feedback

## HOPPR AI Integration

The `hoppr_model.py` module provides a simple interface:

```python
from hoppr_model import HopprModelInterface

# Initialize the model
model = HopprModelInterface()

# Analyze a DICOM image
results = model.analyze_dicom_image("path/to/scan.dcm")

# Access AI insights
if results["success"]:
    insights = results["results"]
    print(insights)
```

### Supported Pathologies
Atelectasis, Cardiomegaly, Pneumothorax, Lung Opacity, Pleural Effusion, Consolidation, Infiltration, Pleural Thickening, Aortic Enlargement, Calcification, Pulmonary Fibrosis, ILD, and Normal

## Development

**Frontend:**
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
```

**Python/AI:**
```bash
# Always activate venv first
source venv/bin/activate

# Test AI integration
python test_hoppr.py

# Run example
python main.py
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HOPPR_API_KEY` | Your HOPPR AI API key | Yes |

## Deployment

For detailed deployment instructions, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

**Quick Summary**:
- **Frontend**: Deploy to Vercel (free, instant)
- **Backend**: Deploy to Render.com (free with cold starts)
- **Demo Mode**: Enable by default for instant demos without backend

Both platforms offer generous free tiers perfect for portfolio/resume projects.

## Important Disclaimer

**Synapse is a hackathon prototype** intended for research and educational purposes only. This is **not a medical device** and is **not approved for primary diagnostic use**. All images shown are de-identified. Clinical decisions must be made by licensed healthcare professionals. The developers assume no liability for clinical outcomes.

## Contributing

This project was built for MTCHacks 2025.

## License

MIT License - See LICENSE file for details.
