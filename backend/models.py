from databases import Database
from pydantic import BaseModel
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Text
from sqlalchemy.sql import select

class Users(BaseModel):
    id: int
    username: str
    avatar: str
    message: str
    received: str


db_url = "sqlite:///./users.db"

database = Database(db_url)
metadata = MetaData()

users = Table("users", metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(100), nullable=False),
    Column("avatar", String(100), nullable=False),
    Column("message", Text, nullable=False),
    Column("received", String(100), nullable=False)
)

engine = create_engine(db_url, echo=False)
metadata.bind = engine
metadata.create_all(engine)

async def insert_message(**kwargs) -> int:
    await database.execute(query=users.insert(),values=kwargs)

async def get_history() -> users:
    return await database.fetch_all(query=select([users]))
