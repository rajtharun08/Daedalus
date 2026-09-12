import enum
import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    TypeDecorator,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.config import settings

EMBEDDING_DIM = settings.EMBEDDING_DIM


class Base(DeclarativeBase):
    pass


# Adaptive Vector Type: uses pgvector on Postgres, JSON array on SQLite
class VectorType(TypeDecorator):
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            try:
                from pgvector.sqlalchemy import Vector
                return dialect.type_descriptor(Vector(EMBEDDING_DIM))
            except ImportError:
                return dialect.type_descriptor(Text())
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        # Store as JSON string in SQLite/fallback
        if isinstance(value, list):
            return json.dumps(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return []
        return value


class TaskStatus(str, enum.Enum):
    BACKLOG = "BACKLOG"
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"


class CIStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"


# ---------------------------------------------------------
# Pillar 1: Team & User Models
# ---------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    github_username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    github_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC+00:00")
    active_branch: Mapped[str] = mapped_column(String(100), default="main")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    skills: Mapped[List["UserSkill"]] = relationship(back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    assigned_tasks: Mapped[List["Task"]] = relationship(back_populates="assignee", lazy="selectin")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    raw_skill_text: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), default="General")
    proficiency: Mapped[float] = mapped_column(Float, default=0.85)
    embedding = mapped_column(VectorType)

    user: Mapped["User"] = relationship(back_populates="skills")


# ---------------------------------------------------------
# Pillar 2: Project, Epics & Tasks (Acyclic Graph)
# ---------------------------------------------------------
class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    github_repo: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    squad_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    squad_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    squad_member_ids: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded list of user IDs
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    epics: Mapped[List["Epic"]] = relationship(back_populates="project", cascade="all, delete-orphan", lazy="selectin")


class Epic(Base):
    __tablename__ = "epics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    project: Mapped["Project"] = relationship(back_populates="epics")
    tasks: Mapped[List["Task"]] = relationship(back_populates="epic", cascade="all, delete-orphan", lazy="selectin")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    epic_id: Mapped[str] = mapped_column(ForeignKey("epics.id", ondelete="CASCADE"), index=True)
    task_code: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)

    # Required tech stack & vector embedding for skill matching
    required_skills_text: Mapped[str] = mapped_column(Text)
    skill_embedding = mapped_column(VectorType)
    assignee_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Mock API route spec for automated scaffolding
    api_route_spec: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded spec

    # Status & Git/CI Tracking
    status: Mapped[str] = mapped_column(String(30), default="TODO", index=True)
    ci_status: Mapped[str] = mapped_column(String(30), default="PENDING")
    branch_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pr_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    last_commit_hash: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_commit_message: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    epic: Mapped["Epic"] = relationship(back_populates="tasks")
    assignee: Mapped[Optional["User"]] = relationship(back_populates="assigned_tasks", lazy="selectin")

    upstream_dependencies: Mapped[List["TaskDependency"]] = relationship(
        foreign_keys="[TaskDependency.task_id]", back_populates="task", cascade="all, delete-orphan", lazy="selectin"
    )
    downstream_dependencies: Mapped[List["TaskDependency"]] = relationship(
        foreign_keys="[TaskDependency.depends_on_task_id]", back_populates="prerequisite_task", cascade="all, delete-orphan", lazy="selectin"
    )


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    depends_on_task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)

    task: Mapped["Task"] = relationship("Task", foreign_keys=[task_id], back_populates="upstream_dependencies")
    prerequisite_task: Mapped["Task"] = relationship("Task", foreign_keys=[depends_on_task_id], back_populates="downstream_dependencies")

    __table_args__ = (
        UniqueConstraint("task_id", "depends_on_task_id", name="uq_task_dependency_edge"),
    )


# ---------------------------------------------------------
# Pillar 4: Webhook Audit Log
# ---------------------------------------------------------
class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    event_type: Mapped[str] = mapped_column(String(50))
    delivery_guid: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    payload: Mapped[str] = mapped_column(Text)  # JSON-encoded payload
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------
# Pillar 5: Persistent Team Invitations
# ---------------------------------------------------------
class TeamInvitation(Base):
    __tablename__ = "team_invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"inv_{uuid4().hex[:8]}")
    team_id: Mapped[str] = mapped_column(String(100), index=True)
    squad_name: Mapped[str] = mapped_column(String(200))
    target_username: Mapped[str] = mapped_column(String(100), index=True)
    target_user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    target_user_name: Mapped[str] = mapped_column(String(100))
    target_avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(String(100))
    pitch_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    projected_synergy: Mapped[int] = mapped_column(Integer, default=15)
    invited_by_name: Mapped[str] = mapped_column(String(100))
    invited_by_handle: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(30), default="PENDING", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

