# Verified credit delivery

1. Apply the credit grant migration and deploy the webhook to a separate Supabase test project. Set `RITUEL_REVENUECAT_APP_ID` to the expected RevenueCat iOS app ID, set `RITUEL_REVENUECAT_ENVIRONMENT` to `sandbox`, and configure a unique shared webhook bearer secret on both sides. Use the secret store for each service.
2. Set RevenueCat to deliver sandbox `NON_RENEWING_PURCHASE` events for the Rituel iOS app. Put the products in the separate RevenueCat offering `verified-credits-v2`. Build against the sandbox project with `EXPO_PUBLIC_VERIFIED_CREDIT_ENVIRONMENT=sandbox`. Test the three versioned `.v2` products with synthetic signed-in accounts. Verify one credit grant after a duplicate event, a temporary database outage, and an app restart.
3. Release the updated checkout with server delivery for the new products. Keep the versioned products out of offerings used by older builds. Keep production disabled until client purchase and refund reconciliation have been tested. Revoke legacy client write privileges only after older builds have been retired or their behavior has been handled explicitly.
4. Reconcile purchases from older builds separately. The legacy local queue contains no verified transaction identifier or account owner, so it cannot be replayed automatically.

A 503 response leaves the event eligible for RevenueCat retry. After retry exhaustion, inspect only operational status and replay the verified event through the RevenueCat dashboard. A repeated transaction can never increase the same balance twice through the new grant function.
