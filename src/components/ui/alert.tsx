"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AlertVariant = "default" | "destructive" | "warning" | "success"

const alertVariants = {
  default: "bg-white text-gray-900 border-gray-200",
  destructive: "border-red-300 bg-red-50 text-red-900 [&>svg]:text-red-600",
  warning: "border-orange-300 bg-orange-50 text-orange-900 [&>svg]:text-orange-600",
  success: "border-green-300 bg-green-50 text-green-900 [&>svg]:text-green-600",
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const baseClasses = "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground"
    const variantClasses = alertVariants[variant]
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(baseClasses, variantClasses, className)}
        {...props}
      />
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight text-gray-900", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export const CashbackAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="success" className={cn("", className)} {...props} />
))
CashbackAlert.displayName = "CashbackAlert"

const TeamCommissionAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="success" className={cn("", className)} {...props} />
))
TeamCommissionAlert.displayName = "TeamCommissionAlert"

const ReferralBonusAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="success" className={cn("", className)} {...props} />
))
ReferralBonusAlert.displayName = "ReferralBonusAlert"

const CommissionApprovalAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="success" className={cn("", className)} {...props} />
))
CommissionApprovalAlert.displayName = "CommissionApprovalAlert"

const ProductRecommendationAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
ProductRecommendationAlert.displayName = "ProductRecommendationAlert"

const WishlistAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
WishlistAlert.displayName = "WishlistAlert"

const ProductComparisonAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
ProductComparisonAlert.displayName = "ProductComparisonAlert"

const EnhancedAnalyticsAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
EnhancedAnalyticsAlert.displayName = "EnhancedAnalyticsAlert"

const MLMControlPanelAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
MLMControlPanelAlert.displayName = "MLMControlPanelAlert"

const MLMTreeVisualizationAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
MLMTreeVisualizationAlert.displayName = "MLMTreeVisualizationAlert"

const BulkProductManagementAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
BulkProductManagementAlert.displayName = "BulkProductManagementAlert"

const TaskSystemRefinementAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
TaskSystemRefinementAlert.displayName = "TaskSystemRefinementAlert"

const BlogPlatformAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
BlogPlatformAlert.displayName = "BlogPlatformAlert"

const RichTextEditorAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
RichTextEditorAlert.displayName = "RichTextEditorAlert"

const CategoriesAndTaggingAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
CategoriesAndTaggingAlert.displayName = "CategoriesAndTaggingAlert"

const CommentModerationAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
CommentModerationAlert.displayName = "CommentModerationAlert"

const SEOOptimizationAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
SEOOptimizationAlert.displayName = "SEOOptimizationAlert"

const ArticleEditorAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
ArticleEditorAlert.displayName = "ArticleEditorAlert"

const PublishingWorkflowAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
PublishingWorkflowAlert.displayName = "PublishingWorkflowAlert"

const BlogAnalyticsAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
BlogAnalyticsAlert.displayName = "BlogAnalyticsAlert"

const ContentCalendarAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
ContentCalendarAlert.displayName = "ContentCalendarAlert"

const InitialBlogContentAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
InitialBlogContentAlert.displayName = "InitialBlogContentAlert"

const SocialSharingAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
SocialSharingAlert.displayName = "SocialSharingAlert"

const NewsletterSubscriptionAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
NewsletterSubscriptionAlert.displayName = "NewsletterSubscriptionAlert"

const FeaturedArticlesAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
FeaturedArticlesAlert.displayName = "FeaturedArticlesAlert"

const RelatedPostsAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
RelatedPostsAlert.displayName = "RelatedPostsAlert"

const AutomatedTestingAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
AutomatedTestingAlert.displayName = "AutomatedTestingAlert"

const ManualTestingAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
ManualTestingAlert.displayName = "ManualTestingAlert"

const PerformanceOptimizationAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
PerformanceOptimizationAlert.displayName = "PerformanceOptimizationAlert"

const SecurityReviewAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Alert ref={ref} variant="default" className={cn("", className)} {...props} />
))
SecurityReviewAlert.displayName = "SecurityReviewAlert"

export { Alert, AlertTitle, AlertDescription } 