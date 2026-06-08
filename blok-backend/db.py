import httpx

# Monkeypatch httpx.Client to disable HTTP/2, resolving macOS compatibility issues (Errno 35)
original_init = httpx.Client.__init__
def new_init(self, *args, **kwargs):
    kwargs["http2"] = False
    original_init(self, *args, **kwargs)
httpx.Client.__init__ = new_init

from supabase import create_client
import os

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_client():
    return supabase

