from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import (
    get_audits_collection,
    get_compliance_issues_collection,
    get_database,
    get_policies_collection,
    get_policy_acknowledgements_collection,
    get_users_collection,
)
from app.dependencies import get_current_active_user, get_manager_or_admin
from app.models.compliance_issue import (
    ComplianceIssueCreate,
    ComplianceIssueResponse,
    ComplianceIssueUpdate,
)
from app.models.policy import (
    AcknowledgementResponse,
    AuditCreate,
    AuditResponse,
    PolicyCreate,
    PolicyResponse,
    PolicyUpdate,
)
from app.services.email_service import email_service

router = APIRouter()


def _str(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def _oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid id: {id_str}")


def _compute_overdue(doc: dict) -> dict:
    if doc.get("status") not in ("resolved", "closed"):
        due = doc.get("due_date")
        if due and due < datetime.utcnow():
            doc["is_overdue"] = True
        else:
            doc["is_overdue"] = False
    else:
        doc["is_overdue"] = False
    return doc


# ==========================================================================
# COMPLIANCE ISSUES
# ==========================================================================

@router.get("/compliance-issues", response_model=List[ComplianceIssueResponse])
async def list_compliance_issues(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    department_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_compliance_issues_collection()
    query: dict = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if department_id:
        query["department_id"] = department_id
    docs = await col.find(query).skip(skip).limit(limit).to_list(length=limit)
    return [_compute_overdue(_str(d)) for d in docs]


@router.get("/compliance-issues/overdue", response_model=List[ComplianceIssueResponse])
async def list_overdue_issues(_: dict = Depends(get_current_active_user)):
    col = get_compliance_issues_collection()
    now = datetime.utcnow()
    docs = await col.find(
        {"status": {"$in": ["open", "in_progress"]}, "due_date": {"$lt": now}}
    ).to_list(length=None)
    return [_compute_overdue(_str(d)) for d in docs]


@router.post("/compliance-issues", response_model=ComplianceIssueResponse, status_code=201)
async def create_compliance_issue(
    body: ComplianceIssueCreate, current_user: dict = Depends(get_manager_or_admin)
):
    # Validate owner exists
    users_col = get_users_collection()
    owner = await users_col.find_one({"_id": _oid(body.owner_id)})
    if not owner:
        raise HTTPException(status_code=404, detail="Owner user not found")

    col = get_compliance_issues_collection()
    doc = body.model_dump()
    doc["status"] = "open"
    doc["is_overdue"] = False
    doc["resolution_notes"] = None
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})

    # Send email alert to owner
    await email_service.send_compliance_alert(
        email=owner.get("email", ""),
        name=owner.get("name", ""),
        issue_title=body.title,
        severity=body.severity,
        due_date=body.due_date.strftime("%Y-%m-%d"),
    )

    return _compute_overdue(_str(created))


