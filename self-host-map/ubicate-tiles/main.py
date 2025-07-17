from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
import mimetypes

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        # Si la petición es para un .pbf, ajustamos el content-type
        if self.path.endswith('.pbf'):
            self.send_header('Content-Type', 'application/x-protobuf')
            # Si quieres gzip, aquí agregarías:
            self.send_header('Content-Encoding', 'gzip')
        super().end_headers()

    # Opcional: para que mime types reconozca .pbf
    def guess_type(self, path):
        if path.endswith('.pbf'):
            return 'application/x-protobuf'
        return super().guess_type(path)

if __name__ == "__main__":
    port = 2020
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print(f"Serving HTTP with CORS enabled on port {port}")
    httpd.serve_forever()
