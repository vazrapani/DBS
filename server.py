from http.server import HTTPServer, SimpleHTTPRequestHandler
import requests

class ProxyRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            try:
                print(f'Proxying GET request to: http://localhost:5000{self.path}')
                headers = {key: value for key, value in self.headers.items()}
                if 'Host' in headers:
                    del headers['Host']
                response = requests.get(
                    f'http://localhost:5000{self.path}',
                    headers=headers,
                    cookies=self.parse_cookies()
                )
                self.send_response(response.status_code)
                for key, value in response.headers.items():
                    if key.lower() not in ['server', 'date', 'transfer-encoding']:
                        self.send_header(key, value)
                origin = self.headers.get('Origin')
                if origin:
                    self.send_header('Access-Control-Allow-Origin', origin)
                else:
                    self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Vary', 'Origin')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Cookie')
                self.send_header('Access-Control-Allow-Credentials', 'true')
                self.end_headers()
                self.wfile.write(response.content)
            except Exception as e:
                print(f'Error proxying GET request: {str(e)}')
                self.send_error(500, f"Error: {str(e)}")
        else:
            # 정적 파일은 SimpleHTTPRequestHandler의 기본 동작 사용 (빠르고 안정적)
            return SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path.startswith('/api/'):
            try:
                print(f'Proxying POST request to: http://localhost:5000{self.path}')
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else None
                headers = {key: value for key, value in self.headers.items()}
                if 'Host' in headers:
                    del headers['Host']
                response = requests.post(
                    f'http://localhost:5000{self.path}',
                    data=body,
                    headers=headers,
                    cookies=self.parse_cookies()
                )
                self.send_response(response.status_code)
                for key, value in response.headers.items():
                    if key.lower() not in ['server', 'date', 'transfer-encoding']:
                        self.send_header(key, value)
                origin = self.headers.get('Origin')
                if origin:
                    self.send_header('Access-Control-Allow-Origin', origin)
                else:
                    self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Vary', 'Origin')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Cookie')
                self.send_header('Access-Control-Allow-Credentials', 'true')
                self.end_headers()
                self.wfile.write(response.content)
            except Exception as e:
                print(f'Error proxying POST request: {str(e)}')
                self.send_error(500, f"Error: {str(e)}")
        else:
            self.send_error(404, "File not found")

    def do_DELETE(self):
        if self.path.startswith('/api/'):
            try:
                print(f'Proxying DELETE request to: http://localhost:5000{self.path}')
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else None
                headers = {key: value for key, value in self.headers.items()}
                if 'Host' in headers:
                    del headers['Host']
                response = requests.delete(
                    f'http://localhost:5000{self.path}',
                    data=body,
                    headers=headers,
                    cookies=self.parse_cookies()
                )
                self.send_response(response.status_code)
                for key, value in response.headers.items():
                    if key.lower() not in ['server', 'date', 'transfer-encoding']:
                        self.send_header(key, value)
                origin = self.headers.get('Origin')
                if origin:
                    self.send_header('Access-Control-Allow-Origin', origin)
                else:
                    self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Vary', 'Origin')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Cookie')
                self.send_header('Access-Control-Allow-Credentials', 'true')
                self.end_headers()
                self.wfile.write(response.content)
            except Exception as e:
                print(f'Error proxying DELETE request: {str(e)}')
                self.send_error(500, f"Error: {str(e)}")
        else:
            self.send_error(404, "File not found")

    def do_OPTIONS(self):
        self.send_response(200)
        origin = self.headers.get('Origin')
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Cookie')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.end_headers()

    def parse_cookies(self):
        cookies = {}
        cookie_header = self.headers.get('Cookie')
        if cookie_header:
            for cookie in cookie_header.split(';'):
                if '=' in cookie:
                    name, value = cookie.strip().split('=', 1)
                    cookies[name] = value
        return cookies

def run(server_class=HTTPServer, handler_class=ProxyRequestHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting proxy server on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run() 