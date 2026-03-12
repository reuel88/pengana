# Auth Flow Test Coverage

> Color coding:
> - **Green** = Implemented AND tested
> - **Blue** = Implemented but NOT tested
> - **Orange** = NOT yet implemented

```mermaid
flowchart TB
    classDef green fill:#22c55e,stroke:#16a34a,color:#fff
    classDef blue fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef red fill:#f97316,stroke:#ea580c,color:#fff
    classDef header fill:#1e293b,stroke:#334155,color:#fff

    %% ===== SIGN UP =====
    sign_up_header["1. SIGN UP"]:::header
    sign_up_header --> signup_page_loads["Page loads"]:::green
    sign_up_header --> signup_happy_path["Happy path: name+email+password → /onboarding"]:::green
    sign_up_header --> signup_empty_fields["Empty fields show validation errors"]:::blue
    sign_up_header --> signup_invalid_email["Invalid email format rejected"]:::blue
    sign_up_header --> signup_short_password["Short password rejected (min 8)"]:::blue
    sign_up_header --> signup_short_name["Short name rejected (min 2)"]:::blue
    sign_up_header --> signup_duplicate_email["Duplicate email shows error toast"]:::blue
    sign_up_header --> signup_switch_to_login["Switch link navigates to /login"]:::blue
    sign_up_header --> signup_success_toast["Success toast appears"]:::blue

    %% ===== SIGN IN =====
    sign_in_header["2. SIGN IN"]:::header
    sign_in_header --> signin_page_loads["Page loads"]:::green
    sign_in_header --> signin_happy_path["Happy path: email+password → dashboard"]:::green
    sign_in_header --> signin_wrong_password["Wrong password → error toast, stays on /login"]:::green
    sign_in_header --> signin_nonexistent_email["Non-existent email → error toast"]:::blue
    sign_in_header --> signin_empty_fields["Empty fields show validation errors"]:::blue
    sign_in_header --> signin_invalid_email["Invalid email format rejected"]:::blue
    sign_in_header --> signin_switch_to_signup["Switch link navigates to /sign-up"]:::blue
    sign_in_header --> signin_already_authed["Already authenticated → redirect away"]:::blue

    %% ===== SIGN OUT =====
    sign_out_header["3. SIGN OUT"]:::header
    sign_out_header --> signout_from_onboarding["From onboarding → /login"]:::green
    sign_out_header --> signout_from_dashboard["From dashboard via UserMenu → /login"]:::blue
    sign_out_header --> signout_cookie_cleared["Session cookie cleared"]:::blue
    sign_out_header --> signout_routes_redirect["Protected routes redirect after sign-out"]:::blue

    %% ===== SESSION =====
    session_header["4. SESSION MANAGEMENT"]:::header
    session_header --> session_persists_reload["Session persists across page reload"]:::blue
    session_header --> session_expired_redirect["Expired session → redirect to /login"]:::blue
    session_header --> session_cookie_secure["Cookie is httpOnly & secure in prod"]:::blue
    session_header --> session_user_menu_data["UserMenu shows name/email from session"]:::blue

    %% ===== ROUTE GUARDS =====
    route_guards_header["5. ROUTE GUARDS"]:::header
    route_guards_header --> guard_unauth_home["Unauth at / → /login"]:::blue
    route_guards_header --> guard_unauth_org["Unauth at /org/* → /login"]:::blue
    route_guards_header --> guard_unauth_onboarding["Unauth at /onboarding → /login"]:::blue
    route_guards_header --> guard_auth_no_org["Auth without org at / → /onboarding"]:::blue
    route_guards_header --> guard_auth_with_org["Auth with org at / → dashboard"]:::blue
    route_guards_header --> guard_unauth_invitation["Unauth at /invitation/:id → /login"]:::blue

    %% ===== ONBOARDING (xState) =====
    onboarding_header["6. ONBOARDING FLOW"]:::header
    onboarding_header --> onboarding_unit_tests["Unit Tests (all passing)"]:::green
    onboarding_header --> onboarding_e2e_header["E2E Tests"]:::header
    onboarding_e2e_header --> onboarding_create_org_skip["Sign up → create org → skip invites → /"]:::green
    onboarding_e2e_header --> onboarding_view_accept_invite["Pending invitations → view → accept → /"]:::blue
    onboarding_e2e_header --> onboarding_skip_to_create["View invitations → skip → create org"]:::blue
    onboarding_e2e_header --> onboarding_invite_members["Create org → invite members → complete"]:::blue
    onboarding_e2e_header --> onboarding_back_to_invites["Back to invitations from create org"]:::blue

    %% ===== INVITATIONS =====
    invitation_header["7. INVITATION FLOW"]:::header
    invitation_header --> invitation_page_loads["/invitation/:id page loads"]:::blue
    invitation_header --> invitation_accept["Accept invitation → join org"]:::blue
    invitation_header --> invitation_reject["Reject invitation → navigate away"]:::blue
    invitation_header --> invitation_invalid_id["Invalid invitation ID → error"]:::blue
    invitation_header --> invitation_seat_assigned["Seat assigned on accept"]:::blue
    invitation_header --> invitation_notify_inviter["Inviter notified on accept/reject"]:::blue
    invitation_header --> invitation_polar_sync["Polar seat count synced on accept"]:::blue

    %% ===== FORGOT PASSWORD (NOT IMPLEMENTED) =====
    forgot_password_header["8. FORGOT PASSWORD"]:::header
    forgot_password_header --> forgot_pw_page["Forgot password page with email input"]:::red
    forgot_password_header --> forgot_pw_submit["Submit → sends reset email"]:::red
    forgot_password_header --> forgot_pw_no_leak["Non-existent email → generic success (no leak)"]:::red
    forgot_password_header --> forgot_pw_link["Link from sign-in page"]:::red
    forgot_password_header --> forgot_pw_rate_limit["Rate limited: 20 req/15min"]:::red

    %% ===== RESET PASSWORD (NOT IMPLEMENTED) =====
    reset_password_header["9. RESET PASSWORD"]:::header
    reset_password_header --> reset_pw_page["Reset page with new password field"]:::red
    reset_password_header --> reset_pw_valid_token["Valid token → password updated"]:::red
    reset_password_header --> reset_pw_invalid_token["Invalid token → error"]:::red
    reset_password_header --> reset_pw_expired_token["Expired token → error"]:::red
    reset_password_header --> reset_pw_redirect["After reset → redirect to /login"]:::red

    %% ===== EMAIL VERIFICATION (NOT IMPLEMENTED) =====
    email_verify_header["10. EMAIL VERIFICATION"]:::header
    email_verify_header --> email_verify_valid["Verify with valid token → emailVerified=true"]:::red
    email_verify_header --> email_verify_invalid["Invalid/expired token → error"]:::red
    email_verify_header --> email_verify_resend["Resend verification email"]:::red
    email_verify_header --> email_verify_gate["Gate unverified users (if enforced)"]:::red

    %% ===== CHANGE PASSWORD (NOT IMPLEMENTED) =====
    change_password_header["11. CHANGE PASSWORD"]:::header
    change_password_header --> change_pw_correct["Correct old password → success"]:::red
    change_password_header --> change_pw_wrong["Wrong old password → error"]:::red
    change_password_header --> change_pw_validation["New password validation (min 8)"]:::red
    change_password_header --> change_pw_requires_auth["Requires authenticated session"]:::red

    %% ===== RATE LIMITING =====
    rate_limit_header["12. RATE LIMITING"]:::header
    rate_limit_header --> rate_limit_signin["Sign-in: 20 req/15min → 429"]:::blue
    rate_limit_header --> rate_limit_signup["Sign-up: 20 req/15min → 429"]:::blue
    rate_limit_header --> rate_limit_global["Global: 120 req/min → 429"]:::blue

    %% ===== SECURITY EDGE CASES =====
    security_header["13. SECURITY & EDGE CASES"]:::header
    security_header --> security_xss["XSS in name/email fields sanitized"]:::blue
    security_header --> security_sql_injection["SQL injection in inputs handled"]:::blue
    security_header --> security_cors["CORS rejects unauthorized origins"]:::blue
    security_header --> security_concurrent_signup["Concurrent sign-up with same email"]:::blue
    security_header --> security_long_input["Very long input strings handled"]:::blue

    %% ===== MULTI-APP =====
    multi_app_header["14. MULTI-APP AUTH"]:::header
    multi_app_header --> multi_app_native_signup["Native (Expo) sign-up"]:::blue
    multi_app_header --> multi_app_native_signin["Native (Expo) sign-in"]:::blue
    multi_app_header --> multi_app_extension["Extension auth state"]:::blue
```

## Coverage Summary

| Category | Tested | Untested | Not Implemented |
|---|---|---|---|
| Sign Up | 2 | 7 | 0 |
| Sign In | 3 | 5 | 0 |
| Sign Out | 1 | 3 | 0 |
| Session | 0 | 4 | 0 |
| Route Guards | 0 | 6 | 0 |
| Onboarding (unit) | 9 | 0 | 0 |
| Onboarding (E2E) | 1 | 4 | 0 |
| Invitations | 0 | 7 | 0 |
| Forgot Password | 0 | 0 | 5 |
| Reset Password | 0 | 0 | 5 |
| Email Verification | 0 | 0 | 4 |
| Change Password | 0 | 0 | 4 |
| Rate Limiting | 0 | 3 | 0 |
| Security | 0 | 5 | 0 |
| Multi-App | 0 | 3 | 0 |
| **Totals** | **16** | **47** | **18** |
