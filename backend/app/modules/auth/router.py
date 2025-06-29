from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from app.modules.auth.schemas import (
    UserCreate, UserResponse, Token, UserInvite, UserInviteResponse,
    UserUpdate, UserListResponse, UserListItem, PasswordChange, PasswordChangeResponse
)
from app.modules.auth.services import (
    authenticate_user,
    create_user,
    create_access_token,
    get_current_user,
    require_admin_role,
    create_invited_user,
    get_users_by_firm,
    update_user_by_id,
    soft_delete_user,
    change_user_password,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate):
    """Register a new user."""
    try:
        new_user = create_user(user.dict())
        return UserResponse(
            email=new_user.email,
            name=new_user.name,
            role=new_user.role,
            firm_id=new_user.firm_id
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token."""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# User Management Endpoints (Admin only)
@router.get("/settings/users", response_model=UserListResponse)
def get_users(current_user = Depends(require_admin_role)):
    """Get all users in the firm (Admin only)."""
    users = get_users_by_firm(current_user.firm_id)
    user_items = []
    for user in users:
        user_items.append(UserListItem(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            status=getattr(user, 'status', 'active'),
            created_at=getattr(user, 'created_at', None),
            last_password_change=getattr(user, 'last_password_change', None)
        ))
    
    return UserListResponse(users=user_items, total=len(user_items))


@router.post("/settings/users/invite", response_model=UserInviteResponse)
def invite_user(invite_data: UserInvite, current_user = Depends(require_admin_role)):
    """Invite a new user to the firm (Admin only)."""
    try:
        new_user, temp_password = create_invited_user(invite_data.dict(), current_user.id)
        return UserInviteResponse(
            message="User invited successfully",
            user_id=new_user.id,
            email=new_user.email,
            temporary_password=temp_password,
            expires_at=new_user.password_expires_at or datetime.utcnow() + timedelta(days=7)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invite user: {str(e)}"
        )


@router.patch("/settings/users/{user_id}", response_model=UserResponse)
def update_user(user_id: str, update_data: UserUpdate, current_user = Depends(require_admin_role)):
    """Update user role or status (Admin only)."""
    try:
        # Prepare update dictionary
        update_dict = {}
        if update_data.role is not None:
            update_dict["role"] = update_data.role.value
        if update_data.status is not None:
            update_dict["status"] = update_data.status.value
        
        updated_user = update_user_by_id(user_id, update_dict, current_user)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or no changes made"
            )
        
        return UserResponse(
            id=updated_user.id,
            email=updated_user.email,
            name=updated_user.name,
            role=updated_user.role,
            firm_id=updated_user.firm_id,
            status=getattr(updated_user, 'status', 'active'),
            last_password_change=getattr(updated_user, 'last_password_change', None)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.delete("/settings/users/{user_id}")
def delete_user(user_id: str, current_user = Depends(require_admin_role)):
    """Soft delete a user (Admin only)."""
    try:
        success = soft_delete_user(user_id, current_user)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )


# Password Management
@router.post("/change-password", response_model=PasswordChangeResponse)
def change_password(password_data: PasswordChange, current_user = Depends(get_current_user)):
    """Change user's own password."""
    try:
        success = change_user_password(
            current_user.id,
            password_data.current_password,
            password_data.new_password
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to change password"
            )
        
        return PasswordChangeResponse(
            message="Password changed successfully",
            requires_relogin=True
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

