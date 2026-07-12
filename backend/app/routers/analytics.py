import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from app.database import get_database
from app.dependencies import get_current_active_user
from app.models.report import ReportFilter, ReportResponse
from app.services.report_service import report_service
from app.services.s3_service import s3_service

router = APIRouter()


# ==========================================================================
# ENVIRONMENTAL REPORT
# ==========================================================================

@router.get("/report/environmental", response_model=ReportResponse)
async def environmental_report(
    department_id: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    _: dict = Depends(get_current_active_user),
):
    filters = ReportFilter(
        department_id=department_id,
        start_date=start_date,
        end_date=end_date,
        module="E",
    )
    db = get_database()
    df = await report_service.generate_environmental_report(filters, db)
    return ReportResponse(
        report_type="environmental",
        data={
            "rows": df.to_dict(orient="records"),
            "total_co2e": round(float(df["amount_co2e"].sum()), 4) if not df.empty else 0.0,
            "row_count": len(df),
        },
    )


# ==========================================================================
# SOCIAL REPORT
# ==========================================================================

@router.get("/report/social", response_model=ReportResponse)
async def social_report(
    department_id: str = None,
    _: dict = Depends(get_current_active_user),
):
    filters = ReportFilter(department_id=department_id, module="S")
    db = get_database()
    df = await report_service.generate_social_report(filters, db)
    return ReportResponse(
        report_type="social",
        data={
            "rows": df.to_dict(orient="records"),
            "avg_approval_rate": round(float(df["approval_rate_pct"].mean()), 2)
            if not df.empty
            else 0.0,
            "row_count": len(df),
        },
    )


# ==========================================================================
# GOVERNANCE REPORT
# ==========================================================================

@router.get("/report/governance", response_model=ReportResponse)
async def governance_report(
    department_id: str = None,
    _: dict = Depends(get_current_active_user),
):
    filters = ReportFilter(department_id=department_id, module="G")
    db = get_database()
    df = await report_service.generate_governance_report(filters, db)
    data = {"rows": df.to_dict(orient="records"), "row_count": len(df)}
    if not df.empty and "is_overdue" in df.columns:
        data["overdue_count"] = int(df["is_overdue"].sum())
    return ReportResponse(report_type="governance", data=data)


# ==========================================================================
# SUMMARY REPORT
# ==========================================================================

@router.get("/report/summary", response_model=ReportResponse)
async def summary_report(
    department_id: str = None,
    _: dict = Depends(get_current_active_user),
):
    filters = ReportFilter(department_id=department_id, module="all")
    db = get_database()
    summary = await report_service.generate_summary_report(filters, db)
    return ReportResponse(report_type="summary", data=summary)


# ==========================================================================
# CUSTOM REPORT
# ==========================================================================

@router.post("/custom-report", response_model=ReportResponse)
async def custom_report(
    filters: ReportFilter, _: dict = Depends(get_current_active_user)
):
    db = get_database()
    module = filters.module or "all"
    if module == "E":
        df = await report_service.generate_environmental_report(filters, db)
        data = {"rows": df.to_dict(orient="records"), "row_count": len(df)}
    elif module == "S":
        df = await report_service.generate_social_report(filters, db)
        data = {"rows": df.to_dict(orient="records"), "row_count": len(df)}
    elif module == "G":
        df = await report_service.generate_governance_report(filters, db)
        data = {"rows": df.to_dict(orient="records"), "row_count": len(df)}
    else:
        data = await report_service.generate_summary_report(filters, db)

    return ReportResponse(report_type=module, data=data)


# ==========================================================================
# EXPORT (upload to S3 + presigned URL)
# ==========================================================================

@router.get("/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = Query("csv", pattern="^(csv|excel|pdf)$"),
    department_id: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    current_user: dict = Depends(get_current_active_user),
):
    db = get_database()
    filters = ReportFilter(
        department_id=department_id, start_date=start_date, end_date=end_date
    )

    if report_type == "environmental":
        df = await report_service.generate_environmental_report(filters, db)
        title = "Environmental Report"
    elif report_type == "social":
        df = await report_service.generate_social_report(filters, db)
        title = "Social Report"
    elif report_type == "governance":
        df = await report_service.generate_governance_report(filters, db)
        title = "Governance Report"
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report_type. Use: environmental, social, governance",
        )

    # Export bytes
    if format == "csv":
        file_bytes = report_service.export_to_csv(df)
        content_type = "text/csv"
        ext = "csv"
    elif format == "excel":
        file_bytes = report_service.export_to_excel(df)
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"
    else:
        file_bytes = report_service.export_to_pdf(df, title)
        content_type = "application/pdf"
        ext = "pdf"

    filename = f"{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

    # Try S3 upload; fall back to direct bytes response
    try:
        key = f"reports/{filename}.{ext}"
        s3_service.upload_file(file_bytes, key, content_type)
        presigned_url = s3_service.generate_presigned_url(key)
        return {
            "download_url": presigned_url,
            "filename": f"{filename}.{ext}",
            "format": format,
            "report_type": report_type,
        }
    except Exception:
        # S3 not configured — return file directly
        return Response(
            content=file_bytes,
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}.{ext}"'
            },
        )
