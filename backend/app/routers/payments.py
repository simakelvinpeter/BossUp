"""
Payments Router
================
Payment initiation and confirmation endpoints.

Endpoints:
- POST /payments/initiate - Start payment flow
- POST /payments/confirm - Webhook/callback to confirm
- GET /payments/{id} - Get transaction details
- GET /payments/my - Get user's transactions
- GET /payments/stub-checkout - Development checkout page
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import HTMLResponse

from app.core.security import (
    get_current_user,
    require_investor,
    CurrentUser
)
from app.services.payment_service import (
    payment_service,
    InitiatePaymentRequest,
    ConfirmPaymentRequest,
    PaymentSessionResponse,
    TransactionResponse,
    TransactionStatus
)

router = APIRouter()


@router.post("/initiate", response_model=PaymentSessionResponse)
async def initiate_payment(
    request: InitiatePaymentRequest,
    user: CurrentUser = Depends(require_investor)
):
    """
    Initiate payment flow.
    
    Investor only.
    
    1. Creates transaction record
    2. Creates gateway session
    3. Returns checkout URL
    """
    try:
        session = await payment_service.initiate_payment(
            user_id=user.user_id,
            request=request
        )
        return session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initiation failed: {str(e)}"
        )


@router.post("/confirm", response_model=TransactionResponse)
async def confirm_payment(request: ConfirmPaymentRequest):
    """
    Confirm payment (webhook/callback).
    
    Called by payment gateway webhook or frontend after redirect.
    Updates transaction status and campaign raised amount.
    """
    try:
        transaction = await payment_service.confirm_payment(request)
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment confirmation failed: {str(e)}"
        )


@router.get("/my", response_model=list[TransactionResponse])
async def get_my_transactions(
    user: CurrentUser = Depends(get_current_user)
):
    """
    Get current user's transactions.
    """
    try:
        transactions = await payment_service.get_user_transactions(user.user_id)
        return transactions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}"
        )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    user: CurrentUser = Depends(get_current_user)
):
    """
    Get single transaction by ID.
    
    User can only view their own transactions.
    """
    try:
        transaction = await payment_service.get_transaction(transaction_id)
        
        # Ownership check (or admin)
        if transaction.user_id != user.user_id:
            from app.core.security import UserRole
            if user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/stub-checkout", response_class=HTMLResponse)
async def stub_checkout_page(ref: str):
    """
    Stub checkout page for development.
    
    Replace with real payment gateway redirect in production.
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Checkout (Stub)</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 40px; text-align: center; }}
            .container {{ max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
            h2 {{ color: #333; }}
            p {{ color: #666; }}
            .btn {{ padding: 12px 24px; margin: 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }}
            .btn-success {{ background: #28a745; color: white; }}
            .btn-danger {{ background: #dc3545; color: white; }}
            .ref {{ font-family: monospace; background: #f5f5f5; padding: 8px; border-radius: 4px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🧪 Test Payment Gateway</h2>
            <p>Transaction Reference:</p>
            <p class="ref">{ref}</p>
            <p>This is a stub checkout page for development.</p>
            <hr>
            <button class="btn btn-success" onclick="confirmPayment('COMPLETED')">✅ Simulate Success</button>
            <button class="btn btn-danger" onclick="confirmPayment('FAILED')">❌ Simulate Failure</button>
        </div>
        <script>
            async function confirmPayment(status) {{
                const response = await fetch('/payments/confirm', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        transaction_id: '{ref}',
                        gateway_reference: 'stub_ref_' + Date.now(),
                        status: status
                    }})
                }});
                
                if (response.ok) {{
                    alert('Payment ' + status.toLowerCase() + '!');
                    window.location.href = '/payment-complete.html?status=' + status;
                }} else {{
                    alert('Error processing payment');
                }}
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)
