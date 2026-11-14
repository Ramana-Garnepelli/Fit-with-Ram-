from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import authorize_branch, get_current_user, require_roles
from app.db.models import (
    Attendance,
    Branch,
    ClassBooking,
    FitnessClass,
    FitnessProgress,
    MemberProfile,
    Membership,
    Notification,
    TrainerAssignment,
    User,
    UserBranchAssignment,
    WorkoutExercise,
    WorkoutLog,
    WorkoutPlan,
)
from app.db.session import get_db
from app.schemas.organization import (
    FitnessClassCreate,
    ProgressCreate,
    TrainerAssignmentCreate,
    TrainerWorkoutCreate,
    WorkoutLogCreate,
)
from app.services.email import class_booking_email

router = APIRouter(tags=["training"])


def _member_branch(db: Session, user: User) -> MemberProfile:
    profile = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == user.id, MemberProfile.is_active.is_(True)
        )
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member profile not found")
    return profile


def _has_active_membership(db: Session, profile: MemberProfile) -> bool:
    now = datetime.now(UTC)
    return bool(
        db.scalar(
            select(Membership.id).where(
                Membership.member_user_id == profile.user_id,
                Membership.organization_id == profile.organization_id,
                Membership.branch_id == profile.branch_id,
                Membership.status == "ACTIVE",
                Membership.starts_at <= now,
                Membership.expires_at > now,
            )
        )
    )


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


