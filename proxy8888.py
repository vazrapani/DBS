from http.server import BaseHTTPRequestHandler, HTTPServer
import requests

class Proxy(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            url = f'http://localhost:5000{self.path}'
        else:
            url = f'http://localhost:8000{self.path}'
        resp = requests.get(url, headers=self.headers, stream=True)
        self.send_response(resp.status_code)
        for k, v in resp.headers.items():
            if k.lower() == 'transfer-encoding':
                continue
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(resp.content)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        if self.path.startswith('/api/'):
            url = f'http://localhost:5000{self.path}'
        else:
            url = f'http://localhost:8000{self.path}'
        resp = requests.post(url, headers=self.headers, data=post_data, stream=True)
        self.send_response(resp.status_code)
        for k, v in resp.headers.items():
            if k.lower() == 'transfer-encoding':
                continue
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(resp.content)

if __name__ == '__main__':
    print('프록시 서버가 8888번 포트에서 시작됩니다.')
    HTTPServer(('0.0.0.0', 8888), Proxy).serve_forever() 