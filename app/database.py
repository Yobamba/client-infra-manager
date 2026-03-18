import libsql_client
import os
from contextlib import contextmanager

_client = libsql_client.create_client_sync(
    url=os.getenv("DATABASE_URL"),  # libsql://client-infra-db...
    auth_token=os.getenv("TURSO_AUTH_TOKEN")
)

@contextmanager
def get_db():
    yield _client
