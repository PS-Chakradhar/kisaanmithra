"""
KisaanMitra - Crop Advisory Routes
"""

from flask import Blueprint, request, jsonify
from services.gemini_service import get_agricultural_advice, get_crop_disease_info

crop_bp = Blueprint('crop', __name__)


@crop_bp.route('/query', methods=['POST'])
def handle_query():
    """Main query endpoint. Receives farmer's voice-transcribed text."""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'success': False, 'error': 'No query provided'}), 400

        query = data['query'].strip()
        language = data.get('language', 'hi')
        if not query:
            return jsonify({'success': False, 'error': 'Empty query'}), 400

        result = get_agricultural_advice(query, language)
        return jsonify(result)

    except Exception as e:
        print(f"Query Error: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to process query'}), 500


@crop_bp.route('/diagnose', methods=['POST'])
def diagnose_disease():
    """Specialized disease diagnosis endpoint."""
    try:
        data = request.get_json()
        if not data or 'symptoms' not in data:
            return jsonify({'success': False, 'error': 'No symptoms provided'}), 400

        symptoms = data['symptoms']
        crop = data.get('crop', 'unknown crop')
        language = data.get('language', 'hi')

        result = get_crop_disease_info(symptoms, crop, language)
        return jsonify(result)

    except Exception as e:
        print(f"Diagnosis Error: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to diagnose'}), 500