@router.post("/admin/trainer-assignments", status_code=201)
def assign_trainer(
    payload: TrainerAssignmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("GYM_OWNER", "BRANCH_MANAGER")),
):
    trainer = db.get(User, payload.trainer_user_id)
    member = db.get(MemberProfile, payload.member_user_id)
    if (
        trainer is None
        or trainer.role != "TRAINER"
        or member is None
        or trainer.organization_id != user.organization_id
        or member.organization_id != user.organization_id
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trainer or member not found")
    authorize_branch(db, user, member.branch_id)
    if (
        db.scalar(
            select(UserBranchAssignment.id).where(
                UserBranchAssignment.user_id == trainer.id,
                UserBranchAssignment.organization_id == member.organization_id,
                UserBranchAssignment.branch_id == member.branch_id,
                UserBranchAssignment.branch_role == "TRAINER",
            )
        )
        is None
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trainer is not assigned to this branch")
    if db.scalar(
        select(TrainerAssignment).where(
            TrainerAssignment.trainer_user_id == trainer.id,
            TrainerAssignment.member_user_id == member.user_id,
            TrainerAssignment.is_active.is_(True),
        )
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "Trainer is already assigned to this member")
    assignment = TrainerAssignment(
        organization_id=member.organization_id,
        branch_id=member.branch_id,
        trainer_user_id=trainer.id,
        member_user_id=member.user_id,
    )
    db.add(assignment)
    db.commit()
    return {
        "id": assignment.id,
        "trainer_user_id": trainer.id,
        "member_user_id": member.user_id,
        "branch_id": member.branch_id,
    }


@router.get("/trainer/dashboard")
def trainer_dashboard(
    db: Session = Depends(get_db), user: User = Depends(require_roles("TRAINER"))
) -> dict[str, int]:
    assignment_filter = (
        TrainerAssignment.trainer_user_id == user.id,
        TrainerAssignment.is_active.is_(True),
    )
    assigned_members = (
        db.scalar(select(func.count(TrainerAssignment.id)).where(*assignment_filter)) or 0
    )
    upcoming_classes = (
        db.scalar(
            select(func.count(FitnessClass.id)).where(
                FitnessClass.trainer_user_id == user.id,
                FitnessClass.is_active.is_(True),
                FitnessClass.starts_at >= datetime.now(UTC),
            )
        )
        or 0
    )
    workout_plans = (
        db.scalar(
            select(func.count(WorkoutPlan.id)).where(
                WorkoutPlan.trainer_user_id == user.id, WorkoutPlan.is_active.is_(True)
            )
        )
        or 0
    )
    return {
        "assigned_members": int(assigned_members),
        "upcoming_classes": int(upcoming_classes),
        "workout_plans": int(workout_plans),
    }


@router.get("/trainer/members")
def trainer_members(
    db: Session = Depends(get_db), user: User = Depends(require_roles("TRAINER"))
) -> list[dict]:
    rows = db.execute(
        select(User, MemberProfile, TrainerAssignment.branch_id)
        .join(MemberProfile, MemberProfile.user_id == User.id)
        .join(TrainerAssignment, TrainerAssignment.member_user_id == User.id)
        .join(
            UserBranchAssignment,
            (UserBranchAssignment.user_id == user.id)
            & (UserBranchAssignment.branch_id == TrainerAssignment.branch_id)
            & (UserBranchAssignment.organization_id == TrainerAssignment.organization_id),
        )
        .where(
            TrainerAssignment.trainer_user_id == user.id,
            TrainerAssignment.is_active.is_(True),
            TrainerAssignment.organization_id == user.organization_id,
            MemberProfile.branch_id == TrainerAssignment.branch_id,
            MemberProfile.is_active.is_(True),
            UserBranchAssignment.branch_role == "TRAINER",
        )
        .order_by(User.full_name)
    ).all()
    return [
        {
            "id": member.id,
            "full_name": member.full_name,
            "email": member.email,
            "branch_id": branch_id,
            "fitness_goals": profile.fitness_goals,
            "current_weight_kg": profile.current_weight_kg,
            "target_weight_kg": profile.target_weight_kg,
            "height_cm": profile.height_cm,
        }
        for member, profile, branch_id in rows
    ]


@router.get("/trainer/classes")
def trainer_classes(
    db: Session = Depends(get_db), user: User = Depends(require_roles("TRAINER"))
) -> list[dict]:
    rows = db.scalars(
        select(FitnessClass)
        .where(
            FitnessClass.trainer_user_id == user.id,
            FitnessClass.organization_id == user.organization_id,
            FitnessClass.is_active.is_(True),
            FitnessClass.branch_id.in_(
                select(UserBranchAssignment.branch_id).where(
                    UserBranchAssignment.user_id == user.id,
                    UserBranchAssignment.organization_id == user.organization_id,
                    UserBranchAssignment.branch_role == "TRAINER",
                )
            ),
            FitnessClass.ends_at >= datetime.now(UTC),
        )
        .order_by(FitnessClass.starts_at)
    ).all()
    return [
        {
            "id": item.id,
            "branch_id": item.branch_id,
            "title": item.title,
            "description": item.description,
            "starts_at": item.starts_at,
            "ends_at": item.ends_at,
            "capacity": item.capacity,
            "booked": db.scalar(
                select(func.count(ClassBooking.id)).where(
                    ClassBooking.fitness_class_id == item.id,
                    ClassBooking.status == "BOOKED",
                )
            )
            or 0,
        }
        for item in rows
    ]


@router.get("/trainer/branches")
def trainer_branches(
    db: Session = Depends(get_db), user: User = Depends(require_roles("TRAINER"))
) -> list[dict]:
    return [
        {"id": branch.id, "name": branch.name, "city": branch.city}
        for branch in db.scalars(
            select(Branch)
            .join(UserBranchAssignment, UserBranchAssignment.branch_id == Branch.id)
            .where(
                UserBranchAssignment.user_id == user.id,
                UserBranchAssignment.organization_id == user.organization_id,
                UserBranchAssignment.branch_role == "TRAINER",
                Branch.is_active.is_(True),
            )
            .order_by(Branch.name)
        ).all()
    ]


@router.post("/branches/{branch_id}/classes", status_code=status.HTTP_201_CREATED)
def create_fitness_class(
    branch_id: UUID,
    payload: FitnessClassCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("GYM_OWNER", "BRANCH_MANAGER", "TRAINER")),
) -> dict:
    branch = authorize_branch(db, user, branch_id)
    trainer_id = payload.trainer_user_id
    if user.role == "TRAINER" and trainer_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trainer not found for this branch")
    trainer_assignment = db.scalar(
        select(UserBranchAssignment.id).where(
            UserBranchAssignment.user_id == trainer_id,
            UserBranchAssignment.organization_id == branch.organization_id,
            UserBranchAssignment.branch_id == branch_id,
            UserBranchAssignment.branch_role == "TRAINER",
        )
    )
    if trainer_assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trainer not found for this branch")
    fitness_class = FitnessClass(
        organization_id=branch.organization_id,
        branch_id=branch.id,
        trainer_user_id=trainer_id,
        title=payload.title.strip(),
        description=payload.description,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        capacity=payload.capacity,
    )
    db.add(fitness_class)
    db.commit()
    db.refresh(fitness_class)
    return {
        "id": fitness_class.id,
        "branch_id": fitness_class.branch_id,
        "trainer_user_id": fitness_class.trainer_user_id,
        "title": fitness_class.title,
        "starts_at": fitness_class.starts_at,
        "ends_at": fitness_class.ends_at,
        "capacity": fitness_class.capacity,
    }


@router.post("/trainer/workout-plans", status_code=201)
def create_workout_plan(
    payload: TrainerWorkoutCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("TRAINER")),
):
    member = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == payload.member_user_id,
            MemberProfile.organization_id == user.organization_id,
            MemberProfile.is_active.is_(True),
        )
    )
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assigned member not found")
    assignment = db.scalar(
        select(TrainerAssignment).where(
            TrainerAssignment.trainer_user_id == user.id,
            TrainerAssignment.member_user_id == payload.member_user_id,
            TrainerAssignment.branch_id == member.branch_id,
            TrainerAssignment.is_active.is_(True),
        )
    )
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assigned member not found")
    authorize_branch(db, user, member.branch_id)
    plan = WorkoutPlan(
        organization_id=user.organization_id,
        branch_id=member.branch_id,
        member_user_id=member.user_id,
        trainer_user_id=user.id,
        title=payload.title,
        description=payload.description,
        schedule=payload.schedule,
    )
    db.add(plan)
    db.flush()
    for index, exercise in enumerate(payload.exercises):
        db.add(
            WorkoutExercise(
                organization_id=user.organization_id,
                branch_id=member.branch_id,
                workout_plan_id=plan.id,
                sort_order=index,
                **exercise.model_dump(),
            )
        )
    db.commit()
    return {
        "id": plan.id,
        "member_user_id": member.user_id,
        "title": plan.title,
        "exercises": len(payload.exercises),
    }


