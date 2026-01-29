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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming Reviews (Next 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming reviews</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-start justify-between p-3 rounded-md bg-muted/50"
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
                <span className="text-xs text-muted-foreground whitespace-nowrap">
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
