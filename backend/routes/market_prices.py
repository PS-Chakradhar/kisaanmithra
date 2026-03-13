"""
KisaanMitra - Market Price Routes
"""

from flask import Blueprint, request, jsonify
from services.price_service import get_price, get_all_prices

prices_bp = Blueprint('prices', __name__)


@prices_bp.route('/prices', methods=['GET'])
def all_prices():
    """Get prices for all available commodities."""
    language = request.args.get('language', 'hi')
    result = get_all_prices(language)
    return jsonify(result)


@prices_bp.route('/prices/<crop_name>', methods=['GET'])
def crop_price(crop_name):
    """Get price for a specific crop."""
    language = request.args.get('language', 'hi')
    result = get_price(crop_name, language)
    return jsonify(result)