@router.get("/members/me/workout-plans")
def my_workouts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _member_branch(db, user)
    plans = db.scalars(
        select(WorkoutPlan)
        .where(WorkoutPlan.member_user_id == user.id, WorkoutPlan.is_active.is_(True))
        .order_by(WorkoutPlan.created_at.desc())
    ).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "schedule": p.schedule,
            "exercises": [
                {
                    "name": e.name,
                    "sets": e.sets,
                    "repetitions": e.repetitions,
                    "rest_seconds": e.rest_seconds,
                    "notes": e.notes,
                }
                for e in db.scalars(
                    select(WorkoutExercise)
                    .where(WorkoutExercise.workout_plan_id == p.id)
                    .order_by(WorkoutExercise.sort_order)
                ).all()
            ],
        }
        for p in plans
    ]


@router.post("/members/me/workout-logs", status_code=201)
def log_workout(
    payload: WorkoutLogCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    member = _member_branch(db, user)
    if (
        payload.workout_plan_id
        and db.scalar(
            select(WorkoutPlan.id).where(
                WorkoutPlan.id == payload.workout_plan_id, WorkoutPlan.member_user_id == user.id
            )
        )
        is None
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workout plan not found")
    log = WorkoutLog(
        organization_id=member.organization_id,
        branch_id=member.branch_id,
        member_user_id=user.id,
        **payload.model_dump(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {
        "id": log.id,
        "completed_at": log.completed_at,
        "duration_minutes": log.duration_minutes,
    }


@router.get("/members/me/workout-logs")
def my_workout_logs(
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _member_branch(db, user)
    return [
        {
            "id": r.id,
            "completed_at": r.completed_at,
            "duration_minutes": r.duration_minutes,
            "notes": r.notes,
            "exercise_results": r.exercise_results,
        }
        for r in db.scalars(
            select(WorkoutLog)
            .where(WorkoutLog.member_user_id == user.id)
            .order_by(WorkoutLog.completed_at.desc())
            .limit(limit)
        ).all()
    ]


@router.post("/members/me/progress", status_code=201)
def add_progress(
    payload: ProgressCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    member = _member_branch(db, user)
    record = FitnessProgress(
        organization_id=member.organization_id,
        branch_id=member.branch_id,
        member_user_id=user.id,
        **payload.model_dump(),
    )
    db.add(record)
    if payload.weight_kg is not None:
        member.current_weight_kg = payload.weight_kg
    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "recorded_at": record.recorded_at,
        "weight_kg": record.weight_kg,
        "body_fat_percent": record.body_fat_percent,
        "measurements": record.measurements,
    }


@router.get("/members/me/progress")
def my_progress(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _member_branch(db, user)
    return [
        {
            "id": r.id,
            "recorded_at": r.recorded_at,
            "weight_kg": r.weight_kg,
            "body_fat_percent": r.body_fat_percent,
            "measurements": r.measurements,
            "notes": r.notes,
        }
        for r in db.scalars(
            select(FitnessProgress)
            .where(FitnessProgress.member_user_id == user.id)
            .order_by(FitnessProgress.recorded_at.desc())
        ).all()
    ]


@router.get("/branches/{branch_id}/classes")
def list_classes(
    branch_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    authorize_branch(db, user, branch_id)
    classes = db.scalars(
        select(FitnessClass)
        .where(
            FitnessClass.branch_id == branch_id,
            FitnessClass.is_active.is_(True),
            FitnessClass.ends_at >= datetime.now(UTC),
        )
        .order_by(FitnessClass.starts_at)
    ).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "trainer_user_id": c.trainer_user_id,
            "starts_at": c.starts_at,
            "ends_at": c.ends_at,
            "capacity": c.capacity,
            "booked": db.scalar(
                select(func.count(ClassBooking.id)).where(
                    ClassBooking.fitness_class_id == c.id, ClassBooking.status == "BOOKED"
                )
            )
            or 0,
        }
        for c in classes
    ]


@router.post("/classes/{class_id}/book", status_code=201)
def book_class(
    class_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    member = _member_branch(db, user)
    if not _has_active_membership(db, member):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "An active membership is required")
    fitness_class = db.scalar(
        select(FitnessClass).where(FitnessClass.id == class_id).with_for_update()
    )
    if (
        fitness_class is None
        or not fitness_class.is_active
        or fitness_class.organization_id != member.organization_id
        or fitness_class.branch_id != member.branch_id
        or _utc(fitness_class.starts_at) <= datetime.now(UTC)
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Available class not found")
    existing = db.scalar(
        select(ClassBooking).where(
            ClassBooking.fitness_class_id == class_id, ClassBooking.member_user_id == user.id
        )
    )
    if existing and existing.status == "BOOKED":
        return {"id": existing.id, "status": existing.status}
    booked = (
        db.scalar(
            select(func.count(ClassBooking.id)).where(
                ClassBooking.fitness_class_id == class_id, ClassBooking.status == "BOOKED"
            )
        )
        or 0
    )
    if booked >= fitness_class.capacity:
        raise HTTPException(status.HTTP_409_CONFLICT, "Class is full")
    if existing:
        existing.status = "BOOKED"
        existing.cancelled_at = None
        booking = existing
    else:
        booking = ClassBooking(
            organization_id=member.organization_id,
            branch_id=member.branch_id,
            fitness_class_id=class_id,
            member_user_id=user.id,
        )
        db.add(booking)
    db.add(
        Notification(
            organization_id=member.organization_id,
            branch_id=member.branch_id,
            user_id=user.id,
            title="Class booking confirmed",
            body=f"Your booking for {fitness_class.title} is confirmed.",
            category="CLASS",
            data={"class_id": str(fitness_class.id)},
        )
    )
    db.commit()
    db.refresh(booking)
    class_booking_email(
        to=user.email,
        member_name=user.full_name,
        class_title=fitness_class.title,
        starts_at=fitness_class.starts_at,
    )
    return {"id": booking.id, "status": booking.status}


@router.get("/members/me/class-bookings")
def my_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _member_branch(db, user)
    rows = db.execute(
        select(ClassBooking, FitnessClass)
        .join(FitnessClass, FitnessClass.id == ClassBooking.fitness_class_id)
        .where(ClassBooking.member_user_id == user.id)
        .order_by(FitnessClass.starts_at.desc())
    ).all()
    return [
        {
            "id": b.id,
            "status": b.status,
            "class_id": c.id,
            "title": c.title,
            "starts_at": c.starts_at,
            "ends_at": c.ends_at,
        }
        for b, c in rows
    ]


@router.delete("/class-bookings/{booking_id}", status_code=204)
def cancel_booking(
    booking_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    booking = db.scalar(
        select(ClassBooking).where(
            ClassBooking.id == booking_id,
            ClassBooking.member_user_id == user.id,
            ClassBooking.status == "BOOKED",
        )
    )
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    booking.status = "CANCELLED"
    booking.cancelled_at = datetime.now(UTC)
    fitness_class = db.get(FitnessClass, booking.fitness_class_id)
    if fitness_class is not None:
        db.add(
            Notification(
                organization_id=booking.organization_id,
                branch_id=booking.branch_id,
                user_id=user.id,
                title="Class booking cancelled",
                body=f"Your booking for {fitness_class.title} has been cancelled.",
                category="CLASS",
                data={"class_id": str(fitness_class.id)},
            )
        )
    db.commit()
    if fitness_class is not None:
        class_booking_email(
            to=user.email,
            member_name=user.full_name,
            class_title=fitness_class.title,
            starts_at=fitness_class.starts_at,
            cancelled=True,
        )


@router.post("/branches/{branch_id}/attendance/check-in", status_code=201)
def check_in(
    branch_id: UUID,
    member_user_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("GYM_OWNER", "BRANCH_MANAGER", "TRAINER", "MEMBER")),
):
    branch = authorize_branch(db, user, branch_id)
    target_id = member_user_id if user.role != "MEMBER" else user.id
    profile = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == target_id,
            MemberProfile.branch_id == branch_id,
            MemberProfile.is_active.is_(True),
        )
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found at this branch")
    if not _has_active_membership(db, profile):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Member does not have an active membership")
    today = datetime.now(UTC).date()
    if db.scalar(
        select(Attendance.id).where(
            Attendance.member_user_id == target_id,
            Attendance.branch_id == branch_id,
            func.date(Attendance.checked_in_at) == today,
        )
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "Member already checked in today")
    row = Attendance(
        organization_id=branch.organization_id,
        branch_id=branch_id,
        member_user_id=target_id,
        checked_in_by=user.id,
        source="STAFF" if user.id != target_id else "MEMBER",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "member_user_id": row.member_user_id, "checked_in_at": row.checked_in_at}


@router.post("/branches/{branch_id}/attendance/check-out")
def check_out(
    branch_id: UUID,
    member_user_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("GYM_OWNER", "BRANCH_MANAGER", "TRAINER", "MEMBER")),
):
    authorize_branch(db, user, branch_id)
    target_id = member_user_id if user.role != "MEMBER" else user.id
    profile = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == target_id,
            MemberProfile.branch_id == branch_id,
            MemberProfile.is_active.is_(True),
        )
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found at this branch")
    row = db.scalar(
        select(Attendance)
        .where(
            Attendance.member_user_id == target_id,
            Attendance.branch_id == branch_id,
            Attendance.checked_out_at.is_(None),
        )
        .order_by(Attendance.checked_in_at.desc())
        .limit(1)
        .with_for_update()
    )
    if row is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Member has no open attendance session")
    row.checked_out_at = datetime.now(UTC)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "member_user_id": row.member_user_id,
        "checked_in_at": row.checked_in_at,
        "checked_out_at": row.checked_out_at,
    }


@router.get("/members/me/attendance")
def my_attendance(
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _member_branch(db, user)
    return [
        {
            "id": a.id,
            "checked_in_at": a.checked_in_at,
            "checked_out_at": a.checked_out_at,
            "method": a.source,
        }
        for a in db.scalars(
            select(Attendance)
            .where(Attendance.member_user_id == user.id)
            .order_by(Attendance.checked_in_at.desc())
            .limit(limit)
        ).all()
    ]
