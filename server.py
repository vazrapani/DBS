from http.server import HTTPServer, SimpleHTTPRequestHandler
import requests

class ProxyRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            try:
                print(f'Proxying GET request to: http://localhost:5000{self.path}')  # 디버깅용 로그
                
                # 원본 요청의 헤더를 복사
                headers = {key: value for key, value in self.headers.items()}
                if 'Host' in headers:
                    del headers['Host']  # Host 헤더 제거
                
                # API 서버로 요청 전달
                response = requests.get(
                    f'http://localhost:5000{self.path}',
                    headers=headers,
                    cookies=self.parse_cookies()
                )
                
                # 응답 헤더 설정
                self.send_response(response.status_code)
                for key, value in response.headers.items():
                    if key.lower() not in ['server', 'date', 'transfer-encoding']:
                        self.send_header(key, value)
                
                # CORS 헤더 추가
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.send_header('Access-Control-Allow-Credentials', 'true')
                
                self.end_headers()
                self.wfile.write(response.content)
                
            except Exception as e:
                print(f'Error proxying GET request: {str(e)}')  # 디버깅용 로그
                self.send_error(500, f"Error: {str(e)}")
        else:
            return super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            try:
                print(f'Proxying POST request to: http://localhost:5000{self.path}')  # 디버깅용 로그
                
                # 요청 본문 읽기
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else None
                
                # 원본 요청의 헤더를 복사
                headers = {key: value for key, value in self.headers.items()}
                if 'Host' in headers:
                    del headers['Host']  # Host 헤더 제거
                
                # API 서버로 요청 전달
                response = requests.post(
                    f'http://localhost:5000{self.path}',
                    data=body,
                    headers=headers,
                    cookies=self.parse_cookies()
                )
                
                # 응답 헤더 설정
                self.send_response(response.status_code)
                for key, value in response.headers.items():
                    if key.lower() not in ['server', 'date', 'transfer-encoding']:
                        self.send_header(key, value)
                
                # CORS 헤더 추가
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.send_header('Access-Control-Allow-Credentials', 'true')
                
                self.end_headers()
                self.wfile.write(response.content)
                
            except Exception as e:
                print(f'Error proxying POST request: {str(e)}')  # 디버깅용 로그
                self.send_error(500, f"Error: {str(e)}")
        else:
            self.send_error(404, "File not found")

    def do_DELETE(self):
        if self.path.startswith('/api/'):
            try:
                print(f'Proxying DELETE request to: http://localhost:5000{self.path}')  # 디버깅용 로그

                # 요청 본문 읽기
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else None

                # 원본 요청의 헤더를 복사
                headers = {key: value for key, value in self.headers.items()}
                if 'Host' in headers:
                    del headers['Host']  # Host 헤더 제거

                # API 서버로 요청 전달
                response = requests.delete(
                    f'http://localhost:5000{self.path}',
                    data=body,
                    headers=headers,
                    cookies=self.parse_cookies()
                )

                # 응답 헤더 설정
                self.send_response(response.status_code)
                for key, value in response.headers.items():
                    if key.lower() not in ['server', 'date', 'transfer-encoding']:
                        self.send_header(key, value)

                # CORS 헤더 추가
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.send_header('Access-Control-Allow-Credentials', 'true')

                self.end_headers()
                self.wfile.write(response.content)

            except Exception as e:
                print(f'Error proxying DELETE request: {str(e)}')  # 디버깅용 로그
                self.send_error(500, f"Error: {str(e)}")
        else:
            self.send_error(404, "File not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
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