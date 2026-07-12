import io
import logging
import os
import uuid
from typing import Optional
import boto3
from botocore.exceptions import ClientError
import pandas as pd

from app.config import settings

logger = logging.getLogger(__name__)

LOCAL_UPLOAD_DIR = "static_uploads"


class S3Service:
    def __init__(self):
        self._client = None
        self._bucket = settings.S3_BUCKET_NAME

    def _get_client(self):
        if self._client is None:
            if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
                return None
            self._client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
        return self._client

    def upload_file(
        self, file_bytes: bytes, key: str, content_type: str = "application/octet-stream"
    ) -> str:
        """Upload raw bytes to S3 and return the public URL, falling back to local storage if not configured."""
        client = self._get_client()
        if client is None or not self._bucket:
            # Fall back to local file storage
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static_uploads"))
            local_path = os.path.join(base_dir, key.replace("/", os.sep))
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(file_bytes)
            # Return URL served by FastAPI static mount
            backend_url = settings.FRONTEND_URL.replace(":5173", ":8000")
            return f"{backend_url}/static_uploads/{key}"

        try:
            client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
            )
            return f"https://{self._bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        except ClientError as exc:
            logger.error("S3 upload failed for key %s: %s", key, exc)
            raise

    def generate_presigned_url(self, key: str, expires: int = 3600) -> str:
        """Generate a pre-signed GET URL for S3, falling back to local URL if not configured."""
        client = self._get_client()
        if client is None or not self._bucket:
            backend_url = settings.FRONTEND_URL.replace(":5173", ":8000")
            return f"{backend_url}/static_uploads/{key}"

        try:
            url = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=expires,
            )
            return url
        except ClientError as exc:
            logger.error("Presigned URL generation failed for key %s: %s", key, exc)
            raise

    def delete_file(self, key: str) -> None:
        """Delete an object from S3 or local directory."""
        client = self._get_client()
        if client is None or not self._bucket:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static_uploads"))
            local_path = os.path.join(base_dir, key.replace("/", os.sep))
            if os.path.exists(local_path):
                os.remove(local_path)
            return

        try:
            client.delete_object(Bucket=self._bucket, Key=key)
            logger.info("Deleted S3 object: %s", key)
        except ClientError as exc:
            logger.error("S3 delete failed for key %s: %s", key, exc)
            raise

    def upload_report(
        self, df: pd.DataFrame, filename: str, format: str = "csv"
    ) -> str:
        """
        Export a DataFrame to the requested format, upload to S3 (or local fallback),
        and return the URL.
        """
        format = format.lower()
        if format == "csv":
            data = df.to_csv(index=False).encode("utf-8")
            content_type = "text/csv"
            key = f"reports/{filename}.csv"
        elif format in ("excel", "xlsx"):
            buf = io.BytesIO()
            df.to_excel(buf, index=False, engine="openpyxl")
            data = buf.getvalue()
            content_type = (
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            key = f"reports/{filename}.xlsx"
        elif format == "pdf":
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet

            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=letter)
            styles = getSampleStyleSheet()
            elements = [Paragraph(filename, styles["Title"])]

            table_data = [list(df.columns)] + df.values.tolist()
            t = Table(table_data)
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a6b3a")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, 0), 11),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ]
                )
            )
            elements.append(t)
            doc.build(elements)
            data = buf.getvalue()
            content_type = "application/pdf"
            key = f"reports/{filename}.pdf"
        else:
            raise ValueError(f"Unsupported report format: {format}")

        return self.upload_file(data, key, content_type)


s3_service = S3Service()
