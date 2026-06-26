import argparse
import os
import webbrowser

import uvicorn

from openclaw.main import app


def main() -> None:
    parser = argparse.ArgumentParser(prog="ArmyClawCore")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    os.environ.setdefault("ARMY_CLAW_HOST", args.host)
    os.environ.setdefault("ARMY_CLAW_PORT", str(args.port))

    if not args.no_browser:
        webbrowser.open(f"http://{args.host}:{args.port}")

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info",
        loop="asyncio",
        http="h11",
    )


if __name__ == "__main__":
    main()
