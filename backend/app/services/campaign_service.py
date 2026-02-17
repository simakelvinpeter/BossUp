"""
Campaign Service
=================
Business logic for campaign CRUD and management.

Security:
- All operations require authenticated user
- Ownership checks for edit/delete
- Admin approval required for campaigns to go LIVE
"""

from datetime import datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel

from app.core.firebase import campaigns_collection
from app.core.security import log_audit_event


# =============================================================================
# MODELS
# =============================================================================

class CampaignStatus(str, Enum):
    """Campaign lifecycle status."""
    PENDING = "PENDING"      # Awaiting admin approval
    LIVE = "LIVE"            # Active and accepting investments
    REJECTED = "REJECTED"    # Admin rejected
    COMPLETED = "COMPLETED"  # Target reached
    CANCELLED = "CANCELLED"  # Owner cancelled


class CreateCampaignRequest(BaseModel):
    """Request to create a new campaign."""
    title: str
    description: str
    country: str
    target_amount: float
    category: Optional[str] = None
    image_url: Optional[str] = None
    business_plan_url: Optional[str] = None


class UpdateCampaignRequest(BaseModel):
    """Request to update campaign (owner only)."""
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None


class CampaignResponse(BaseModel):
    """Campaign data response."""
    campaign_id: str
    owner_id: str
    title: str
    description: str
    country: str
    target_amount: float
    raised_amount: float
    status: str
    category: Optional[str] = None
    image_url: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class CampaignListResponse(BaseModel):
    """List of campaigns response."""
    campaigns: List[CampaignResponse]
    total: int


# =============================================================================
# CAMPAIGN SERVICE
# =============================================================================

class CampaignService:
    """Campaign management service."""
    
    @staticmethod
    async def create_campaign(
        owner_id: str, 
        request: CreateCampaignRequest
    ) -> CampaignResponse:
        """
        Create a new campaign (Business Owner only).
        Campaign starts in PENDING status - requires admin approval.
        """
        campaign_data = {
            "owner_id": owner_id,
            "title": request.title,
            "description": request.description,
            "country": request.country,
            "target_amount": request.target_amount,
            "raised_amount": 0.0,
            "status": CampaignStatus.PENDING.value,
            "category": request.category,
            "image_url": request.image_url,
            "business_plan_url": request.business_plan_url,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Create document
        doc_ref = campaigns_collection().add(campaign_data)
        campaign_id = doc_ref[1].id
        
        # Audit log
        log_audit_event(
            action="CAMPAIGN_CREATED",
            user_id=owner_id,
            details={"campaign_id": campaign_id, "title": request.title}
        )
        
        return CampaignResponse(
            campaign_id=campaign_id,
            **campaign_data
        )
    
    @staticmethod
    async def get_campaign(campaign_id: str) -> CampaignResponse:
        """Get single campaign by ID."""
        doc = campaigns_collection().document(campaign_id).get()
        
        if not doc.exists:
            raise ValueError("Campaign not found")
        
        data = doc.to_dict()
        return CampaignResponse(campaign_id=campaign_id, **data)
    
    @staticmethod
    async def list_campaigns(
        status: Optional[CampaignStatus] = None,
        country: Optional[str] = None,
        owner_id: Optional[str] = None,
        limit: int = 50
    ) -> CampaignListResponse:
        """
        List campaigns with optional filters.
        
        - Public marketplace: status=LIVE
        - Owner dashboard: owner_id=current_user
        - Admin: all statuses
        """
        query = campaigns_collection()
        
        if status:
            query = query.where("status", "==", status.value)
        
        if country:
            query = query.where("country", "==", country)
        
        if owner_id:
            query = query.where("owner_id", "==", owner_id)
        
        query = query.limit(limit)
        docs = query.stream()
        
        campaigns = []
        for doc in docs:
            data = doc.to_dict()
            campaigns.append(CampaignResponse(campaign_id=doc.id, **data))
        
        return CampaignListResponse(
            campaigns=campaigns,
            total=len(campaigns)
        )
    
    @staticmethod
    async def update_campaign(
        campaign_id: str,
        owner_id: str,
        request: UpdateCampaignRequest
    ) -> CampaignResponse:
        """
        Update campaign (owner only, not after LIVE).
        """
        doc_ref = campaigns_collection().document(campaign_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise ValueError("Campaign not found")
        
        data = doc.to_dict()
        
        # Ownership check
        if data["owner_id"] != owner_id:
            raise PermissionError("You do not own this campaign")
        
        # Can't edit live campaigns
        if data["status"] == CampaignStatus.LIVE.value:
            raise ValueError("Cannot edit a live campaign")
        
        # Build update
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if request.title:
            update_data["title"] = request.title
        if request.description:
            update_data["description"] = request.description
        if request.target_amount:
            update_data["target_amount"] = request.target_amount
        if request.category:
            update_data["category"] = request.category
        if request.image_url:
            update_data["image_url"] = request.image_url
        
        doc_ref.update(update_data)
        
        # Return updated
        return await CampaignService.get_campaign(campaign_id)
    
    @staticmethod
    async def approve_campaign(
        campaign_id: str, 
        admin_id: str
    ) -> CampaignResponse:
        """
        Approve campaign (Admin only).
        Changes status from PENDING to LIVE.
        """
        doc_ref = campaigns_collection().document(campaign_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise ValueError("Campaign not found")
        
        data = doc.to_dict()
        
        if data["status"] != CampaignStatus.PENDING.value:
            raise ValueError("Only pending campaigns can be approved")
        
        doc_ref.update({
            "status": CampaignStatus.LIVE.value,
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": admin_id,
            "updated_at": datetime.utcnow().isoformat()
        })
        
        log_audit_event(
            action="CAMPAIGN_APPROVED",
            user_id=admin_id,
            details={"campaign_id": campaign_id}
        )
        
        return await CampaignService.get_campaign(campaign_id)
    
    @staticmethod
    async def reject_campaign(
        campaign_id: str, 
        admin_id: str,
        reason: str
    ) -> CampaignResponse:
        """
        Reject campaign (Admin only).
        """
        doc_ref = campaigns_collection().document(campaign_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise ValueError("Campaign not found")
        
        doc_ref.update({
            "status": CampaignStatus.REJECTED.value,
            "rejection_reason": reason,
            "rejected_at": datetime.utcnow().isoformat(),
            "rejected_by": admin_id,
            "updated_at": datetime.utcnow().isoformat()
        })
        
        log_audit_event(
            action="CAMPAIGN_REJECTED",
            user_id=admin_id,
            details={"campaign_id": campaign_id, "reason": reason}
        )
        
        return await CampaignService.get_campaign(campaign_id)
    
    @staticmethod
    async def update_raised_amount(campaign_id: str, amount: float) -> None:
        """
        Update raised amount after successful payment.
        Called by payment service.
        """
        doc_ref = campaigns_collection().document(campaign_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise ValueError("Campaign not found")
        
        data = doc.to_dict()
        new_raised = data.get("raised_amount", 0) + amount
        
        update_data = {
            "raised_amount": new_raised,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Check if target reached
        if new_raised >= data.get("target_amount", 0):
            update_data["status"] = CampaignStatus.COMPLETED.value
            update_data["completed_at"] = datetime.utcnow().isoformat()
        
        doc_ref.update(update_data)


# Singleton instance
campaign_service = CampaignService()
