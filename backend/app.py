"""
KisaanMitra - Main Flask Application
Voice-first multilingual agricultural intelligence platform.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from routes.crop_advisory import crop_bp
from routes.market_prices import prices_bp
from routes.weather import weather_bp


def create_app():
    """Factory function to create and configure the Flask app."""
    app = Flask(__name__)
    CORS(app, origins=Config.CORS_ORIGINS)

    # Register route blueprints
    app.register_blueprint(crop_bp, url_prefix='/api')
    app.register_blueprint(prices_bp, url_prefix='/api')
    app.register_blueprint(weather_bp, url_prefix='/api')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'KisaanMitra',
            'version': '1.0.0'
        })

    @app.route('/api/languages', methods=['GET'])
    def get_languages():
        languages = []
        for code, info in Config.LANGUAGES.items():
            languages.append({
                'code': code,
                'name': info['name'],
                'native_name': info['native_name'],
                'speech_code': info['code']
            })
        return jsonify({'languages': languages})

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error. Please try again.'}), 500

    return app


if __name__ == '__main__':
    app = create_app()
    print("🌾 KisaanMitra Backend Starting...")
    print(f"🚀 Running on http://localhost:{Config.PORT}")
    print("📡 Ready to help farmers!")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
