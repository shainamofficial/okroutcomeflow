import { format } from "date-fns";
import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpcomingReview } from "@/hooks/useDashboardStats";

interface UpcomingReviewsProps {
  reviews: UpcomingReview[];
  isLoading?: boolean;
}

export function UpcomingReviews({ reviews, isLoading }: UpcomingReviewsProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-display">
          <div className="h-6 w-6 rounded-md bg-info/10 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-info" />
          </div>
          Upcoming Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming reviews</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/40"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{review.key_result.title}</p>
                  {review.key_result.owner && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {review.key_result.owner.name || review.key_result.owner.email}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                  {format(new Date(review.review_date), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