@router.get("/compliance-issues/{issue_id}", response_model=ComplianceIssueResponse)
async def get_compliance_issue(
    issue_id: str, _: dict = Depends(get_current_active_user)
):
    col = get_compliance_issues_collection()
    doc = await col.find_one({"_id": _oid(issue_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Compliance issue not found")
    return _compute_overdue(_str(doc))


@router.put("/compliance-issues/{issue_id}", response_model=ComplianceIssueResponse)
async def update_compliance_issue(
    issue_id: str, body: ComplianceIssueUpdate, _: dict = Depends(get_manager_or_admin)
):
    col = get_compliance_issues_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await col.update_one({"_id": _oid(issue_id)}, {"$set": data})
    doc = await col.find_one({"_id": _oid(issue_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Compliance issue not found")
    return _compute_overdue(_str(doc))


@router.delete("/compliance-issues/{issue_id}", status_code=204)
async def delete_compliance_issue(
    issue_id: str, _: dict = Depends(get_manager_or_admin)
):
    col = get_compliance_issues_collection()
    result = await col.delete_one({"_id": _oid(issue_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Compliance issue not found")


# ==========================================================================
# POLICIES
# ==========================================================================

@router.get("/policies", response_model=List[PolicyResponse])
async def list_policies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    pol_col = get_policies_collection()
    ack_col = get_policy_acknowledgements_collection()
    users_col = get_users_collection()
    docs = await pol_col.find().skip(skip).limit(limit).to_list(length=limit)
    result = []
    for d in docs:
        policy_id = str(d["_id"])
        ack_count = await ack_col.count_documents({"policy_id": policy_id})
        dept_ids = d.get("department_ids", [])
        total_required = await users_col.count_documents(
            {"department_id": {"$in": dept_ids}} if dept_ids else {}
        )
        d["acknowledgement_count"] = ack_count
        d["total_required"] = total_required
        result.append(_str(d))
    return result


@router.post("/policies", response_model=PolicyResponse, status_code=201)
async def create_policy(body: PolicyCreate, _: dict = Depends(get_manager_or_admin)):
    pol_col = get_policies_collection()
    doc = body.model_dump()
    doc["acknowledgement_count"] = 0
    doc["total_required"] = 0
    doc["published_at"] = None
    doc["created_at"] = datetime.utcnow()
    result = await pol_col.insert_one(doc)
    created = await pol_col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/policies/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: str, _: dict = Depends(get_current_active_user)):
    pol_col = get_policies_collection()
    doc = await pol_col.find_one({"_id": _oid(policy_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Policy not found")
    ack_col = get_policy_acknowledgements_collection()
    doc["acknowledgement_count"] = await ack_col.count_documents(
        {"policy_id": policy_id}
    )
    dept_ids = doc.get("department_ids", [])
    users_col = get_users_collection()
    doc["total_required"] = await users_col.count_documents(
        {"department_id": {"$in": dept_ids}} if dept_ids else {}
    )
    return _str(doc)


@router.put("/policies/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str, body: PolicyUpdate, _: dict = Depends(get_manager_or_admin)
):
    pol_col = get_policies_collection()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await pol_col.update_one({"_id": _oid(policy_id)}, {"$set": data})
    doc = await pol_col.find_one({"_id": _oid(policy_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Policy not found")
    return _str(doc)


@router.post("/policies/{policy_id}/publish")
async def publish_policy(
    policy_id: str, manager: dict = Depends(get_manager_or_admin)
):
    pol_col = get_policies_collection()
    policy = await pol_col.find_one({"_id": _oid(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if policy.get("published_at"):
        raise HTTPException(status_code=409, detail="Policy already published")

    now = datetime.utcnow()
    await pol_col.update_one(
        {"_id": _oid(policy_id)}, {"$set": {"published_at": now}}
    )

    # Send acknowledgement emails to all employees in policy departments
    dept_ids: List[str] = policy.get("department_ids", [])
    users_col = get_users_collection()
    query = {"department_id": {"$in": dept_ids}} if dept_ids else {}
    employees = await users_col.find(query).to_list(length=None)
    for emp in employees:
        await email_service.send_policy_reminder(
            email=emp.get("email", ""),
            name=emp.get("name", ""),
            policy_title=policy.get("title", ""),
            deadline="Please acknowledge as soon as possible",
        )

    return {
        "message": f"Policy published. Sent reminders to {len(employees)} employee(s).",
        "published_at": now.isoformat(),
    }


@router.post("/policies/{policy_id}/acknowledge")
async def acknowledge_policy(
    policy_id: str, current_user: dict = Depends(get_current_active_user)
):
    pol_col = get_policies_collection()
    policy = await pol_col.find_one({"_id": _oid(policy_id)})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if not policy.get("published_at"):
        raise HTTPException(status_code=422, detail="Policy not yet published")

    ack_col = get_policy_acknowledgements_collection()
    employee_id = str(current_user["_id"])
    existing = await ack_col.find_one(
        {"policy_id": policy_id, "employee_id": employee_id}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already acknowledged")

    doc = {
        "policy_id": policy_id,
        "employee_id": employee_id,
        "employee_name": current_user.get("name", ""),
        "acknowledged_at": datetime.utcnow(),
    }
    result = await ack_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _str(doc)


@router.get(
    "/policies/{policy_id}/acknowledgements",
    response_model=List[AcknowledgementResponse],
)
async def get_policy_acknowledgements(
    policy_id: str, _: dict = Depends(get_manager_or_admin)
):
    ack_col = get_policy_acknowledgements_collection()
    docs = await ack_col.find({"policy_id": policy_id}).to_list(length=None)
    return [_str(d) for d in docs]


# ==========================================================================
# AUDITS
# ==========================================================================

@router.get("/audits", response_model=List[AuditResponse])
async def list_audits(
    policy_id: Optional[str] = None,
    department_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_active_user),
):
    col = get_audits_collection()
    query: dict = {}
    if policy_id:
        query["policy_id"] = policy_id
    if department_id:
        query["department_id"] = department_id
    docs = await col.find(query).skip(skip).limit(limit).to_list(length=limit)
    return [_str(d) for d in docs]


@router.post("/audits", response_model=AuditResponse, status_code=201)
async def create_audit(body: AuditCreate, _: dict = Depends(get_manager_or_admin)):
    col = get_audits_collection()
    doc = body.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await col.insert_one(doc)
    created = await col.find_one({"_id": result.inserted_id})
    return _str(created)


@router.get("/audits/{audit_id}", response_model=AuditResponse)
async def get_audit(audit_id: str, _: dict = Depends(get_current_active_user)):
    col = get_audits_collection()
    doc = await col.find_one({"_id": _oid(audit_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit not found")
    return _str(doc)
