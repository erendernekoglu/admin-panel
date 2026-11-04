import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { subscriptionLabels } from "../labels"
import type { UserSubscription } from "../types"

const subscriptionTones: Record<UserSubscription, BadgeTone> = {
  free: "neutral",
  pro: "accent",
  premium: "ink",
}

export function UserSubscriptionBadge({
  subscription,
}: {
  subscription: UserSubscription
}) {
  return (
    <Badge tone={subscriptionTones[subscription] ?? "neutral"}>
      {subscriptionLabels[subscription] ?? subscription}
    </Badge>
  )
}
