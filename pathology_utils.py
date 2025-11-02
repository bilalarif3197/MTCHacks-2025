"""
Utility functions for pathology detection and model selection.
Maps pathology types to Hoppr AI models.
"""

# Map pathology names to Hoppr model IDs
PATHOLOGY_TO_MODEL = {
    "atelectasis": "mc_chestradiography_atelectasis:v1.20250828",
    "pneumothorax": "mc_chestradiography_pneumothorax:v1.20250828",
    "cardiomegaly": "mc_chestradiography_cardiomegaly:v1.20250828",
    "lung_opacity": "mc_chestradiography_lung_opacity:v1.20250828",
    "pleural_effusion": "mc_chestradiography_pleural_effusion:v1.20250828",
    "consolidation": "mc_chestradiography_consolidation:v1.20250828",
    "infiltration": "mc_chestradiography_infiltration:v1.20250828",
    "pleural_thickening": "mc_chestradiography_pleural_thickening:v1.20250828",
    "aortic_enlargement": "mc_chestradiography_aortic_enlargement:v1.20250828",
    "calcification": "mc_chestradiography_calcification:v1.20250828",
    "pulmonary_fibrosis": "mc_chestradiography_pulmonary_fibrosis:v1.20250828",
    "ild": "mc_chestradiography_ild:v1.20250828",
    "normal": "mc_chestradiography_normal:v1.20250828",
}


def detect_pathology_from_filename(filename: str) -> str:
    """
    Detect pathology type from DICOM filename or path.

    Args:
        filename: DICOM filename or path

    Returns:
        Detected pathology key (lowercase with underscores)
    """
    filename_lower = filename.lower()

    # Check each pathology type
    for pathology_key in PATHOLOGY_TO_MODEL.keys():
        # Convert underscores to spaces for matching
        pathology_variants = [
            pathology_key,
            pathology_key.replace("_", " "),
            pathology_key.replace("_", ""),
        ]

        for variant in pathology_variants:
            if variant in filename_lower:
                return pathology_key

    # Default to atelectasis if not detected
    return "atelectasis"


def get_model_for_pathology(pathology: str) -> str:
    """
    Get the Hoppr model ID for a given pathology type.

    Args:
        pathology: Pathology type (e.g., "atelectasis", "pneumothorax")

    Returns:
        Hoppr model ID string
    """
    pathology_lower = pathology.lower().replace(" ", "_")
    return PATHOLOGY_TO_MODEL.get(pathology_lower, PATHOLOGY_TO_MODEL["atelectasis"])


def get_all_models() -> list:
    """
    Get list of all available Hoppr models.

    Returns:
        List of model ID strings
    """
    return list(PATHOLOGY_TO_MODEL.values())


def get_all_pathologies() -> list:
    """
    Get list of all available pathology keys.

    Returns:
        List of pathology key strings
    """
    return list(PATHOLOGY_TO_MODEL.keys())


def get_pathology_display_name(pathology_key: str) -> str:
    """
    Convert pathology key to display name.

    Args:
        pathology_key: Pathology key (e.g., "lung_opacity")

    Returns:
        Display name (e.g., "Lung Opacity")
    """
    return pathology_key.replace("_", " ").title()
