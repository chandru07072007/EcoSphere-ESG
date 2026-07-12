import logging
from datetime import datetime
from typing import List, Optional

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class EmissionEngine:
    """Calculates CO2e for transactions using emission factors stored in MongoDB."""

    async def calculate_and_store(
        self,
        source_type: str,
        source_id: Optional[str],
        department_id: str,
        quantity: float,
        unit: str,
        db: AsyncIOMotorDatabase,
        notes: Optional[str] = None,
    ) -> dict:
        """
        Look up the most recent emission factor for the given source_type,
        compute amount_co2e = quantity * coefficient, persist the transaction,
        and return the inserted document.
        """
        factor = await db["emission_factors"].find_one(
            {"source_type": source_type},
            sort=[("effective_date", -1)],
        )
        if not factor:
            raise ValueError(f"No emission factor found for source_type='{source_type}'")

        coefficient: float = factor["coefficient"]
        amount_co2e: float = round(quantity * coefficient, 6)

        doc = {
            "source_type": source_type,
            "source_id": source_id,
            "department_id": department_id,
            "amount_co2e": amount_co2e,
            "quantity": quantity,
            "unit": unit,
            "notes": notes,
            "emission_factor_id": str(factor["_id"]),
            "auto_generated": True,
            "date": datetime.utcnow(),
            "created_at": datetime.utcnow(),
        }

        result = await db["carbon_transactions"].insert_one(doc)
        doc["_id"] = result.inserted_id
        logger.info(
            "Emission transaction created: %.4f tCO2e for dept=%s src=%s",
            amount_co2e,
            department_id,
            source_type,
        )
        return doc

    async def batch_recalculate(
        self,
        department_id: str,
        start_date: datetime,
        end_date: datetime,
        db: AsyncIOMotorDatabase,
    ) -> List[dict]:
        """
        Fetch all carbon transactions for a department in a date range and
        aggregate them by source_type using Pandas.  Returns a list of
        {source_type, total_co2e, transaction_count} dicts.
        """
        query: dict = {"department_id": department_id}
        if start_date or end_date:
            query["date"] = {}
            if start_date:
                query["date"]["$gte"] = start_date
            if end_date:
                query["date"]["$lte"] = end_date

        cursor = db["carbon_transactions"].find(query)
        raw = await cursor.to_list(length=None)

        if not raw:
            return []

        df = pd.DataFrame(raw)
        df["amount_co2e"] = pd.to_numeric(df["amount_co2e"], errors="coerce").fillna(0)

        summary = (
            df.groupby("source_type")
            .agg(
                total_co2e=("amount_co2e", "sum"),
                transaction_count=("amount_co2e", "count"),
            )
            .reset_index()
        )

        return summary.to_dict(orient="records")


emission_engine = EmissionEngine()
