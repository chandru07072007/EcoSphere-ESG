import logging
from typing import Any, Dict, List

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

_DEFAULT_WEIGHTS = {"e_weight": 40.0, "s_weight": 30.0, "g_weight": 30.0}


async def _get_weights(db: AsyncIOMotorDatabase) -> Dict[str, float]:
    cfg = await db["settings"].find_one({"_type": "org_settings"})
    if cfg:
        return {
            "e_weight": cfg.get("e_weight", 40.0),
            "s_weight": cfg.get("s_weight", 30.0),
            "g_weight": cfg.get("g_weight", 30.0),
        }
    return _DEFAULT_WEIGHTS


class ScoringEngine:
    """
    Computes ESG scores at both department and organisation level.

    Environmental  – carbon reduction % vs the department goal.
    Social         – average CSR participation approval rate.
    Governance     – resolved / total compliance issues ratio.
    Total          – weighted sum using org-level weights (sum must equal 100).
    """

    # ------------------------------------------------------------------ helpers
    @staticmethod
    def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
        return max(lo, min(hi, value))

    async def _environmental_score(
        self, department_id: str, db: AsyncIOMotorDatabase
    ) -> float:
        """Carbon reduction % vs the department's target."""
        goal = await db["environmental_goals"].find_one(
            {"department_id": department_id}
        )
        if not goal:
            return 50.0  # neutral score when no goal set

        target: float = goal.get("target_reduction_pct", 0.0) or 0.0
        if target == 0:
            return 50.0

        # Aggregate actual CO2e for current period vs baseline
        pipeline = [
            {"$match": {"department_id": department_id}},
            {"$group": {"_id": None, "total": {"$sum": "$amount_co2e"}}},
        ]
        result = await db["carbon_transactions"].aggregate(pipeline).to_list(1)
        actual_total: float = result[0]["total"] if result else 0.0

        baseline: float = goal.get("baseline_co2e", 0.0) or actual_total or 1.0
        reduction_pct: float = ((baseline - actual_total) / baseline) * 100

        # Map reduction onto a 0-100 score (target = 100)
        score = self._clamp((reduction_pct / target) * 100)
        return round(score, 2)

    async def _social_score(
        self, department_id: str, db: AsyncIOMotorDatabase
    ) -> float:
        """Avg approval rate across CSR activities for the department."""
        activities_cursor = db["csr_activities"].find({"department_id": department_id})
        activities = await activities_cursor.to_list(length=None)
        if not activities:
            return 50.0

        rates: List[float] = []
        for act in activities:
            activity_id = str(act["_id"])
            total = await db["csr_participations"].count_documents(
                {"activity_id": activity_id}
            )
            approved = await db["csr_participations"].count_documents(
                {"activity_id": activity_id, "status": "approved"}
            )
            if total > 0:
                rates.append((approved / total) * 100)

        return round(sum(rates) / len(rates), 2) if rates else 50.0

    async def _governance_score(
        self, department_id: str, db: AsyncIOMotorDatabase
    ) -> float:
        """Resolved / total compliance issues ratio."""
        total = await db["compliance_issues"].count_documents(
            {"department_id": department_id}
        )
        if total == 0:
            return 80.0  # no issues → good governance baseline

        resolved = await db["compliance_issues"].count_documents(
            {"department_id": department_id, "status": {"$in": ["resolved", "closed"]}}
        )
        return round((resolved / total) * 100, 2)

    # ------------------------------------------------------------------ public
    async def get_department_score(
        self, department_id: str, db: AsyncIOMotorDatabase
    ) -> Dict[str, Any]:
        weights = await _get_weights(db)

        env_score = await self._environmental_score(department_id, db)
        soc_score = await self._social_score(department_id, db)
        gov_score = await self._governance_score(department_id, db)

        total = round(
            (env_score * weights["e_weight"] / 100)
            + (soc_score * weights["s_weight"] / 100)
            + (gov_score * weights["g_weight"] / 100),
            2,
        )

        return {
            "department_id": department_id,
            "environmental": env_score,
            "social": soc_score,
            "governance": gov_score,
            "total": total,
            "weights": weights,
        }

    async def get_overall_score(self, db: AsyncIOMotorDatabase) -> Dict[str, Any]:
        """Average ESG scores across all departments."""
        dept_cursor = db["departments"].find({"status": "active"})
        departments = await dept_cursor.to_list(length=None)

        if not departments:
            return {
                "environmental": 0.0,
                "social": 0.0,
                "governance": 0.0,
                "total": 0.0,
                "department_scores": [],
            }

        dept_scores: List[Dict] = []
        for dept in departments:
            dept_id = str(dept["_id"])
            score = await self.get_department_score(dept_id, db)
            score["department_name"] = dept.get("name", "")
            dept_scores.append(score)

        env_avg = round(sum(s["environmental"] for s in dept_scores) / len(dept_scores), 2)
        soc_avg = round(sum(s["social"] for s in dept_scores) / len(dept_scores), 2)
        gov_avg = round(sum(s["governance"] for s in dept_scores) / len(dept_scores), 2)
        tot_avg = round(sum(s["total"] for s in dept_scores) / len(dept_scores), 2)

        return {
            "environmental": env_avg,
            "social": soc_avg,
            "governance": gov_avg,
            "total": tot_avg,
            "department_scores": dept_scores,
        }


scoring_engine = ScoringEngine()
