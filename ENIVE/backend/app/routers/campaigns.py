"""
Campaigns Router
=================
Campaign CRUD and marketplace endpoints.

Endpoints:
- GET /campaigns - List campaigns (marketplace)
- GET /campaigns/{id} - Get single campaign
- POST /campaigns - Create campaign (Business Owner)
- PUT /campaigns/{id} - Update campaign (Owner only)
- GET /campaigns/my - Get owner's campaigns
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query

from app.core.security import (
    get_current_user,
    require_business_owner,
    require_investor_or_business,
    CurrentUser
)
from app.services.campaign_service import (
    campaign_service,
    CampaignStatus,
    CreateCampaignRequest,
    UpdateCampaignRequest,
    CampaignResponse,
    CampaignListResponse
)

router = APIRouter()


@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    status: Optional[CampaignStatus] = Query(CampaignStatus.LIVE, description="Filter by status"),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: int = Query(50, le=100, description="Max results")
):
    """
    List campaigns (public marketplace).
    
    Default: Only LIVE campaigns shown.
    Optionally filter by country.
    """
    try:
        campaigns = await campaign_service.list_campaigns(
            status=status,
            country=country,
            limit=limit
        )
        return campaigns
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaigns: {str(e)}"
        )


@router.get("/my", response_model=CampaignListResponse)
async def get_my_campaigns(
    user: CurrentUser = Depends(require_business_owner)
):
    """
    Get campaigns owned by current user.
    
    Business Owner only.
    """
    try:
        campaigns = await campaign_service.list_campaigns(
            owner_id=user.user_id,
            status=None  # Show all statuses for owner
        )
        return campaigns
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch campaigns: {str(e)}"
        )


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str):
    """
    Get single campaign by ID.
    
    Public endpoint.
    """
    try:
        campaign = await campaign_service.get_campaign(campaign_id)
        return campaign
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    request: CreateCampaignRequest,
    user: CurrentUser = Depends(require_business_owner)
):
    """
    Create a new campaign.
    
    Business Owner only.
    Campaign starts in PENDING status - requires admin approval.
    """
    try:
        campaign = await campaign_service.create_campaign(
            owner_id=user.user_id,
            request=request
        )
        return campaign
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create campaign: {str(e)}"
        )


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    request: UpdateCampaignRequest,
    user: CurrentUser = Depends(require_business_owner)
):
    """
    Update campaign (owner only, before LIVE).
    
    Cannot edit campaigns that are already LIVE.
    """
    try:
        campaign = await campaign_service.update_campaign(
            campaign_id=campaign_id,
            owner_id=user.user_id,
            request=request
        )
        return campaign
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
