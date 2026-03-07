from __future__ import annotations

import argparse
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class SpaRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str, **kwargs):
        self._spa_directory = directory
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self) -> None:
        requested_path = self.translate_path(self.path)
        if os.path.isdir(requested_path):
            index_path = os.path.join(requested_path, 'index.html')
            if os.path.exists(index_path):
                return super().do_GET()
        elif os.path.exists(requested_path):
            return super().do_GET()

        self.path = '/index.html'
        return super().do_GET()


def main() -> None:
    parser = argparse.ArgumentParser(description='Serve a single-page app with index fallback.')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=4305)
    parser.add_argument('--root', required=True)
    args = parser.parse_args()

    root = Path(args.root).resolve()
    handler = lambda *handler_args, **handler_kwargs: SpaRequestHandler(
        *handler_args,
        directory=str(root),
        **handler_kwargs,
    )
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f'Serving {root} on http://{args.host}:{args.port}', flush=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
