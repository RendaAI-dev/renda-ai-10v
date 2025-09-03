-- Add unique constraint on stripe_subscription_id to prevent duplicates
ALTER TABLE poupeja_subscriptions 
ADD CONSTRAINT unique_stripe_subscription_id 
UNIQUE (stripe_subscription_id);

-- Remove the unique constraint on user_id to allow multiple subscriptions per user during transitions
ALTER TABLE poupeja_subscriptions 
DROP CONSTRAINT IF EXISTS poupeja_subscriptions_user_id_key;