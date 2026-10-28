"""Campaign listing and owner management routes."""

from typing import Optional
from fastapi import Request
from fastapi import APIRouter, HTTPException, Depends, status as http_status, Query

from app.core.security import (
    security,
    UserRole,
    get_current_user,
    require_business_owner,
    require_investor_or_business,
    CurrentUser,
)
from app.services.campaign_service import (
    campaign_service,
    CampaignStatus,
    CreateCampaignRequest,
    UpdateCampaignRequest,
    CampaignResponse,
    CampaignListResponse,
)

router = APIRouter()


@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    status: Optional[CampaignStatus] = Query(
        CampaignStatus.LIVE, description="Filter by status"
    ),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
):
    """List campaigns (public marketplace)."""
    if status != CampaignStatus.LIVE:
        raise HTTPException(400, "The marketplace shows live campaigns only")
    try:
        campaigns = await campaign_service.list_campaigns(
            status=status, country=country, limit=limit
        )
        return campaigns
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaigns: {str(e)}",
        )


@router.get("/my", response_model=CampaignListResponse)
async def get_my_campaigns(user: CurrentUser = Depends(require_business_owner)):
    """
    Get campaigns owned by current user.

    Business Owner only.
    """
    try:
        campaigns = await campaign_service.list_campaigns(
            owner_id=user.user_id, status=None
        )
        return campaigns
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaigns: {str(e)}",
        )


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str, request: Request, credentials=Depends(security)
):
    """
    Get single campaign by ID.

    Public endpoint.
    """
    try:
        campaign = await campaign_service.get_campaign(campaign_id)
        if campaign.status not in ["LIVE", "COMPLETED"]:
            try:
                user = await get_current_user(request, credentials)
            except HTTPException:
                raise HTTPException(404, "Campaign not found") from None
            if user.user_id != campaign.owner_id and user.role != UserRole.ADMIN:
                raise HTTPException(404, "Campaign not found")
        return campaign
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "", response_model=CampaignResponse, status_code=http_status.HTTP_201_CREATED
)
async def create_campaign(
    request: CreateCampaignRequest, user: CurrentUser = Depends(require_business_owner)
):
    """Create a new campaign."""
    try:
        campaign = await campaign_service.create_campaign(
            owner_id=user.user_id, request=request
        )
        return campaign
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create campaign: {str(e)}",
        )


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    request: UpdateCampaignRequest,
    user: CurrentUser = Depends(require_business_owner),
):
    """
    Update campaign (owner only, before LIVE).

    Cannot edit campaigns that are already LIVE.
    """
    try:
        campaign = await campaign_service.update_campaign(
            campaign_id=campaign_id, owner_id=user.user_id, request=request
        )
        return campaign
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail=str(e))
