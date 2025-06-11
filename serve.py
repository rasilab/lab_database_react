#!/usr/bin/env python3
"""
Simple development server for React app
"""
import http.server
import socketserver
import os
import subprocess
import sys
import webbrowser
from pathlib import Path

PORT = 3001

def build_app():
    """Build the React app"""
    print("Building React app...")
    result = subprocess.run(['npm', 'run', 'build'], 
                          capture_output=True, text=True)
    if result.returncode != 0:
        print("Build failed:")
        print(result.stderr)
        sys.exit(1)
    print("Build completed successfully!")

def serve_app():
    """Serve the built app"""
    build_dir = Path('build')
    if not build_dir.exists():
        print("Build directory not found. Building app first...")
        build_app()
    
    os.chdir('build')
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    class CustomHandler(Handler):
        def end_headers(self):
            # Add CORS headers for development
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
    
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        
        # Open browser
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    serve_app()