import io
import logging
from datetime import datetime
from typing import Any, Dict, List

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorDatabase
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Table, TableStyle

from app.models.report import ReportFilter

logger = logging.getLogger(__name__)


def _apply_date_filter(query: dict, filters: ReportFilter) -> dict:
    if filters.start_date or filters.end_date:
        query["date"] = {}
        if filters.start_date:
            query["date"]["$gte"] = filters.start_date
        if filters.end_date:
            query["date"]["$lte"] = filters.end_date
    return query


class ReportService:
    # ------------------------------------------------------------------ E
    async def generate_environmental_report(
        self, filters: ReportFilter, db: AsyncIOMotorDatabase
    ) -> pd.DataFrame:
        query: dict = {}
        if filters.department_id:
            query["department_id"] = filters.department_id
        _apply_date_filter(query, filters)

        cursor = db["carbon_transactions"].find(query)
        raw = await cursor.to_list(length=None)
        if not raw:
            return pd.DataFrame(
                columns=["date", "department_id", "source_type", "amount_co2e", "notes"]
            )

        df = pd.DataFrame(raw)
        df["_id"] = df["_id"].astype(str)
        df["date"] = pd.to_datetime(df.get("date", pd.NaT))
        df["amount_co2e"] = pd.to_numeric(df.get("amount_co2e", 0), errors="coerce").fillna(0)

        cols = [c for c in ["date", "department_id", "source_type", "amount_co2e", "notes"] if c in df.columns]
        return df[cols].sort_values("date", ascending=False)

    # ------------------------------------------------------------------ S
    async def generate_social_report(
        self, filters: ReportFilter, db: AsyncIOMotorDatabase
    ) -> pd.DataFrame:
        query: dict = {}
        if filters.department_id:
            query["department_id"] = filters.department_id

        activities_cursor = db["csr_activities"].find(query)
        activities = await activities_cursor.to_list(length=None)
        if not activities:
            return pd.DataFrame(
                columns=["activity_title", "department_id", "total_participants", "approved", "approval_rate_pct"]
            )

        rows: List[Dict] = []
        for act in activities:
            act_id = str(act["_id"])
            total = await db["csr_participations"].count_documents({"activity_id": act_id})
            approved = await db["csr_participations"].count_documents(
                {"activity_id": act_id, "status": "approved"}
            )
            rate = round((approved / total * 100), 2) if total else 0.0
            rows.append(
                {
                    "activity_id": act_id,
                    "activity_title": act.get("title", ""),
                    "department_id": act.get("department_id", ""),
                    "total_participants": total,
                    "approved": approved,
                    "approval_rate_pct": rate,
                    "xp_reward": act.get("xp_reward", 0),
                    "points_reward": act.get("points_reward", 0),
                }
            )
        return pd.DataFrame(rows)

    # ------------------------------------------------------------------ G
    async def generate_governance_report(
        self, filters: ReportFilter, db: AsyncIOMotorDatabase
    ) -> pd.DataFrame:
        query: dict = {}
        if filters.department_id:
            query["department_id"] = filters.department_id

        cursor = db["compliance_issues"].find(query)
        raw = await cursor.to_list(length=None)
        if not raw:
            return pd.DataFrame(
                columns=["title", "severity", "status", "department_id", "due_date", "is_overdue"]
            )

        df = pd.DataFrame(raw)
        df["_id"] = df["_id"].astype(str)
        now = datetime.utcnow()
        if "due_date" in df.columns:
            df["due_date"] = pd.to_datetime(df["due_date"])
            df["is_overdue"] = (df["due_date"] < now) & (~df["status"].isin(["resolved", "closed"]))
        cols = [c for c in ["title", "severity", "status", "department_id", "due_date", "is_overdue", "owner_id"] if c in df.columns]
        return df[cols]

    # ------------------------------------------------------------------ Summary
    async def generate_summary_report(
        self, filters: ReportFilter, db: AsyncIOMotorDatabase
    ) -> Dict[str, Any]:
        env_df = await self.generate_environmental_report(filters, db)
        soc_df = await self.generate_social_report(filters, db)
        gov_df = await self.generate_governance_report(filters, db)

        total_co2e = env_df["amount_co2e"].sum() if not env_df.empty else 0.0
        avg_approval = soc_df["approval_rate_pct"].mean() if not soc_df.empty else 0.0
        open_issues = int((gov_df["status"] == "open").sum()) if not gov_df.empty else 0
        overdue = int(gov_df["is_overdue"].sum()) if not gov_df.empty and "is_overdue" in gov_df else 0

        return {
            "total_co2e_tonnes": round(float(total_co2e), 4),
            "avg_csr_approval_rate": round(float(avg_approval), 2),
            "open_compliance_issues": open_issues,
            "overdue_compliance_issues": overdue,
            "environmental_rows": len(env_df),
            "social_rows": len(soc_df),
            "governance_rows": len(gov_df),
            "generated_at": datetime.utcnow().isoformat(),
        }

    # ------------------------------------------------------------------ Export helpers
    def export_to_csv(self, df: pd.DataFrame) -> bytes:
        return df.to_csv(index=False).encode("utf-8")

    def export_to_excel(self, df: pd.DataFrame) -> bytes:
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Report")
        return buf.getvalue()

    def export_to_pdf(self, df: pd.DataFrame, title: str = "ESG Report") -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [Paragraph(title, styles["Title"])]

        if df.empty:
            elements.append(Paragraph("No data available.", styles["Normal"]))
        else:
            # Truncate to avoid massive PDFs
            display_df = df.head(200).fillna("")
            table_data = [list(display_df.columns)] + [
                [str(v) for v in row] for row in display_df.values.tolist()
            ]
            t = Table(table_data, repeatRows=1)
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a6b3a")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 8),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
                        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ]
                )
            )
            elements.append(t)

        doc.build(elements)
        return buf.getvalue()


report_service = ReportService()
