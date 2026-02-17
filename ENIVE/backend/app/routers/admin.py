"""
Admin Router
=============
Administrative endpoints for campaign approval, user management, and audit logs.

Endpoints:
- GET /admin/campaigns/pending - List pending campaigns
- POST /admin/campaigns/{id}/approve - Approve campaign
- POST /admin/campaigns/{id}/reject - Reject campaign
- GET /admin/users - List users
- POST /admin/users/{id}/kyc - Update KYC status
- GET /admin/audit-logs - View audit logs
- GET /admin/stats - Platform statistics
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel
from datetime import datetime

from app.core.security import require_admin, CurrentUser, KYCStatus, log_audit_event
from app.core.firebase import (
    users_collection, 
    campaigns_collection, 
    transactions_collection,
    audit_logs_collection
)
from app.services.campaign_service import (
    campaign_service,
    CampaignStatus,
    CampaignResponse,
    CampaignListResponse
)
from app.services.auth_service import auth_service

router = APIRouter()


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class RejectCampaignRequest(BaseModel):
    """Request to reject a campaign."""
    reason: str


class UpdateKYCRequest(BaseModel):
    """Request to update user KYC status."""
    status: KYCStatus


class UserListItem(BaseModel):
    """User item in list response."""
    user_id: str
    email: str
    role: str
    country: str
    kyc_status: str
    created_at: str


class AuditLogItem(BaseModel):
    """Audit log entry."""
    log_id: str
    action: str
    user_id: str
    details: dict
    timestamp: str


class PlatformStats(BaseModel):
    """Platform statistics."""
    total_users: int
    total_campaigns: int
    live_campaigns: int
    pending_campaigns: int
    total_raised: float
    total_transactions: int


# =============================================================================
# CAMPAIGN MANAGEMENT
# =============================================================================

@router.get("/campaigns/pending", response_model=CampaignListResponse)
async def get_pending_campaigns(
    admin: CurrentUser = Depends(require_admin)
):
    """
    List all pending campaigns awaiting approval.
    
    Admin only.
    """
    try:
        campaigns = await campaign_service.list_campaigns(
            status=CampaignStatus.PENDING
        )
        return campaigns
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pending campaigns: {str(e)}"
        )


@router.get("/campaigns/all", response_model=CampaignListResponse)
async def get_all_campaigns(
    status_filter: Optional[CampaignStatus] = Query(None, alias="status"),
    admin: CurrentUser = Depends(require_admin)
):
    """
    List all campaigns (any status).
    
    Admin only.
    """
    try:
        campaigns = await campaign_service.list_campaigns(
            status=status_filter
        )
        return campaigns
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaigns: {str(e)}"
        )


@router.post("/campaigns/{campaign_id}/approve", response_model=CampaignResponse)
async def approve_campaign(
    campaign_id: str,
    admin: CurrentUser = Depends(require_admin)
):
    """
    Approve a pending campaign.
    
    Changes status from PENDING to LIVE.
    Admin only.
    """
    try:
        campaign = await campaign_service.approve_campaign(
            campaign_id=campaign_id,
            admin_id=admin.user_id
        )
        return campaign
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/campaigns/{campaign_id}/reject", response_model=CampaignResponse)
async def reject_campaign(
    campaign_id: str,
    request: RejectCampaignRequest,
    admin: CurrentUser = Depends(require_admin)
):
    """
    Reject a pending campaign.
    
    Admin only.
    """
    try:
        campaign = await campaign_service.reject_campaign(
            campaign_id=campaign_id,
            admin_id=admin.user_id,
            reason=request.reason
        )
        return campaign
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# =============================================================================
# USER MANAGEMENT
# =============================================================================

@router.get("/users", response_model=list[UserListItem])
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    kyc_status: Optional[str] = Query(None, description="Filter by KYC status"),
    limit: int = Query(50, le=200),
    admin: CurrentUser = Depends(require_admin)
):
    """
    List all users.
    
    Admin only.
    """
    try:
        query = users_collection()
        
        if role:
            query = query.where("role", "==", role)
        
        if kyc_status:
            query = query.where("kyc_status", "==", kyc_status)
        
        query = query.limit(limit)
        docs = query.stream()
        
        users = []
        for doc in docs:
            data = doc.to_dict()
            users.append(UserListItem(
                user_id=doc.id,
                email=data.get("email", ""),
                role=data.get("role", ""),
                country=data.get("country", ""),
                kyc_status=data.get("kyc_status", "PENDING"),
                created_at=data.get("created_at", "")
            ))
        
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )


@router.post("/users/{user_id}/kyc", response_model=dict)
async def update_user_kyc(
    user_id: str,
    request: UpdateKYCRequest,
    admin: CurrentUser = Depends(require_admin)
):
    """
    Update user KYC verification status.
    
    Admin only.
    """
    try:
        await auth_service.update_kyc_status(
            user_id=user_id,
            status=request.status,
            admin_id=admin.user_id
        )
        return {"message": "KYC status updated", "new_status": request.status.value}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update KYC status: {str(e)}"
        )


# =============================================================================
# AUDIT LOGS
# =============================================================================

@router.get("/audit-logs", response_model=list[AuditLogItem])
async def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[str] = Query(None, description="Filter by user"),
    limit: int = Query(100, le=500),
    admin: CurrentUser = Depends(require_admin)
):
    """
    View audit logs.
    
    Admin only.
    """
    try:
        query = audit_logs_collection().order_by("timestamp", direction="DESCENDING")
        
        if action:
            query = query.where("action", "==", action)
        
        if user_id:
            query = query.where("user_id", "==", user_id)
        
        query = query.limit(limit)
        docs = query.stream()
        
        logs = []
        for doc in docs:
            data = doc.to_dict()
            logs.append(AuditLogItem(
                log_id=doc.id,
                action=data.get("action", ""),
                user_id=data.get("user_id", ""),
                details=data.get("details", {}),
                timestamp=data.get("timestamp", "")
            ))
        
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch audit logs: {str(e)}"
        )


# =============================================================================
# PLATFORM STATISTICS
# =============================================================================

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    admin: CurrentUser = Depends(require_admin)
):
    """
    Get platform-wide statistics.
    
    Admin only.
    """
    try:
        # Count users
        users_query = users_collection().stream()
        total_users = sum(1 for _ in users_query)
        
        # Count campaigns
        all_campaigns = campaigns_collection().stream()
        campaigns_list = list(all_campaigns)
        total_campaigns = len(campaigns_list)
        
        live_campaigns = 0
        pending_campaigns = 0
        total_raised = 0.0
        
        for doc in campaigns_list:
            data = doc.to_dict()
            status = data.get("status", "")
            if status == "LIVE":
                live_campaigns += 1
            elif status == "PENDING":
                pending_campaigns += 1
            total_raised += data.get("raised_amount", 0)
        
        # Count transactions
        transactions_query = transactions_collection().stream()
        total_transactions = sum(1 for _ in transactions_query)
        
        return PlatformStats(
            total_users=total_users,
            total_campaigns=total_campaigns,
            live_campaigns=live_campaigns,
            pending_campaigns=pending_campaigns,
            total_raised=total_raised,
            total_transactions=total_transactions
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}"
        )
