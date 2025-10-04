from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

PORT = 8000

# from current directory (where index.html lives)
web_dir = os.path.join(os.path.dirname(__file__))
os.chdir(web_dir)

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {self.address_string()} - {format%args}")

if __name__ == "__main__":
    print(f"Serving on http://localhost:{PORT}")
    HTTPServer(("", PORT), Handler).serve_forever()