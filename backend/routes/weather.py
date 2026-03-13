"""
KisaanMitra - Weather Routes
"""

from flask import Blueprint, request, jsonify
from services.weather_service import get_weather

weather_bp = Blueprint('weather', __name__)


@weather_bp.route('/weather', methods=['GET'])
def weather():
    """Get weather data with farming advice."""
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    language = request.args.get('language', 'hi')

    if not lat or not lon:
        return jsonify({'success': False, 'error': 'Latitude and longitude are required'}), 400

    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid latitude or longitude'}), 400

    result = get_weather(lat, lon, language)
    return jsonify(result)
