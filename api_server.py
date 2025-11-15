"""
Flask API Server for Hoppr AI Integration
Provides REST endpoints for DICOM analysis using Hoppr AI
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from hoppr_model import HopprModelInterface
from pathology_utils import (
    detect_pathology_from_filename,
    get_model_for_pathology,
    get_all_pathologies,
    PATHOLOGY_TO_MODEL,
    get_pathology_display_name
)
import os
import tempfile
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Initialize Hoppr model
hoppr_model = HopprModelInterface()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Hoppr AI API',
        'version': '1.0.0'
    })


def analyze_single_pathology(temp_path, pathology, model_id):
    """Helper function to analyze a single pathology model"""
    try:
        result = hoppr_model.analyze_dicom_image(
            dicom_file_path=temp_path,
            model_id=model_id
        )

        if result.get('success'):
            score = result.get('results', {}).get('response', {}).get('score', 0)
            print(f"  → {pathology}: {score:.3f}")
            return {
                'pathology': pathology,
                'score': score,
                'result': result
            }
        else:
            print(f"  → {pathology}: FAILED")
            return None
    except Exception as e:
        print(f"  → {pathology}: ERROR - {e}")
        return None


@app.route('/api/analyze', methods=['POST'])
def analyze_dicom():
    """
    Analyze a DICOM image using Hoppr AI

    Supports three modes:
    1. Specific model: Pass model_id for fast targeted analysis (2-3 seconds)
    2. Parallel analysis: Pass parallel=true to test all models simultaneously (10-15 seconds)
    3. Sequential analysis: Default behavior, tests all models one by one (30-45 seconds)

    Expects:
        - DICOM file in request.files['dicom']
        - Optional model_id in request.form (for specific model)
        - Optional parallel in request.form ('true' for parallel execution)

    Returns:
        JSON with analysis results from the best-matching model
    """
    try:
        # Check if file is present
        if 'dicom' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No DICOM file provided'
            }), 400

        dicom_file = request.files['dicom']

        if dicom_file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Empty filename'
            }), 400

        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.dcm') as temp_file:
            dicom_file.save(temp_file.name)
            temp_path = temp_file.name

        try:
            # Check if specific model was requested
            model_id = request.form.get('model_id')

            if model_id:
                # Use specific model
                print(f"Analyzing with specified model: {model_id}")
                results = hoppr_model.analyze_dicom_image(
                    dicom_file_path=temp_path,
                    model_id=model_id
                )
                results['filename'] = dicom_file.filename
                return jsonify(results)

            # Check if parallel execution was requested
            use_parallel = request.form.get('parallel', '').lower() == 'true'

            print(f"Analyzing DICOM file with all models: {dicom_file.filename}")
            print(f"Mode: {'PARALLEL' if use_parallel else 'SEQUENTIAL'}")
            print("=" * 50)

            all_results = []
            pathologies = get_all_pathologies()

            if use_parallel:
                # Parallel execution with ThreadPoolExecutor
                print(f"Running parallel analysis with {min(4, len(pathologies))} workers...")

                with ThreadPoolExecutor(max_workers=4) as executor:
                    # Submit all tasks
                    future_to_pathology = {
                        executor.submit(
                            analyze_single_pathology,
                            temp_path,
                            pathology,
                            PATHOLOGY_TO_MODEL[pathology]
                        ): pathology
                        for pathology in pathologies
                    }

                    # Collect results as they complete
                    for future in as_completed(future_to_pathology):
                        result = future.result()
                        if result is not None:
                            all_results.append(result)
            else:
                # Sequential execution (original behavior)
                for pathology in pathologies:
                    model_id = PATHOLOGY_TO_MODEL[pathology]
                    print(f"Testing {pathology}...")

                    result = analyze_single_pathology(temp_path, pathology, model_id)
                    if result is not None:
                        all_results.append(result)

            if not all_results:
                return jsonify({
                    'success': False,
                    'error': 'All models failed to analyze the image'
                }), 500

            # Sort by score and get the best match
            all_results.sort(key=lambda x: x['score'], reverse=True)
            best_match = all_results[0]

            print("=" * 50)
            print(f"Best match: {best_match['pathology']} ({best_match['score']:.3f})")
            print("=" * 50)

            # Add metadata about other findings
            best_result = best_match['result']
            best_result['filename'] = dicom_file.filename
            best_result['all_scores'] = {
                r['pathology']: r['score']
                for r in all_results[:5]  # Top 5 matches
            }

            return jsonify(best_result)

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        print(f"Error analyzing DICOM: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/models', methods=['GET'])
def get_models():
    """Get list of available Hoppr AI models"""
    try:
        models = hoppr_model.get_available_models()
        return jsonify({
            'success': True,
            'models': models
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))

    print("=" * 50)
    print("Starting HOPPR AI API Server")
    print("=" * 50)
    print(f"API URL: http://localhost:{port}")
    print(f"Health Check: http://localhost:{port}/api/health")
    print(f"Analyze Endpoint: POST http://localhost:{port}/api/analyze")
    print("=" * 50)

    app.run(debug=False, port=port, host='0.0.0.0')
