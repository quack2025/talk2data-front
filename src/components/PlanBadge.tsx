import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type PlanKey = 'free' | 'starter' | 'growth' | 'professional' | 'enterprise' | 'freelancer' | 'pro';

const planStyles: Record<PlanKey, string> = {
  free:         'bg-muted text-muted-foreground',
  starter:      'bg-blue-100 text-blue-700',
  growth:       'bg-purple-100 text-purple-700',
  professional: 'bg-amber-100 text-amber-700',
  enterprise:   'bg-emerald-100 text-emerald-700',
  freelancer:   'bg-blue-100 text-blue-700',
  pro:          'bg-amber-100 text-amber-700',
};

const planDisplayNames: Record<PlanKey, string> = {
  free:         'Free',
  starter:      'Starter',
  growth:       'Growth',
  professional: 'Business',
  enterprise:   'Enterprise',
  freelancer:   'Starter',
  pro:          'Pro',
};

interface PlanBadgeProps {
  plan: string;
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const key = plan.toLowerCase() as PlanKey;
  const style = planStyles[key] ?? planStyles.free;
  const displayName = planDisplayNames[key] ?? plan;

  return (
    <Badge className={cn('whitespace-nowrap', style, className)}>
      {displayName}
    </Badge>
  );
}
